import {
  Add20Regular,
  ArrowFit20Regular,
  Desktop24Regular,
  Grid20Regular,
  Subtract20Regular,
  Target20Regular,
} from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Display, WindowInfo } from "../lib/types";
import { appColor } from "../lib/mock";
import { useElementSize } from "../hooks/useElementSize";
import { cn, formatPercent } from "../lib/utils";
import { AppGlyph, appLabel } from "./AppGlyph";
import { Badge, Button, IconButton } from "./ui";

export function LayoutCanvas({
  displays,
  windows,
  selectedWindowId,
  onSelectWindow,
  onCapture,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
}: {
  displays: Display[];
  windows: WindowInfo[];
  selectedWindowId: number | null;
  onSelectWindow: (windowId: number | null) => void;
  onCapture: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}) {
  const { t } = useTranslation();
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [focusedDisplayId, setFocusedDisplayId] = useState<string | null>(null);

  useEffect(() => {
    if (
      focusedDisplayId &&
      !displays.some((display) => display.id === focusedDisplayId)
    ) {
      setFocusedDisplayId(null);
    }
  }, [displays, focusedDisplayId]);

  const hasDisplays = displays.length > 0;
  const visibleDisplays = focusedDisplayId
    ? displays.filter((display) => display.id === focusedDisplayId)
    : displays;
  const bounds = hasDisplays
    ? visibleDisplays.reduce(
        (result, display) => ({
          minX: Math.min(result.minX, display.x),
          minY: Math.min(result.minY, display.y),
          maxX: Math.max(result.maxX, display.x + display.width),
          maxY: Math.max(result.maxY, display.y + display.height),
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      )
    : { minX: 0, minY: 0, maxX: 1, maxY: 1 };

  const boundsWidth = Math.max(
    (visibleDisplays.length > 0 ? bounds.maxX : 1) -
      (visibleDisplays.length > 0 ? bounds.minX : 0),
    1,
  );
  const boundsHeight = Math.max(
    (visibleDisplays.length > 0 ? bounds.maxY : 1) -
      (visibleDisplays.length > 0 ? bounds.minY : 0),
    1,
  );
  const padding = 56;
  const fitScale = hasDisplays
    ? Math.min(
        (size.width - padding * 2) / boundsWidth,
        (size.height - padding * 2) / boundsHeight,
      ) * 0.94
    : 0;
  const scale = hasDisplays ? Math.max(0.04, fitScale * zoom) : 0;
  const offsetX = (size.width - boundsWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (size.height - boundsHeight * scale) / 2 - bounds.minY * scale;

  const visibleWindows = windows.filter((window) => {
    const rect = window.visualRect ?? window.rect;
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    return visibleDisplays.some(
      (display) =>
        centerX >= display.x &&
        centerX <= display.x + display.width &&
        centerY >= display.y &&
        centerY <= display.y + display.height,
    );
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden bg-canvas",
          showGrid && "layout-grid",
        )}
        onClick={() => onSelectWindow(null)}
        ref={ref}
      >
        <div className="layout-fade pointer-events-none absolute inset-0" />

        <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-md border border-line bg-surface/95 px-2 py-1.5 shadow-[var(--shadow2)] backdrop-blur">
          <Target20Regular className="text-[var(--colorBrandForeground1)]" />
          <Badge tone="teal">
            {t("common.display", { count: displays.length })}
          </Badge>
          <div
            aria-label={t("canvas.focusDisplay")}
            className="flex items-center rounded border border-line bg-panel-2 p-0.5"
            role="group"
          >
            <button
              aria-pressed={focusedDisplayId === null}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] transition-colors",
                focusedDisplayId === null
                  ? "bg-surface font-medium text-text shadow-[var(--shadow2)]"
                  : "text-faint hover:text-muted",
              )}
              onClick={() => setFocusedDisplayId(null)}
              type="button"
            >
              {t("canvas.all")}
            </button>
            {displays.map((display, index) => (
              <button
                aria-label={t("canvas.display", { number: index + 1 })}
                aria-pressed={focusedDisplayId === display.id}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] transition-colors",
                  focusedDisplayId === display.id
                    ? "bg-surface font-medium text-text shadow-[var(--shadow2)]"
                    : "text-faint hover:text-muted",
                )}
                key={display.id}
                onClick={() => setFocusedDisplayId(display.id)}
                type="button"
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-md border border-line bg-surface/95 px-1.5 py-1 shadow-[var(--shadow2)] backdrop-blur">
          <span className="mr-1 text-[10px] text-faint">
            {formatPercent(zoom)}
          </span>
          <IconButton
            aria-label={t("canvas.zoomOut")}
            className="h-7 w-7"
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            title={t("canvas.zoomOut")}
          >
            <Subtract20Regular />
          </IconButton>
          <IconButton
            aria-label={t("canvas.resetZoom")}
            className="h-7 w-7"
            onClick={() => onZoomChange(1)}
            title={t("canvas.resetZoom")}
          >
            <ArrowFit20Regular />
          </IconButton>
          <IconButton
            aria-label={t("canvas.zoomIn")}
            className="h-7 w-7"
            onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
            title={t("canvas.zoomIn")}
          >
            <Add20Regular />
          </IconButton>
          <div className="mx-1 h-4 w-px bg-line" />
          <IconButton
            aria-label={t("canvas.toggleGrid")}
            aria-pressed={showGrid}
            className={cn("h-7 w-7", showGrid && "bg-panel-2 text-text")}
            onClick={onToggleGrid}
            title={t("canvas.toggleGrid")}
          >
            <Grid20Regular />
          </IconButton>
        </div>

        {visibleDisplays.map((display, index) => {
          const displayNumber = displays.findIndex((item) => item.id === display.id) + 1;
          const left = offsetX + display.x * scale;
          const top = offsetY + display.y * scale;
          const width = display.width * scale;
          const height = display.height * scale;

          return (
            <div
              className="absolute rounded-lg border border-line-strong bg-surface shadow-[var(--shadow4)]"
              key={display.id}
              style={{ left, top, width, height }}
            >
              <div className="pointer-events-none absolute -top-5 left-0 flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[11px] font-medium text-muted">
                  {t("canvas.display", { number: displayNumber || index + 1 })}
                </span>
                {display.primary && (
                  <span className="rounded bg-[var(--colorBrandBackground2)] px-1 py-px text-[9px] font-medium text-[var(--colorBrandForeground1)]">
                    {t("canvas.primary")}
                  </span>
                )}
                <span className="text-[10px] text-faint">
                  {display.width}×{display.height} ·{" "}
                  {formatPercent(display.scaleFactor)}
                </span>
              </div>
              <div className="pointer-events-none absolute inset-x-3 bottom-0 h-[46px] rounded-t border-x border-t border-line bg-panel-2">
                <span className="absolute left-2 top-1.5 text-[9px] text-faint">
                  {t("canvas.taskbar")}
                </span>
              </div>
            </div>
          );
        })}

        {visibleWindows.map((window) => {
          const rect = window.visualRect ?? window.rect;
          const color = appColor(window.processName);
          const selected = selectedWindowId === window.id;
          const width = Math.max(rect.width * scale, 34);
          const height = Math.max(rect.height * scale, 24);
          const showTitle = width > 96 && height > 36;
          const showProcess = width > 150 && height > 70;

          return (
            <button
              aria-label={`${window.title} · ${appLabel(window.processName)}`}
              aria-pressed={selected}
              className={cn(
                "window-card group absolute flex flex-col overflow-hidden rounded-md border text-left",
                selected
                  ? "z-20 border-[var(--colorBrandStroke1)] shadow-[var(--shadow8)]"
                  : "z-10 border-line hover:border-line-strong",
              )}
              data-window-card="true"
              key={window.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelectWindow(window.id);
              }}
              style={{
                left: offsetX + rect.x * scale,
                top: offsetY + rect.y * scale,
                width,
                height,
                backgroundColor: "var(--colorNeutralBackground1)",
                borderColor: selected
                  ? "var(--colorBrandStroke1)"
                  : undefined,
              }}
              title={`${window.title}\n${appLabel(window.processName)} · ${rect.width}×${rect.height}`}
              type="button"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ backgroundColor: color }}
              />
              {showTitle ? (
                <span className="flex w-full items-center gap-1.5 px-2 pt-2">
                  <AppGlyph processName={window.processName} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold leading-4 text-text">
                      {window.title}
                    </span>
                    {showProcess && (
                      <span className="mt-0.5 block truncate text-[9px] leading-3 text-muted">
                        {appLabel(window.processName)}
                      </span>
                    )}
                  </span>
                </span>
              ) : (
                <span className="flex h-full items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </span>
              )}

              {selected && (
                <span className="absolute bottom-1 right-1 rounded border border-[var(--colorBrandStroke1)] bg-surface/90 px-1 py-px font-mono text-[8px] text-[var(--colorBrandForeground1)]">
                  {rect.width}×{rect.height}
                </span>
              )}
            </button>
          );
        })}

        {visibleWindows.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="w-full max-w-sm rounded-xl border border-line bg-panel/90 p-5 text-center shadow-2xl backdrop-blur">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-panel-2 text-[var(--colorBrandForeground1)]">
                <Desktop24Regular />
              </div>
              <h2 className="text-sm font-semibold">
                {displays.length === 0
                  ? t("canvas.noDisplaysTitle")
                  : t("canvas.noWindowsTitle")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                {displays.length === 0
                  ? t("canvas.noDisplaysBody")
                  : t("canvas.noWindowsBody")}
              </p>
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onCapture();
                }}
                size="sm"
                variant="primary"
              >
                {t("canvas.captureCurrent")}
              </Button>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[10px] text-muted shadow-[var(--shadow2)]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--colorBrandBackground)]" />
            {t("canvas.selected")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            {t("canvas.saved")}
          </span>
          <span className="font-mono text-faint">/</span>
          <span className="font-mono text-faint">Ctrl K</span>
        </div>
      </div>
    </div>
  );
}
