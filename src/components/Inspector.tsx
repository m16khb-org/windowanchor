import {
  Add20Regular,
  Clock20Regular,
  Desktop24Regular,
  Dismiss20Regular,
  Info20Regular,
  Layer20Regular,
  Play20Regular,
  Target20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { displayLabel } from "../lib/display";
import { appColor } from "../lib/mock";
import {
  activityDetail,
  activityTime,
  activityTitle,
  profileName,
  profileUpdatedAt,
} from "../lib/profile";
import type {
  ActivityEntry,
  Display,
  LayoutProfile,
  WindowInfo,
} from "../lib/types";
import { AppGlyph, appLabel } from "./AppGlyph";
import { Badge, Button, IconButton, Separator, Switch } from "./ui";

function displayForWindow(displays: Display[], window: WindowInfo) {
  if (window.monitorId) {
    const byId = displays.find((display) => display.id === window.monitorId);
    if (byId) {
      return byId;
    }
  }

  const rect = window.visualRect ?? window.rect;
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  return displays.find(
    (display) =>
      centerX >= display.x &&
      centerX <= display.x + display.width &&
      centerY >= display.y &&
      centerY <= display.y + display.height,
  );
}

export function Inspector({
  profile,
  displays,
  selectedWindow,
  activity,
  onClearSelection,
  onCreateRule,
  onCapture,
  onRestore,
}: {
  profile: LayoutProfile | null;
  displays: Display[];
  selectedWindow: WindowInfo | null;
  activity: ActivityEntry[];
  onClearSelection: () => void;
  onCreateRule: (window: WindowInfo) => void;
  onCapture: () => void;
  onRestore: () => void;
}) {
  const { t } = useTranslation();
  const [pinned, setPinned] = useState(true);
  const [exactSize, setExactSize] = useState(true);

  if (selectedWindow) {
    const display = displayForWindow(displays, selectedWindow);
    const rect = selectedWindow.visualRect ?? selectedWindow.rect;

    return (
      <aside className="panel-scroll flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <div className="flex h-11 items-center justify-between border-b border-line px-3">
          <div className="flex items-center gap-2">
            <Target20Regular className="text-[var(--colorBrandForeground1)]" />
            <h2 className="text-xs font-semibold text-muted">
              {t("inspector.title")}
            </h2>
          </div>
          <IconButton
            aria-label={t("inspector.clear")}
            className="h-7 w-7"
            onClick={onClearSelection}
          >
            <Dismiss20Regular />
          </IconButton>
        </div>

        <div className="border-b border-line p-3">
          <div className="flex items-start gap-2.5">
            <AppGlyph processName={selectedWindow.processName} size="lg" />
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[13px] font-semibold leading-5">
                {selectedWindow.title}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
                {appLabel(selectedWindow.processName)}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Badge tone="neutral">
              {t(`inspector.state.${selectedWindow.state}`)}
            </Badge>
            <Badge tone="teal">
              <Desktop24Regular />
              {display
                ? displayLabel(display, displays, t)
                : t("inspector.unassigned")}
            </Badge>
            <Badge tone="neutral">
              {t("inspector.pid", { pid: selectedWindow.pid })}
            </Badge>
          </div>
        </div>

        <section className="border-b border-line p-3">
          <h3 className="mb-2 text-xs font-semibold text-muted">
            {t("inspector.geometry")}
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              [t("inspector.x"), rect.x],
              [t("inspector.y"), rect.y],
              [t("inspector.width"), rect.width],
              [t("inspector.height"), rect.height],
            ].map(([label, value]) => (
              <div
                className="rounded-md border border-line bg-panel-2 px-2 py-1.5"
                key={label}
              >
                <div className="text-[11px] text-muted">
                  {label}
                </div>
                <div className="font-mono text-[11px] text-text">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-panel-2 px-2 py-1.5">
            <span className="text-[10px] text-muted">
              {t("inspector.displayScale")}
            </span>
            <span className="font-mono text-[10px] text-text">
              {display ? `${Math.round(display.scaleFactor * 100)}%` : "—"}
            </span>
          </div>
        </section>

        <section className="border-b border-line p-3">
          <h3 className="mb-2 text-xs font-semibold text-muted">
            {t("inspector.restoreBehavior")}
          </h3>
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-xs text-text">{t("inspector.pin")}</span>
            <Switch
              aria-label={t("inspector.pin")}
              checked={pinned}
              onCheckedChange={setPinned}
            />
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-xs text-text">
              {t("inspector.exactSize")}
            </span>
            <Switch
              aria-label={t("inspector.exactSize")}
              checked={exactSize}
              onCheckedChange={setExactSize}
            />
          </div>
          <p className="mt-1 text-xs leading-5 text-faint">
            {t("inspector.behaviorHelp")}
          </p>
        </section>

        <section className="border-b border-line p-3">
          <h3 className="mb-2 text-xs font-semibold text-muted">
            {t("inspector.matchIdentity")}
          </h3>
          <div className="space-y-1.5">
            <div className="rounded-md border border-line bg-panel-2 px-2 py-1.5">
              <div className="text-[11px] text-muted">
                {t("inspector.process")}
              </div>
              <div className="truncate font-mono text-[11px] text-text">
                {selectedWindow.processPath || selectedWindow.processName}
              </div>
            </div>
            <div className="rounded-md border border-line bg-panel-2 px-2 py-1.5">
              <div className="text-[11px] text-muted">
                {t("inspector.windowClass")}
              </div>
              <div className="truncate font-mono text-[11px] text-text">
                {selectedWindow.className || "—"}
              </div>
            </div>
          </div>
          <Button
            className="mt-2 w-full"
            onClick={() => onCreateRule(selectedWindow)}
            size="sm"
            variant="secondary"
          >
            <Add20Regular />
            {t("inspector.createRule")}
          </Button>
        </section>

        <div className="mt-auto p-3">
          <div className="flex items-start gap-2 rounded-md border border-line bg-panel-2 px-2.5 py-2 text-[10px] leading-4 text-muted">
            <Info20Regular className="shrink-0 text-[var(--colorBrandForeground1)]" />
            <span>
              <Trans
                components={{ strong: <strong className="text-text" /> }}
                i18nKey="inspector.partOf"
                values={{ profile: profile ? profileName(profile, t) : "" }}
              />
            </span>
          </div>
        </div>
      </aside>
    );
  }

  const apps = new Map<string, number>();
  for (const window of profile?.windows ?? []) {
    apps.set(window.processName, (apps.get(window.processName) ?? 0) + 1);
  }

  return (
    <aside className="panel-scroll flex w-[312px] shrink-0 flex-col overflow-y-auto border-l border-line bg-surface/60">
      <div className="flex h-11 items-center gap-2 border-b border-line px-3">
        <Layer20Regular className="text-[var(--colorPaletteTealForeground1)]" />
        <h2 className="text-xs font-semibold text-muted">
          {t("inspector.layoutHealth")}
        </h2>
      </div>

      <div className="border-b border-line p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold">
              {profile ? profileName(profile, t) : t("inspector.layoutHealth")}
            </h3>
            <p className="text-xs text-faint">
              {profile
                ? t("inspector.updated", {
                    time: profileUpdatedAt(profile, t),
                  })
                : t("profiles.updated", { time: "—" })}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: profile?.accent ?? "#5c6d80" }}
          />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-md border border-line bg-panel-2 px-2 py-2">
            <div className="font-mono text-[15px] text-text">
              {profile?.windows.length ?? 0}
            </div>
            <div className="text-[11px] text-muted">
              {t("inspector.windows")}
            </div>
          </div>
          <div className="rounded-md border border-line bg-panel-2 px-2 py-2">
            <div className="font-mono text-[15px] text-text">
              {displays.length}
            </div>
            <div className="text-[11px] text-muted">
              {t("inspector.displays")}
            </div>
          </div>
          <div className="rounded-md border border-line bg-panel-2 px-2 py-2">
            <div className="font-mono text-[15px] text-green">100%</div>
            <div className="text-[11px] text-muted">
              {t("inspector.matched")}
            </div>
          </div>
        </div>
      </div>

      <section className="border-b border-line p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted">
          {t("inspector.apps")}
        </h3>
        <div className="space-y-1">
          {[...apps.entries()].map(([processName, count]) => (
            <div
              className="flex items-center gap-2 rounded px-1 py-1 hover:bg-panel"
              key={processName}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: appColor(processName) }}
              />
              <span className="min-w-0 flex-1 truncate text-[11px]">
                {appLabel(processName)}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-faint">
                ×{count}
              </span>
            </div>
          ))}
          {apps.size === 0 && (
            <p className="text-[11px] text-faint">{t("inspector.noWindows")}</p>
          )}
        </div>
      </section>

      <section className="border-b border-line p-3">
        <div className="mb-2 flex items-center gap-2">
          <Clock20Regular className="text-faint" />
          <h3 className="text-xs font-semibold text-muted">
            {t("inspector.recentActivity")}
          </h3>
        </div>
        <div className="space-y-2">
          {activity.slice(0, 3).map((entry) => (
            <div className="flex gap-2" key={entry.id}>
              <span
                aria-hidden="true"
                className={
                  entry.status === "warn"
                    ? "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--colorPaletteDarkOrangeForeground1)]"
                    : entry.status === "error"
                      ? "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red"
                      : "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green"
                }
              />
              <div className="min-w-0">
                <div className="text-[11px] leading-4 text-text">
                  {activityTitle(entry, t)}
                </div>
                <div className="truncate text-xs leading-5 text-faint">
                  {activityDetail(entry, t)}
                </div>
              </div>
              <span className="ml-auto shrink-0 text-[10px] text-faint">
                {activityTime(entry, t)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="p-3">
        <div className="rounded-lg border border-line bg-panel p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium">
            <Info20Regular className="shrink-0 text-[var(--colorBrandForeground1)]" />
            {t("inspector.dockingTip")}
          </div>
          <p className="text-xs leading-5 text-muted">
            {t("inspector.dockingBody")}
          </p>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button onClick={onCapture} size="sm" variant="secondary">
            <Add20Regular />
            {t("common.capture")}
          </Button>
          <Button onClick={onRestore} size="sm" variant="primary">
            <Play20Regular />
            {t("common.restore")}
          </Button>
        </div>

        <Separator className="my-3" />
        <div className="flex items-center justify-between text-[9px] text-faint">
          <span className="font-mono">WindowAnchor 0.1.0</span>
          <span className="flex items-center gap-1">
            <Desktop24Regular />
            {t("inspector.active", { count: displays.length })}
          </span>
        </div>
      </div>
    </aside>
  );
}
