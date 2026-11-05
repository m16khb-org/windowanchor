import { Activity, Keyboard, Monitor } from "lucide-react";
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
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-line bg-surface/80 px-3 text-[10px] text-faint">
      <span className="flex items-center gap-1.5">
        <span
          className={
            autoRestore
              ? "pulse-dot h-1.5 w-1.5 rounded-full bg-green"
              : "h-1.5 w-1.5 rounded-full bg-faint"
          }
        />
        <span className={autoRestore ? "text-green" : "text-faint"}>
          {autoRestore ? t("status.watching") : t("status.paused")}
        </span>
      </span>

      <span className="h-3 w-px bg-line" />

      <span className="flex items-center gap-1.5">
        <Monitor className="h-3 w-3" />
        {t("common.display", { count: displays.length })}
      </span>
      <span className="flex items-center gap-1.5">
        <Activity className="h-3 w-3" />
        {t("common.window", { count: windows.length })}
      </span>

      <span className="ml-auto flex items-center gap-2">
        <span className="truncate font-mono">{lastAction}</span>
        <Badge tone="neutral">{t("status.local")}</Badge>
        <span className="flex items-center gap-1">
          <Keyboard className="h-3 w-3" />
          Ctrl K
        </span>
      </span>
    </footer>
  );
}
