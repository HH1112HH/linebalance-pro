import type { MessageKey, Translate } from "./i18n";
import type { SectionKey } from "./types";

export interface SectionMeta {
  key: SectionKey;
  labelKey: MessageKey;
  shortKey: MessageKey;
  hintKey: MessageKey;
}

export const SECTIONS: SectionMeta[] = [
  {
    key: "overview",
    labelKey: "nav.overview.label",
    shortKey: "nav.overview.short",
    hintKey: "nav.overview.hint",
  },
  {
    key: "balance",
    labelKey: "nav.balance.label",
    shortKey: "nav.balance.short",
    hintKey: "nav.balance.hint",
  },
  {
    key: "capacity",
    labelKey: "nav.capacity.label",
    shortKey: "nav.capacity.short",
    hintKey: "nav.capacity.hint",
  },
  {
    key: "actuals",
    labelKey: "nav.actuals.label",
    shortKey: "nav.actuals.short",
    hintKey: "nav.actuals.hint",
  },
  {
    key: "time-study",
    labelKey: "nav.timeStudy.label",
    shortKey: "nav.timeStudy.short",
    hintKey: "nav.timeStudy.hint",
  },
  {
    key: "style-setup",
    labelKey: "nav.styleSetup.label",
    shortKey: "nav.styleSetup.short",
    hintKey: "nav.styleSetup.hint",
  },
  {
    key: "materials",
    labelKey: "nav.materials.label",
    shortKey: "nav.materials.short",
    hintKey: "nav.materials.hint",
  },
  {
    key: "solver",
    labelKey: "nav.solver.label",
    shortKey: "nav.solver.short",
    hintKey: "nav.solver.hint",
  },
];

export function sectionLabel(key: SectionKey, t: Translate): string {
  const section = SECTIONS.find((item) => item.key === key);
  return section ? t(section.labelKey) : t("nav.overview.label");
}
