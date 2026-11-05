import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import { Search20Regular } from "@fluentui/react-icons";
import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { Kbd } from "./ui";

export type CommandAction = {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandAction[];
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return actions;
    }
    return actions.filter((action) =>
      `${action.label} ${action.description}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function run(action: CommandAction) {
    action.onSelect();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => onOpenChange(data.open)}
    >
      <DialogSurface
        className="max-h-[70vh] w-[min(580px,calc(100vw-48px))] max-w-none overflow-hidden"
        style={{
          padding: 0,
          position: "fixed",
          top: "16%",
          left: "50%",
          transform: "translateX(-50%)",
          margin: 0,
        }}
      >
        <DialogBody
          style={{ display: "flex", flexDirection: "column", padding: 0 }}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-line px-3">
            <Search20Regular className="shrink-0 text-faint" />
            <DialogTitle className="sr-only">{t("command.title")}</DialogTitle>
            <input
              aria-label={t("command.title")}
              className="h-11 w-full bg-transparent text-sm text-text placeholder:text-faint focus:outline-none"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((index) =>
                    Math.min(index + 1, filtered.length - 1),
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((index) => Math.max(index - 1, 0));
                }
                if (event.key === "Enter" && filtered[activeIndex]) {
                  event.preventDefault();
                  run(filtered[activeIndex]);
                }
              }}
              placeholder={t("command.placeholder")}
              ref={inputRef}
              style={{ outline: "none" }}
              value={query}
            />
            <Kbd>Esc</Kbd>
          </div>

          <DialogContent
            className="panel-scroll max-h-[340px] overflow-y-auto"
            style={{ display: "block", padding: 6 }}
          >
            {filtered.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                    index === activeIndex
                      ? "bg-panel-2 text-text"
                      : "text-muted hover:bg-panel-2/60 hover:text-text",
                  )}
                  key={action.id}
                  onClick={() => run(action)}
                  onMouseEnter={() => setActiveIndex(index)}
                  type="button"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-panel-2 text-[var(--colorBrandForeground1)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">
                      {action.label}
                    </span>
                    <span className="block truncate text-[11px] text-faint">
                      {action.description}
                    </span>
                  </span>
                  {action.shortcut && <Kbd>{action.shortcut}</Kbd>}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-3 py-8 text-sm text-muted">
                {t("command.noMatch", { query })}
              </div>
            )}
          </DialogContent>

          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[10px] text-faint">
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                {t("command.navigate")}
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                {t("command.run")}
              </span>
            </span>
            <span>WindowAnchor</span>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
