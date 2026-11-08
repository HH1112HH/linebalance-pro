import requestA from "./data/sample_request_A.json";
import requestB from "./data/sample_request_B.json";
import resultA from "./data/sample_result_A.json";
import resultB from "./data/sample_result_B.json";
import baselineStations from "./data/baseline_stations.json";
import type {
  BaselineStation,
  OptimizeResult,
  ReadinessDraftItem,
  SampleRequest,
} from "./types";

export const SAMPLE_REQUEST_A = requestA as unknown as SampleRequest;
export const SAMPLE_REQUEST_B = requestB as unknown as SampleRequest;
export const SAMPLE_RESULT_A = resultA as unknown as OptimizeResult;
export const SAMPLE_RESULT_B = resultB as unknown as OptimizeResult;
export const BASELINE_STATIONS = baselineStations as BaselineStation[];

export const STYLE_READINESS_TEMPLATE: ReadinessDraftItem[] = [
  {
    key: "operation_routing",
    required: true,
    status: "NOT_STARTED",
    note: "",
  },
  { key: "sam_approved", required: true, status: "NOT_STARTED", note: "" },
  { key: "machine_ready", required: true, status: "NOT_STARTED", note: "" },
  {
    key: "manpower_assigned",
    required: true,
    status: "NOT_STARTED",
    note: "",
  },
  { key: "skill_coverage", required: true, status: "NOT_STARTED", note: "" },
  { key: "layout_ready", required: true, status: "NOT_STARTED", note: "" },
  { key: "material_ready", required: true, status: "NOT_STARTED", note: "" },
  {
    key: "production_trial",
    required: true,
    status: "NOT_STARTED",
    note: "",
  },
];
