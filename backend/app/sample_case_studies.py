from __future__ import annotations

from .case_studies import (
    CaseStudyPhase,
    analyze_layout_case_study,
    analyze_quality_case_study,
)
from .models import (
    LayoutCaseStudyResponse,
    LayoutRouteObservation,
    QualityCaseStudyResponse,
    QualityDefectRecord,
    QualityInspectionRecord,
    QualitySetupAuditRow,
)

QUALITY_LINE_ID = "LINE_01"
QUALITY_STYLE_CODE = "BASIC-TEE-001"
QUALITY_OPERATION_ID = "OP060"
QUALITY_OPERATION_NAME = "Collar attachment"
MISALIGNMENT_CODE = "MISALIGNMENT"
REWORK_MIN_EACH = 3.0

# Synthetic drill-down matching docs/data/quality_inspection_summary.csv.
_INSPECTIONS: list[tuple[CaseStudyPhase, str, int, int]] = [
    ("BEFORE", "2026-10-26", 364, 10),
    ("BEFORE", "2026-10-27", 364, 10),
    ("BEFORE", "2026-10-28", 364, 8),
    ("BEFORE", "2026-10-29", 364, 10),
    ("BEFORE", "2026-10-30", 364, 7),
    ("AFTER", "2026-11-02", 364, 4),
    ("AFTER", "2026-11-03", 364, 4),
    ("AFTER", "2026-11-04", 364, 3),
    ("AFTER", "2026-11-05", 364, 4),
    ("AFTER", "2026-11-06", 364, 3),
]

# Synthetic defect log matching docs/data/quality_defects.csv.
_DEFECTS: list[tuple[CaseStudyPhase, str, str, int]] = [
    ("BEFORE", "2026-10-26", "MISALIGNMENT", 4),
    ("BEFORE", "2026-10-26", "UNEVEN_WIDTH", 3),
    ("BEFORE", "2026-10-26", "PUCKERING", 2),
    ("BEFORE", "2026-10-26", "SKIPPED_STITCH", 1),
    ("BEFORE", "2026-10-27", "MISALIGNMENT", 4),
    ("BEFORE", "2026-10-27", "UNEVEN_WIDTH", 3),
    ("BEFORE", "2026-10-27", "PUCKERING", 2),
    ("BEFORE", "2026-10-27", "SKIPPED_STITCH", 1),
    ("BEFORE", "2026-10-28", "MISALIGNMENT", 3),
    ("BEFORE", "2026-10-28", "UNEVEN_WIDTH", 2),
    ("BEFORE", "2026-10-28", "PUCKERING", 2),
    ("BEFORE", "2026-10-28", "SKIPPED_STITCH", 1),
    ("BEFORE", "2026-10-29", "MISALIGNMENT", 4),
    ("BEFORE", "2026-10-29", "UNEVEN_WIDTH", 2),
    ("BEFORE", "2026-10-29", "PUCKERING", 2),
    ("BEFORE", "2026-10-29", "SKIPPED_STITCH", 2),
    ("BEFORE", "2026-10-30", "MISALIGNMENT", 3),
    ("BEFORE", "2026-10-30", "UNEVEN_WIDTH", 2),
    ("BEFORE", "2026-10-30", "PUCKERING", 1),
    ("BEFORE", "2026-10-30", "SKIPPED_STITCH", 1),
    ("AFTER", "2026-11-02", "MISALIGNMENT", 1),
    ("AFTER", "2026-11-02", "UNEVEN_WIDTH", 2),
    ("AFTER", "2026-11-02", "PUCKERING", 1),
    ("AFTER", "2026-11-02", "SKIPPED_STITCH", 0),
    ("AFTER", "2026-11-03", "MISALIGNMENT", 1),
    ("AFTER", "2026-11-03", "UNEVEN_WIDTH", 1),
    ("AFTER", "2026-11-03", "PUCKERING", 1),
    ("AFTER", "2026-11-03", "SKIPPED_STITCH", 1),
    ("AFTER", "2026-11-04", "MISALIGNMENT", 1),
    ("AFTER", "2026-11-04", "UNEVEN_WIDTH", 1),
    ("AFTER", "2026-11-04", "PUCKERING", 0),
    ("AFTER", "2026-11-04", "SKIPPED_STITCH", 1),
    ("AFTER", "2026-11-05", "MISALIGNMENT", 1),
    ("AFTER", "2026-11-05", "UNEVEN_WIDTH", 1),
    ("AFTER", "2026-11-05", "PUCKERING", 1),
    ("AFTER", "2026-11-05", "SKIPPED_STITCH", 1),
    ("AFTER", "2026-11-06", "MISALIGNMENT", 1),
    ("AFTER", "2026-11-06", "UNEVEN_WIDTH", 1),
    ("AFTER", "2026-11-06", "PUCKERING", 1),
    ("AFTER", "2026-11-06", "SKIPPED_STITCH", 0),
]

