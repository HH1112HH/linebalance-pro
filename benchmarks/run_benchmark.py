from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import sys
import time
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

from backend.app.models import OptimizeRequest
from backend.app.optimizer import SOLVER_BACKEND, SOLVER_THREADS, solve_line_balancing

from .build_cases import CASE_BUILDERS

CASES_DIR = Path(__file__).resolve().parent / "cases"


def _package_version(name: str) -> str:
    try:
        return version(name)
    except PackageNotFoundError:
        return "not installed"


def environment_info() -> dict[str, object]:
    return {
        "python": platform.python_version(),
        "platform": platform.platform(),
        "cpu_count": os.cpu_count(),
        "solver_backend": SOLVER_BACKEND,
        "solver_threads": SOLVER_THREADS,
        "pulp": _package_version("pulp"),
        "highspy": _package_version("highspy"),
    }


def load_case(name: str) -> tuple[OptimizeRequest, str]:
    path = CASES_DIR / f"{name}.json"
    raw = path.read_bytes()
    fixture_sha = hashlib.sha256(raw).hexdigest()
    return OptimizeRequest.model_validate_json(raw), fixture_sha


def run_case(name: str) -> dict[str, object]:
    request, fixture_sha = load_case(name)
    print(
        f"[benchmark] {name}: {len(request.operations)} ops, "
        f"{len(request.workers)} workers, {request.config.solver_time_limit_sec}s limit",
        file=sys.stderr,
        flush=True,
    )
    started = time.perf_counter()
    result = solve_line_balancing(request)
    wall = time.perf_counter() - started
    kpis = result.kpis
    print(
        f"[benchmark] {name}: {result.status} / {result.solver_status} "
        f"in {wall:.2f}s wall",
        file=sys.stderr,
        flush=True,
    )
    return {
        "case": name,
        "fixture_sha256": fixture_sha,
        "input_hash": result.metadata.input_hash,
        "data_version": result.metadata.data_version,
        "model_version": result.metadata.model_version,
        "solver_version": result.metadata.solver_version,
        "status": result.status,
        "solver_status": result.solver_status,
        "lexicographic_proven": result.metadata.lexicographic_proven,
        "stage1_objective": result.metadata.stage1_objective,
        "stage2_objective": result.metadata.stage2_objective,
        "solve_time_sec": result.metadata.solve_time_sec,
        "wall_time_sec": round(wall, 3),
        "operations": len(request.operations),
        "workers_available": len(request.workers),
        "workers_used": kpis.workers_used if kpis else len(result.stations),
        "stations": len(result.stations),
        "bottleneck_station": kpis.bottleneck_station if kpis else None,
        "bottleneck_load_sec": kpis.bottleneck_load_sec if kpis else None,
        "capacity_per_shift": kpis.capacity_per_shift if kpis else None,
        "balance_efficiency_pct": kpis.balance_efficiency_pct if kpis else None,
        "target_qty": kpis.target_qty if kpis else request.config.target_qty,
        "target_achievement_pct": kpis.target_achievement_pct if kpis else None,
        "meets_target": kpis.meets_target if kpis else None,
        "warnings": len(result.warnings),
        "critical_warnings": sum(
            1 for warning in result.warnings if warning.severity == "critical"
        ),
        "warning_codes": sorted({warning.code for warning in result.warnings}),
        "config": {
            "max_workers": request.config.max_workers,
            "target_qty": request.config.target_qty,
            "solver_time_limit_sec": request.config.solver_time_limit_sec,
            "objective": request.config.objective,
            "planned_efficiency": request.config.planned_efficiency,
        },
        "environment": environment_info(),
    }


def markdown_table(summaries: list[dict[str, object]]) -> str:
    lines = [
        "| Case | Ops | Workers | Limit | Status | Proven | Bottleneck | Capacity | Solve time |",
        "|---|---:|---:|---:|---|---:|---:|---:|---:|",
    ]
    for summary in summaries:
        lines.append(
            "| {case} | {operations} | {workers_used}/{workers_available} | "
            "{limit}s | `{status}` | {proven} | {bottleneck}s | {capacity} | "
            "{solve_time}s |".format(
                case=summary["case"],
                operations=summary["operations"],
                workers_used=summary["workers_used"],
                workers_available=summary["workers_available"],
                limit=summary["config"]["solver_time_limit_sec"],  # type: ignore[index]
                status=summary["status"],
                proven="yes" if summary["lexicographic_proven"] else "no",
                bottleneck=summary["bottleneck_load_sec"],
                capacity=summary["capacity_per_shift"],
                solve_time=summary["solve_time_sec"],
            )
        )
    env = summaries[0]["environment"] if summaries else {}
    lines.extend(
        [
            "",
            "Environment: {python}, {platform}, CPU {cpu_count}, "
            "{solver_backend} ({solver_threads} threads), PuLP {pulp}, HiGHS {highspy}.".format(
                **env  # type: ignore[arg-type]
            ),
        ]
    )
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--case",
        action="append",
        choices=sorted(CASE_BUILDERS),
        help="Case to run. Repeat for multiple cases; defaults to all cases.",
    )
    parser.add_argument("--list", action="store_true", help="List case names and exit.")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print the full JSON summary instead of a Markdown table.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Write the full JSON summary to this path.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.list:
        for name in sorted(CASE_BUILDERS):
            print(name)
        return

    names = args.case or sorted(CASE_BUILDERS)
    summaries = [run_case(name) for name in names]
    payload = json.dumps(summaries, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(payload + "\n", encoding="utf-8")
    if args.json:
        print(payload)
    else:
        print(markdown_table(summaries))


if __name__ == "__main__":
    main()
