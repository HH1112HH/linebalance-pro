from __future__ import annotations

import pytest

from backend.app.models import ProcessFlowRequest, ReadinessEvaluationRequest
from backend.app.style_setup import build_process_flow, evaluate_readiness


def test_readiness_counts_only_required_items_and_lists_blockers() -> None:
    request = ReadinessEvaluationRequest.model_validate(
        {
            "style_code": " TEE-001 ",
            "items": [
                {
                    "key": "routing",
                    "label": "Approved routing",
                    "required": True,
                    "status": "COMPLETED",
                },
                {
                    "key": "material",
                    "label": "Material ready",
                    "required": True,
                    "status": "IN_PROGRESS",
                },
                {
                    "key": "trial",
                    "label": "Production trial",
                    "required": False,
                    "status": "BLOCKED",
                },
            ],
        }
    )

    result = evaluate_readiness(request)

    assert result.style_code == "TEE-001"
    assert result.readiness_pct == 50.0
    assert result.ready is False
    assert result.blocking_items == ["material", "trial"]


def test_readiness_is_ready_only_when_required_items_complete_and_unblocked() -> None:
    request = ReadinessEvaluationRequest.model_validate(
        {
            "style_code": "TEE-001",
            "items": [
                {
                    "key": "routing",
                    "label": "Approved routing",
                    "required": True,
                    "status": "COMPLETED",
                },
                {
                    "key": "optional_trial",
                    "label": "Optional trial note",
                    "required": False,
                    "status": "NOT_STARTED",
                },
            ],
        }
    )

    result = evaluate_readiness(request)

    assert result.readiness_pct == 100.0
    assert result.ready is True
    assert result.blocking_items == []


@pytest.mark.parametrize(
    ("items", "message"),
    [
        (
            [
                {"key": "routing", "label": "Routing"},
                {"key": "routing", "label": "Routing again"},
            ],
            "keys must be unique",
        ),
        (
            [{"key": "optional", "label": "Optional", "required": False}],
            "At least one readiness item",
        ),
    ],
)
def test_readiness_rejects_ambiguous_checklists(
    items: list[dict[str, object]], message: str
) -> None:
    request = ReadinessEvaluationRequest.model_validate(
        {"style_code": "TEE-001", "items": items}
    )

    with pytest.raises(ValueError, match=message):
        evaluate_readiness(request)


def _flow_request(
    *, assignments: list[dict[str, object]] | None = None
) -> ProcessFlowRequest:
    return ProcessFlowRequest.model_validate(
        {
            "style_code": "TEE-001",
            "operations": [
                {
                    "id": "OP30",
                    "name": "Join panels",
                    "sam_sec": 30,
                    "predecessors": ["OP10", "OP20"],
                    "sequence": 3,
                },
                {
                    "id": "OP20",
                    "name": "Prepare sleeve",
                    "sam_sec": 20,
                    "predecessors": ["OP10"],
                    "sequence": 2,
                    "machine_type": "OVERLOCK",
                },
                {
                    "id": "OP10",
                    "name": "Prepare body",
                    "sam_sec": 10,
                    "sequence": 1,
                },
                {
                    "id": "OP40",
                    "name": "Final check",
                    "sam_sec": 12,
                    "predecessors": ["OP30"],
                    "sequence": 4,
                    "is_quality_gate": True,
                },
            ],
            "assignments": assignments or [],
        }
    )


def test_process_flow_is_deterministic_and_preserves_dag_and_assignment() -> None:
    request = _flow_request(
        assignments=[
            {
                "operation_id": "OP10",
                "station": 1,
                "worker_id": "W1",
                "worker_name": "Worker 1",
            },
            {
                "operation_id": "OP20",
                "station": 2,
                "worker_id": "W2",
                "worker_name": "Worker 2",
            },
            {
                "operation_id": "OP30",
                "station": 3,
                "worker_id": "W3",
                "worker_name": "Worker 3",
            },
            {
                "operation_id": "OP40",
                "station": 4,
                "worker_id": "W4",
                "worker_name": "Worker 4",
            },
        ]
    )

    result = build_process_flow(request)

    assert [node.operation_id for node in result.nodes] == [
        "OP10",
        "OP20",
        "OP30",
        "OP40",
    ]
    assert [(node.operation_id, node.layer, node.order) for node in result.nodes] == [
        ("OP10", 0, 0),
        ("OP20", 1, 0),
        ("OP30", 2, 0),
        ("OP40", 3, 0),
    ]
    assert [(edge.source, edge.target) for edge in result.edges] == [
        ("OP10", "OP20"),
        ("OP10", "OP30"),
        ("OP20", "OP30"),
        ("OP30", "OP40"),
    ]
    assert result.has_assignment is True
    assert result.nodes[-1].station == 4
    assert result.nodes[-1].worker_name == "Worker 4"
    assert result.nodes[-1].is_quality_gate is True


def test_process_flow_without_assignment_is_routing_only() -> None:
    result = build_process_flow(_flow_request())

    assert result.has_assignment is False
    assert all(node.station is None for node in result.nodes)
    assert all(node.worker_id is None for node in result.nodes)
    assert len(result.edges) == 4


@pytest.mark.parametrize(
    ("operations", "message"),
    [
        (
            [
                {"id": "OP1", "name": "First", "sam_sec": 10},
                {"id": "OP1", "name": "Duplicate", "sam_sec": 10},
            ],
            "Operation IDs must be unique",
        ),
        (
            [
                {
                    "id": "OP1",
                    "name": "First",
                    "sam_sec": 10,
                    "predecessors": ["MISSING"],
                }
            ],
            "references missing predecessor",
        ),
        (
            [
                {
                    "id": "OP1",
                    "name": "First",
                    "sam_sec": 10,
                    "predecessors": ["OP2"],
                },
                {
                    "id": "OP2",
                    "name": "Second",
                    "sam_sec": 10,
                    "predecessors": ["OP1"],
                },
            ],
            "precedence cycle",
        ),
    ],
)
def test_process_flow_rejects_invalid_precedence(
    operations: list[dict[str, object]], message: str
) -> None:
    request = ProcessFlowRequest.model_validate(
        {"style_code": "TEE-001", "operations": operations}
    )

    with pytest.raises(ValueError, match=message):
        build_process_flow(request)


def test_process_flow_rejects_incomplete_optimized_assignments() -> None:
    request = _flow_request(
        assignments=[
            {
                "operation_id": "OP10",
                "station": 1,
                "worker_id": "W1",
                "worker_name": "Worker 1",
            }
        ]
    )

    with pytest.raises(ValueError, match="assign every operation once"):
        build_process_flow(request)
