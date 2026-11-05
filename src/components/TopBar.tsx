import {
  Camera24Regular,
  ChevronRight16Regular,
  Desktop24Regular,
  Keyboard24Regular,
  Play24Regular,
  ShieldCheckmark24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { profileName } from "../lib/profile";
import type { Display, LayoutProfile, View, WindowInfo } from "../lib/types";
import { LanguageMenu } from "./LanguageMenu";
import { Button, IconButton, Kbd, Switch } from "./ui";

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
    <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4">
      <nav
        aria-label={t("topbar.layouts")}
        className="flex min-w-0 items-center gap-1 text-xs"
      >
        <span className="text-muted">{viewLabel}</span>
        {view === "layouts" && activeProfile && (
          <>
            <ChevronRight16Regular className="text-faint" />
            <span className="truncate font-medium text-text">
              {profileName(activeProfile, t)}
            </span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md bg-panel-2 px-2.5 py-1.5 text-xs text-muted lg:flex">
          <Desktop24Regular className="text-[var(--colorBrandForeground1)]" />
          <span>
            {t("common.display", { count: displays.length })}
          </span>
          <span className="text-faint">·</span>
          <span>{t("common.window", { count: windows.length })}</span>
        </div>

        <div className="hidden items-center gap-2 rounded-md bg-panel-2 px-2.5 py-1 text-xs text-muted xl:flex">
          <ShieldCheckmark24Regular
            className={
              autoRestore
                ? "text-[var(--colorPaletteGreenForeground1)]"
                : "text-faint"
            }
          />
          <span className="whitespace-nowrap">{t("topbar.autoRestore")}</span>
          <Switch
            aria-label={t("topbar.autoRestore")}
            checked={autoRestore}
            onCheckedChange={onToggleAutoRestore}
          />
        </div>

        <LanguageMenu />

        <Button onClick={onCapture} size="sm" variant="primary">
          <Camera24Regular />
          {t("topbar.capture")}
        </Button>
        <Button onClick={onRestore} size="sm" variant="secondary">
          <Play24Regular />
          {t("topbar.restore")}
        </Button>

        <IconButton
          aria-label={t("topbar.commandPalette")}
          className="hidden sm:inline-flex"
          onClick={onOpenCommand}
          title={t("topbar.commandPalette")}
        >
          <Keyboard24Regular />
        </IconButton>
        <span className="hidden items-center gap-1 xl:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </div>
    </header>
  );
}
