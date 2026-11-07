from __future__ import annotations

from pathlib import Path

from backend.app.models import LineConfig, Machine, Operation, OptimizeRequest, Worker
from backend.app.sample_data import MACHINES, SAMPLE_REQUEST

CASES_DIR = Path(__file__).resolve().parent / "cases"

NEW_OPERATION_SPECS = [
    ("OP410", "Cắt vải túi", 18, None, "FINISHING", 1, False),
    ("OP420", "Ép mex túi", 22, "IRON", "FINISHING", 2, False),
    ("OP430", "May viền túi", 30, "SINGLE", "SEWING", 2, False),
    ("OP440", "Diễu viền túi", 24, "SINGLE", "SEWING", 2, False),
    ("OP450", "Kiểm tra túi phụ", 16, None, "INSPECTION", 2, True),
    ("OP460", "In nhãn", 20, None, "FINISHING", 1, False),
    ("OP470", "Ép nhãn", 18, "IRON", "FINISHING", 2, False),
    ("OP480", "May nhãn", 22, "SINGLE", "SEWING", 2, False),
    ("OP490", "Kiểm tra nhãn", 14, None, "INSPECTION", 2, False),
    ("OP500", "Dán mã vạch", 12, None, "FINISHING", 1, False),
]

TAIL_ANCHORS = {"OP410": "OP400", "OP460": "OP270"}
STRESS_ANCHORS = {"OP410": "OP010", "OP460": "OP010"}


def _new_operations(anchors: dict[str, str]) -> list[Operation]:
    operations: list[Operation] = []
    previous_by_branch: dict[str, str] = {}
    for op_id, name, sam, machine, skill, grade, gate in NEW_OPERATION_SPECS:
        branch = "A" if op_id < "OP460" else "B"
        anchor = anchors["OP410"] if branch == "A" else anchors["OP460"]
        predecessors = [previous_by_branch.get(branch, anchor)]
        previous_by_branch[branch] = op_id
        operations.append(
            Operation(
                id=op_id,
                name=name,
                sam_sec=sam,
                predecessors=predecessors,
                machine_type=machine,
                skill_code=skill,
                skill_required=grade,
                is_quality_gate=gate,
                sequence=int(op_id[2:]),
            )
        )
    return operations


def _extend_sample(*, tail: bool) -> OptimizeRequest:
    request = SAMPLE_REQUEST.model_copy(deep=True)
    request.line_name = "Benchmark 50 operations / 25 workers"
    request.style_code = "BENCH-50X25"
    request.actuals = None
    request.headcount_standard = None
    request.baseline_assignment = None
    request.daily_actuals = []
    request.downtime_events = []
    request.config.max_workers = 25
    request.config.target_qty = 420
    request.config.solver_time_limit_sec = 60
    request.config.objective = "min_bottleneck"

    anchors = TAIL_ANCHORS if tail else STRESS_ANCHORS
    extra_operations = _new_operations(anchors)
    request.operations = [*request.operations, *extra_operations]

    if not tail:
        inspection = next(op for op in request.operations if op.id == "OP190")
        inspection.predecessors = [
            *inspection.predecessors,
            "OP450",
            "OP500",
        ]

    _expand_skills(request)
    request.workers = [
        *request.workers,
        _universal_worker(request.operations),
    ]

    if tail:
        extra_machines = [
            *[
                Machine(id=f"OL-B{index:02d}", machine_type="OVERLOCK")
                for index in range(1, 5)
            ],
            *[
                Machine(id=f"CS-B{index:02d}", machine_type="COVERSTITCH")
                for index in range(1, 4)
            ],
            *[
                Machine(id=f"SN-B{index:02d}", machine_type="SINGLE")
                for index in range(1, 4)
            ],
            *[
                Machine(id=f"IR-B{index:02d}", machine_type="IRON")
                for index in range(1, 3)
            ],
        ]
    else:
        extra_machines = [
            *[
                Machine(id=f"SN-B{index:02d}", machine_type="SINGLE")
                for index in range(1, 4)
            ],
            *[
                Machine(id=f"IR-B{index:02d}", machine_type="IRON")
                for index in range(1, 3)
            ],
        ]
    request.machines = [*MACHINES, *extra_machines]
    return request


def _expand_skills(request: OptimizeRequest) -> None:
    anchor_by_skill: dict[str, str] = {}
    for operation in request.operations:
        anchor_by_skill.setdefault(operation.skill_code, operation.id)
    for worker in request.workers:
        for operation in request.operations:
            if operation.id in worker.skills:
                continue
            anchor = anchor_by_skill[operation.skill_code]
            grade = worker.skills.get(anchor, 0)
            if grade > 0:
                worker.skills[operation.id] = grade


def _universal_worker(operations: list[Operation]) -> Worker:
    return Worker(
        id="W25",
        name="Benchmark Operator 25",
        skills={
            operation.id: max(
                3 if operation.skill_code == "SEWING" else 2,
                operation.skill_required,
            )
            for operation in operations
        },
        machine_types=["OVERLOCK", "COVERSTITCH", "SINGLE", "IRON"],
        available=True,
        worker_status="ACTIVE",
    )


def build_balanced() -> OptimizeRequest:
    operations = [
        Operation(
            id=f"OP{index:03d}",
            name=f"Balanced operation {index:03d}",
            sam_sec=25.0,
            predecessors=[f"OP{index - 1:03d}"] if index > 1 else [],
            machine_type="SINGLE",
            skill_code="SEWING",
            skill_required=2,
            sequence=index,
        )
        for index in range(1, 51)
    ]
    workers = [
        Worker(
            id=f"W{index:02d}",
            name=f"Benchmark operator {index:02d}",
            skills={operation.id: 2 for operation in operations},
            machine_types=["SINGLE"],
            available=True,
            worker_status="ACTIVE",
        )
        for index in range(1, 26)
    ]
    machines = [
        Machine(id=f"SN-{index:02d}", machine_type="SINGLE") for index in range(1, 26)
    ]
    return OptimizeRequest(
        line_name="Balanced 50 operations / 25 workers",
        style_code="BENCH-50X25-BAL",
        config=LineConfig(
            shift_id="SHIFT_01",
            shift_name="Shift 1",
            shift_minutes=480,
            break_minutes=30,
            target_qty=420,
            working_days=5,
            sam_basis="INCLUDES_ALLOWANCE",
            allowance_pct=0.0,
            planned_efficiency=0.85,
            max_workers=25,
            solver_time_limit_sec=60,
            objective="min_bottleneck",
        ),
        operations=operations,
        workers=workers,
        machines=machines,
    )


CASE_BUILDERS = {
    "balanced_50x25": build_balanced,
    "extended_50x25": lambda: _extend_sample(tail=True),
    "stress_50x25": lambda: _extend_sample(tail=False),
}


def write_cases() -> None:
    CASES_DIR.mkdir(parents=True, exist_ok=True)
    for name, builder in CASE_BUILDERS.items():
        request = builder()
        path = CASES_DIR / f"{name}.json"
        path.write_text(
            request.model_dump_json(indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {path} ({len(request.operations)} operations)")


if __name__ == "__main__":
    write_cases()
