import type { TFunction } from "i18next";
import type { Display } from "./types";

export function displayLabel(
  display: Display,
  displays: Display[],
  t: TFunction,
) {
  const index = displays.findIndex((candidate) => candidate.id === display.id);
  return t("canvas.display", { number: index + 1 });
}
