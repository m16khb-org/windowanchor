import {
  Anchor,
  Camera,
  ChevronRight,
  Command,
  Monitor,
  Play,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { profileName } from "../lib/profile";
import type { Display, LayoutProfile, View, WindowInfo } from "../lib/types";
import { LanguageMenu } from "./LanguageMenu";
import { Badge, Button, IconButton, Kbd, Switch } from "./ui";

export function TopBar({
  view,
  activeProfile,
  displays,
  windows,
  autoRestore,
  onToggleAutoRestore,
  onCapture,
  onRestore,
  onOpenCommand,
}: {
  view: View;
  activeProfile: LayoutProfile | null;
  displays: Display[];
  windows: WindowInfo[];
  autoRestore: boolean;
  onToggleAutoRestore: (value: boolean) => void;
  onCapture: () => void;
  onRestore: () => void;
  onOpenCommand: () => void;
}) {
  const { t } = useTranslation();
  const viewLabel = t(`topbar.${view}`);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-amber/40 bg-amber/10 text-amber">
          <Anchor size={17} strokeWidth={2.1} />
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            WindowAnchor
          </span>
          <Badge tone="neutral">v0.1</Badge>
        </div>
      </div>

      <div className="mx-1 h-5 w-px bg-line" />

      <nav aria-label={t("topbar.layouts")} className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="text-muted">{viewLabel}</span>
        {view === "layouts" && activeProfile && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-faint" />
            <span className="truncate font-medium text-text">
              {profileName(activeProfile, t)}
            </span>
            <span
              aria-hidden="true"
              className="ml-1 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: activeProfile.accent }}
            />
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[11px] text-muted xl:flex">
          <Monitor className="h-3.5 w-3.5 text-teal" />
          <span className="font-mono">
            {t("common.display", { count: displays.length })}
          </span>
          <span className="text-faint">·</span>
          <span className="font-mono">
            {t("common.window", { count: windows.length })}
          </span>
        </div>

        <label className="hidden items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[11px] text-muted lg:flex">
          <ShieldCheck
            className={autoRestore ? "h-3.5 w-3.5 text-green" : "h-3.5 w-3.5 text-faint"}
          />
          <span className="whitespace-nowrap">{t("topbar.autoRestore")}</span>
          <Switch
            aria-label={t("topbar.autoRestore")}
            checked={autoRestore}
            onCheckedChange={onToggleAutoRestore}
          />
        </label>

        <LanguageMenu />

        <Button onClick={onCapture} size="sm" variant="primary">
          <Camera className="h-3.5 w-3.5" />
          {t("topbar.capture")}
        </Button>
        <Button onClick={onRestore} size="sm" variant="outline">
          <Play className="h-3.5 w-3.5" />
          {t("topbar.restore")}
        </Button>

        <IconButton
          aria-label={t("topbar.commandPalette")}
          className="hidden sm:inline-flex"
          onClick={onOpenCommand}
          title={t("topbar.commandPalette")}
        >
          <Command className="h-4 w-4" />
        </IconButton>
        <span className="hidden items-center gap-1 xl:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </div>
    </header>
  );
}
