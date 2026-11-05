import type { SectionKey } from "./types";

export interface SectionMeta {
  key: SectionKey;
  label: string;
  short: string;
  hint: string;
}

export const SECTIONS: SectionMeta[] = [
  { key: "overview", label: "Overview", short: "Overview", hint: "Cockpit" },
  { key: "balance", label: "Line balance", short: "Balance", hint: "Yamazumi & map" },
  {
    key: "capacity",
    label: "Capacity & people",
    short: "Capacity",
    hint: "HC & machines",
  },
  { key: "actuals", label: "Actuals", short: "Actuals", hint: "Shift log" },
  { key: "time-study", label: "Time study", short: "Time study", hint: "Method" },
  { key: "solver", label: "Solver & data", short: "Solver", hint: "Provenance" },
];

export function sectionLabel(key: SectionKey): string {
  return SECTIONS.find((item) => item.key === key)?.label ?? "Overview";
}
