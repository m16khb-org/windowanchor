import {
  Badge as FluentBadge,
  Button as FluentButton,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
} from "@fluentui/react-components";
import {
  Camera24Regular,
  Desktop16Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { displayLabel } from "../lib/display";
import { appColor } from "../lib/mock";
import type { Display, WindowInfo } from "../lib/types";
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

  const canSave = name.trim().length > 0 && selectedWindows.length > 0;
  const allSelected = selected.size === windows.length && windows.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => onOpenChange(data.open)}
    >
      <DialogSurface
        className="max-h-[86vh] w-[min(720px,calc(100vw-48px))] max-w-none overflow-hidden"
        style={{ padding: 0 }}
      >
        <DialogBody
          className="min-h-0"
          style={{ display: "flex", flexDirection: "column", padding: 0 }}
        >
          <div className="flex shrink-0 items-start gap-3 border-b border-line px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--colorBrandBackground2)] text-[var(--colorBrandForeground1)]">
              <Camera24Regular />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold">
                {t("capture.title")}
              </DialogTitle>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                {t("capture.description")}
              </p>
            </div>
            <IconButton
              aria-label={t("common.close")}
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <Dismiss24Regular />
            </IconButton>
          </div>

          <div className="shrink-0 border-b border-line px-5 py-3">
            <Field label={t("capture.layoutName")}>
              <Input
                onChange={(_, data) => setName(data.value)}
                placeholder={t("capture.placeholder")}
                value={name}
              />
            </Field>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="teal">
                <Desktop16Regular />
                {t("common.display", { count: displays.length })}
              </Badge>
              <Badge tone="neutral">
                {t("capture.selected", { count: selectedWindows.length })}
              </Badge>
              {displays.map((display, index) => (
                <FluentBadge appearance="outline" key={display.id} size="small">
                  {index + 1} · {display.width}×{display.height}
                </FluentBadge>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-2">
            <Checkbox
              checked={allSelected}
              label={
                allSelected
                  ? t("capture.deselectAll")
                  : t("capture.selectAll")
              }
              onChange={(_, data) => {
                setSelected(
                  data.checked
                    ? new Set(windows.map((window) => window.id))
                    : new Set(),
                );
              }}
            />
            <span className="text-[11px] text-faint">
              {t("capture.capturable", { count: windows.length })}
            </span>
          </div>

          {selected.size > 0 && selected.size < windows.length && (
            <div className="shrink-0 border-b border-line bg-[var(--colorPaletteDarkOrangeBackground1)] px-5 py-2 text-[11px] text-[var(--colorPaletteDarkOrangeForeground1)]">
              {t("capture.partialWarning", {
                count: windows.length - selected.size,
              })}
            </div>
          )}

          <DialogContent
            className="panel-scroll min-h-0 overflow-y-auto"
            style={{ display: "block", padding: 8 }}
          >
            {windows.map((window) => {
              const checked = selected.has(window.id);
              const display = centerDisplay(displays, window);
              const rect = window.visualRect ?? window.rect;
              return (
                <div
                  className="mb-1 flex w-full items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:border-line hover:bg-panel-2"
                  key={window.id}
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => toggleWindow(window.id)}
                  />
                  <AppGlyph processName={window.processName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-text">
                      {window.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
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
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-faint">
                    {rect.width}×{rect.height}
                  </span>
                </div>
              );
            })}

            {windows.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted">
                {t("capture.empty")}
              </div>
            )}
          </DialogContent>

          <DialogActions
            className="flex items-center justify-between border-t border-line px-5 py-3"
            style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px" }}
          >
            <p className="text-[11px] text-faint">{t("capture.localOnly")}</p>
            <div className="flex items-center gap-2">
              <FluentButton
                appearance="secondary"
                onClick={() => onOpenChange(false)}
                size="small"
              >
                {t("capture.cancel")}
              </FluentButton>
              <Button
                disabled={!canSave}
                onClick={() => {
                  if (canSave) {
                    onSave(name.trim(), selectedWindows);
                  }
                }}
                size="sm"
                variant="primary"
              >
                <Camera24Regular />
                {t("capture.save")}
              </Button>
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
