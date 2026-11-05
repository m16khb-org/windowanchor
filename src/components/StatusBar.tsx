import {
  DataUsage20Regular,
  Desktop20Regular,
  Keyboard20Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import type { Display, WindowInfo } from "../lib/types";
import { Badge } from "./ui";

export function StatusBar({
  displays,
  windows,
  autoRestore,
  lastAction,
}: {
  displays: Display[];
  windows: WindowInfo[];
  autoRestore: boolean;
  lastAction: string;
}) {
  const { t } = useTranslation();

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-line bg-surface px-3 text-[11px] text-faint">
      <span className="flex items-center gap-1.5">
        <span
          className={
            autoRestore
              ? "pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--colorPaletteGreenForeground1)]"
              : "h-1.5 w-1.5 rounded-full bg-[var(--colorNeutralForeground4)]"
          }
        />
        <span
          className={
            autoRestore
              ? "text-[var(--colorPaletteGreenForeground1)]"
              : "text-faint"
          }
        >
          {autoRestore ? t("status.watching") : t("status.paused")}
        </span>
      </span>

      <span className="h-3 w-px bg-line" />

      <span className="flex items-center gap-1.5">
        <Desktop20Regular />
        {t("common.display", { count: displays.length })}
      </span>
      <span className="flex items-center gap-1.5">
        <DataUsage20Regular />
        {t("common.window", { count: windows.length })}
      </span>

      <span className="ml-auto flex items-center gap-2">
        <span className="truncate">{lastAction}</span>
        <Badge tone="neutral">{t("status.local")}</Badge>
        <span className="flex items-center gap-1">
          <Keyboard20Regular />
          Ctrl K
        </span>
      </span>
    </footer>
  );
}
