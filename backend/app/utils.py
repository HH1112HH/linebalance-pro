from __future__ import annotations

from .models import LineConfig, Operation, Worker

MANUAL_MACHINE_CODES = {"", "MANUAL", "NONE"}


def norm_code(value: str | None) -> str:
    return (value or "").strip().upper()


def is_manual_machine(machine_type: str | None) -> bool:
    return machine_type is None or norm_code(machine_type) in MANUAL_MACHINE_CODES


def skill_grade(worker: Worker, operation: Operation) -> int:
    """Operation-level grade first, then category-level grade as a fallback."""
    if operation.id in worker.skills:
        return int(worker.skills[operation.id])
    wanted = norm_code(operation.skill_code)
    for key, value in worker.skills.items():
        if norm_code(key) == wanted:
            return int(value)
    return 0


def skill_surplus(worker: Worker, operation: Operation) -> int:
    return max(0, skill_grade(worker, operation) - operation.skill_required)


def worker_can_operate_machine(worker: Worker, machine_type: str | None) -> bool:
    if is_manual_machine(machine_type):
        return True
    wanted = norm_code(machine_type)
    certified = {norm_code(item) for item in worker.machine_types}
    return "ANY" in certified or wanted in certified


def effective_allowance_pct(config: LineConfig) -> float:
    """Return the allowance that must be applied exactly once.

    SAM (Standard Allowed Minute) normally already contains the standard
    allowance. Applying allowance again to available time would double count
    lost time. Therefore:

    - INCLUDES_ALLOWANCE: return 0.0; ``allowance_pct`` is informational only.
    - EXCLUDES_ALLOWANCE: return ``allowance_pct`` and add it to SAM once.
    """
    if config.sam_basis == "INCLUDES_ALLOWANCE":
        return 0.0
    return config.allowance_pct


def planning_sam_sec(operation: Operation, config: LineConfig) -> float:
    """SAM used by the balancing model, including allowance at most once."""
    return round(operation.sam_sec * (1.0 + effective_allowance_pct(config)), 6)


def net_available_seconds(config: LineConfig) -> float:
    """Scheduled production seconds after explicit breaks.

    Do not subtract allowance or efficiency here. Allowance is handled in
    ``planning_sam_sec`` and efficiency is handled in capacity formulas.
    """
    return max(0.0, (config.shift_minutes - config.break_minutes) * 60.0)


def takt_time_sec(config: LineConfig) -> float:
    """Demand takt at 100% of scheduled time: net available seconds / target."""
    return safe_div(net_available_seconds(config), config.target_qty)


def effective_takt_time_sec(config: LineConfig) -> float:
    """Capacity-planning takt: net seconds x planned efficiency / target.

    ``min_workers`` uses this as a hard constraint so that the resulting line
    can meet the target at the planned efficiency, not only at 100% performance.
    """
    return safe_div(
        net_available_seconds(config) * config.planned_efficiency,
        config.target_qty,
    )


def safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    return numerator / denominator if denominator else default


def pct(numerator: float, denominator: float) -> float:
    return safe_div(numerator, denominator) * 100.0


def calculate_time_study(
    observed_time_sec: float,
    performance_rating: float,
    allowance_pct: float,
) -> tuple[float, float]:
    """Return (normal_time_sec, standard_time_sec) for aggregate human work.

    Normal time = observed time x performance rating.
    Standard time = normal time x (1 + allowance).

    Do not pass machine automatic time here: operator performance rating must
    not be applied to machine time. Use element-level time study for mixed
    human/machine operations.
    """
    normal = observed_time_sec * performance_rating
    standard = normal * (1.0 + allowance_pct)
    return round(normal, 6), round(standard, 6)
