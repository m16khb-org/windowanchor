import * as Dialog from "@radix-ui/react-dialog";
import { Camera, Check, Monitor, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { displayLabel } from "../lib/display";
import { appColor } from "../lib/mock";
import type { Display, WindowInfo } from "../lib/types";
import { cn } from "../lib/utils";
import { AppGlyph, appLabel } from "./AppGlyph";
import { Badge, Button, IconButton } from "./ui";

function centerDisplay(displays: Display[], window: WindowInfo) {
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

export function CaptureDialog({
  open,
  onOpenChange,
  windows,
  displays,
  defaultName,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  windows: WindowInfo[];
  displays: Display[];
  defaultName: string;
  onSave: (name: string, windows: WindowInfo[]) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(defaultName);
    setSelected(new Set(windows.map((window) => window.id)));
  }, [defaultName, open, windows]);

  const selectedWindows = useMemo(
    () => windows.filter((window) => selected.has(window.id)),
    [selected, windows],
  );

  function toggleWindow(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === windows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(windows.map((window) => window.id)));
    }
  }

  const canSave = name.trim().length > 0 && selectedWindows.length > 0;

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-canvas/80 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[86vh] w-[min(720px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line-strong bg-panel shadow-[0_32px_120px_rgba(0,0,0,0.65)]">
          <div className="flex items-start gap-3 border-b border-line px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber/35 bg-amber/10 text-amber">
              <Camera className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-[14px] font-semibold">
                {t("capture.title")}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[11px] leading-4 text-muted">
                {t("capture.description")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton aria-label={t("common.close")} className="h-7 w-7">
                <X className="h-4 w-4" />
              </IconButton>
            </Dialog.Close>
          </div>

          <div className="border-b border-line px-4 py-3">
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              {t("capture.layoutName")}
            </label>
            <input
              autoFocus
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-canvas px-3 text-sm text-text placeholder:text-faint focus:border-amber/60 focus:outline-none"
              onChange={(event) => setName(event.target.value)}
              placeholder={t("capture.placeholder")}
              value={name}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="teal">
                <Monitor className="h-2.5 w-2.5" />
                {t("common.display", { count: displays.length })}
              </Badge>
              <Badge tone="neutral">
                {t("capture.selected", { count: selectedWindows.length })}
              </Badge>
              {displays.map((display, index) => (
                <Badge key={display.id} tone="neutral">
                  {index + 1} · {display.width}×{display.height}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <button
              className="flex items-center gap-1.5 text-[11px] text-muted hover:text-text"
              onClick={toggleAll}
              type="button"
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded border",
                  selected.size === windows.length
                    ? "border-amber bg-amber text-canvas"
                    : "border-line-strong bg-panel",
                )}
              >
                {selected.size === windows.length && <Check className="h-2.5 w-2.5" />}
              </span>
              {selected.size === windows.length
                ? t("capture.deselectAll")
                : t("capture.selectAll")}
            </button>
            <span className="font-mono text-[10px] text-faint">
              {t("capture.capturable", { count: windows.length })}
            </span>
          </div>

          <div className="panel-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {windows.map((window) => {
              const checked = selected.has(window.id);
              const display = centerDisplay(displays, window);
              const rect = window.visualRect ?? window.rect;
              return (
                <button
                  aria-pressed={checked}
                  className={cn(
                    "mb-1 flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                    checked
                      ? "border-line-strong bg-panel-2"
                      : "border-transparent hover:border-line hover:bg-panel-2/60",
                  )}
                  key={window.id}
                  onClick={() => toggleWindow(window.id)}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-amber bg-amber text-canvas"
                        : "border-line-strong bg-canvas",
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <AppGlyph processName={window.processName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-text">
                      {window.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-faint">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: appColor(window.processName) }}
                      />
                      {appLabel(window.processName)}
                      <span>·</span>
                      <span>
                        {display
                          ? displayLabel(display, displays, t)
                          : t("inspector.unassigned")}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-faint">
                    {rect.width}×{rect.height}
                  </span>
                </button>
              );
            })}

            {windows.length === 0 && (
              <div className="px-4 py-10 text-center text-xs text-muted">
                {t("capture.empty")}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-[10px] text-faint">{t("capture.localOnly")}</p>
            <div className="flex items-center gap-2">
              <Dialog.Close asChild>
                <Button size="sm" variant="ghost">
                  {t("capture.cancel")}
                </Button>
              </Dialog.Close>
              <Button
                disabled={!canSave}
                onClick={() => {
                  if (!canSave) {
                    return;
                  }
                  onSave(name.trim(), selectedWindows);
                }}
                size="sm"
                variant="primary"
              >
                <Camera className="h-3.5 w-3.5" />
                {t("capture.save")}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