DEFECT_TYPE_LABELS = {
    "MISALIGNMENT": "Lệch cổ",
    "UNEVEN_WIDTH": "Cổ không đều",
    "PUCKERING": "Nhăn đường may cổ",
    "SKIPPED_STITCH": "Bỏ mũi",
}

# Synthetic changeover audit matching docs/data/quality_setup_audit.csv.
_AUDITS: list[tuple[CaseStudyPhase, str, bool, bool, int]] = [
    ("BEFORE", "2026-10-26", False, False, 4),
    ("BEFORE", "2026-10-27", True, True, 3),
    ("BEFORE", "2026-10-28", False, False, 3),
    ("BEFORE", "2026-10-29", False, False, 2),
    ("BEFORE", "2026-10-30", False, True, 2),
    ("AFTER", "2026-11-02", True, True, 1),
    ("AFTER", "2026-11-03", True, True, 0),
    ("AFTER", "2026-11-04", True, True, 1),
    ("AFTER", "2026-11-05", True, True, 0),
    ("AFTER", "2026-11-06", True, True, 0),
]

LAYOUT_LINE_ID = "LINE_01"
LAYOUT_STATION_ID = "ST01"
LAYOUT_TRIPS_PER_SHIFT = 3

# Synthetic route trials matching docs/data/layout_route_observations.csv.
_LAYOUT_TRIALS: list[tuple[CaseStudyPhase, int, str, str, str, float, float, int]] = [
    ("BEFORE", 1, "2026-10-27", "ST01", "bulk_supermarket", 42.0, 5.8, 2),
    ("BEFORE", 2, "2026-10-27", "ST01", "bulk_supermarket", 44.0, 6.2, 2),
    ("BEFORE", 3, "2026-10-27", "ST01", "bulk_supermarket", 43.0, 6.1, 2),
    ("BEFORE", 4, "2026-10-27", "ST01", "bulk_supermarket", 46.0, 5.9, 2),
    ("BEFORE", 5, "2026-10-27", "ST01", "bulk_supermarket", 43.0, 6.0, 2),
    ("AFTER", 1, "2026-11-02", "ST01", "point_of_use_bin", 12.0, 2.1, 0),
    ("AFTER", 2, "2026-11-02", "ST01", "point_of_use_bin", 13.0, 1.9, 0),
    ("AFTER", 3, "2026-11-02", "ST01", "point_of_use_bin", 14.0, 2.0, 0),
    ("AFTER", 4, "2026-11-02", "ST01", "point_of_use_bin", 12.0, 2.1, 0),
    ("AFTER", 5, "2026-11-02", "ST01", "point_of_use_bin", 13.0, 1.9, 0),
]


def build_quality_case_study() -> QualityCaseStudyResponse:
    """Return the T07 synthetic quality RCA used by the demo tab."""
    return analyze_quality_case_study(
        line_id=QUALITY_LINE_ID,
        style_code=QUALITY_STYLE_CODE,
        operation_id=QUALITY_OPERATION_ID,
        operation_name=QUALITY_OPERATION_NAME,
        misalignment_defect_code=MISALIGNMENT_CODE,
        inspections=[
            QualityInspectionRecord(
                phase=phase,
                date=date,
                inspected_pcs=inspected,
                defect_count=defects,
                rework_min_each=REWORK_MIN_EACH,
            )
            for phase, date, inspected, defects in _INSPECTIONS
        ],
        defects=[
            QualityDefectRecord(
                phase=phase,
                date=date,
                defect_code=code,
                defect_type=DEFECT_TYPE_LABELS[code],
                defect_count=count,
            )
            for phase, date, code, count in _DEFECTS
        ],
        audits=[
            QualitySetupAuditRow(
                phase=phase,
                changeover_date=date,
                guide_present=guide_present,
                first_piece_check=first_piece,
                misalignment_next_2h=misalignment,
            )
            for phase, date, guide_present, first_piece, misalignment in _AUDITS
        ],
    )


def build_layout_case_study() -> LayoutCaseStudyResponse:
    """Return the T10 synthetic layout/ergonomics dataset used by the demo tab."""
    return analyze_layout_case_study(
        line_id=LAYOUT_LINE_ID,
        station_id=LAYOUT_STATION_ID,
        trips_per_shift=LAYOUT_TRIPS_PER_SHIFT,
        trials=[
            LayoutRouteObservation(
                phase=phase,
                trial=trial,
                date=date,
                from_point=from_point,
                to_point=to_point,
                distance_m=distance_m,
                time_min=time_min,
                crossings=crossings,
            )
            for (
                phase,
                trial,
                date,
                from_point,
                to_point,
                distance_m,
                time_min,
                crossings,
            ) in _LAYOUT_TRIALS
        ],
    )
