import {
  Crosshair,
  Grid3X3,
  Minus,
  Plus,
  Scan,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Display, WindowInfo } from "../lib/types";
import { appColor } from "../lib/mock";
import { useElementSize } from "../hooks/useElementSize";
import { cn, formatPercent } from "../lib/utils";
import { AppGlyph, appLabel } from "./AppGlyph";
import { Badge, IconButton } from "./ui";

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
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-surface/40 px-3">
        <Crosshair className="h-3.5 w-3.5 text-teal" />
        <span className="text-[11px] font-medium text-text">{t("canvas.title")}</span>
        <Badge tone="teal">
          {t("common.display", { count: displays.length })}
        </Badge>

        <div
          aria-label={t("canvas.focusDisplay")}
          className="flex items-center rounded border border-line bg-panel p-0.5"
          role="group"
        >
          <button
            aria-pressed={focusedDisplayId === null}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors",
              focusedDisplayId === null
                ? "bg-panel-3 text-text"
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
                "rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                focusedDisplayId === display.id
                  ? "bg-panel-3 text-text"
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

        <span className="text-[11px] text-faint">{t("canvas.clickHint")}</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 font-mono text-[10px] text-faint">
            {formatPercent(zoom)}
          </span>
          <IconButton
            aria-label={t("canvas.zoomOut")}
            className="h-7 w-7"
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            title={t("canvas.zoomOut")}
          >
            <Minus className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            aria-label={t("canvas.resetZoom")}
            className="h-7 w-7"
            onClick={() => onZoomChange(1)}
            title={t("canvas.resetZoom")}
          >
            <Scan className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            aria-label={t("canvas.zoomIn")}
            className="h-7 w-7"
            onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
            title={t("canvas.zoomIn")}
          >
            <Plus className="h-3.5 w-3.5" />
          </IconButton>
          <div className="mx-1 h-4 w-px bg-line" />
          <IconButton
            aria-label={t("canvas.toggleGrid")}
            aria-pressed={showGrid}
            className={cn("h-7 w-7", showGrid && "bg-panel-2 text-text")}
            onClick={onToggleGrid}
            title={t("canvas.toggleGrid")}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden bg-canvas",
          showGrid && "blueprint-grid",
        )}
        onClick={() => onSelectWindow(null)}
        ref={ref}
      >
        <div className="blueprint-fade pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(13,20,29,0.1),rgba(7,10,15,0.75))]" />

        {visibleDisplays.map((display, index) => {
          const displayNumber = displays.findIndex((item) => item.id === display.id) + 1;
          const left = offsetX + display.x * scale;
          const top = offsetY + display.y * scale;
          const width = display.width * scale;
          const height = display.height * scale;

          return (
            <div
              className="absolute rounded-lg border border-line-strong/90 bg-panel/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02),0_12px_40px_rgba(0,0,0,0.28)]"
              key={display.id}
              style={{ left, top, width, height }}
            >
              <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  {t("canvas.display", { number: displayNumber || index + 1 })}
                </span>
                {display.primary && (
                  <span className="rounded border border-teal/30 bg-teal/10 px-1 py-px font-mono text-[9px] text-teal">
                    {t("canvas.primary")}
                  </span>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-2 right-2 font-mono text-[9px] text-faint">
                {display.width}×{display.height} · {formatPercent(display.scaleFactor)}
              </div>
              <div className="pointer-events-none absolute inset-x-3 bottom-0 h-[46px] rounded-t border-x border-t border-line/60 bg-panel-2/50">
                <span className="absolute left-2 top-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-faint">
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
                "window-card group absolute flex flex-col overflow-hidden rounded-[5px] border text-left backdrop-blur-[1px]",
                selected
                  ? "z-20 border-amber shadow-[0_0_0_1px_rgba(245,165,36,0.55),0_8px_30px_rgba(0,0,0,0.4)]"
                  : "z-10 border-white/10 hover:border-white/30",
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
                backgroundColor: `${color}14`,
                backgroundImage: `linear-gradient(180deg, ${color}20 0%, transparent 42%)`,
                borderColor: selected ? undefined : `${color}66`,
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
                    <span className="block truncate text-[10px] font-semibold leading-3 text-text">
                      {window.title}
                    </span>
                    {showProcess && (
                      <span className="mt-0.5 block truncate font-mono text-[8px] leading-3 text-muted">
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
                <span className="absolute bottom-1 right-1 rounded border border-amber/50 bg-canvas/80 px-1 py-px font-mono text-[8px] text-amber">
                  {rect.width}×{rect.height}
                </span>
              )}
            </button>
          );
        })}

        {visibleWindows.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="w-full max-w-sm rounded-xl border border-line bg-panel/90 p-5 text-center shadow-2xl backdrop-blur">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-panel-2 text-amber">
                <Scan className="h-5 w-5" />
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
              <button
                className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-amber bg-amber px-3 text-xs font-semibold text-canvas"
                onClick={(event) => {
                  event.stopPropagation();
                  onCapture();
                }}
                type="button"
              >
                {t("canvas.captureCurrent")}
              </button>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3 rounded-md border border-line bg-panel/85 px-2.5 py-1.5 text-[9px] text-muted backdrop-blur">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
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
