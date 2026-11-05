import * as Dialog from "@radix-ui/react-dialog";
import { Command, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Kbd } from "./ui";

export type CommandAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
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
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-canvas/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[18%] z-50 w-[min(580px,calc(100vw-48px))] -translate-x-1/2 overflow-hidden rounded-xl border border-line-strong bg-panel shadow-[0_32px_120px_rgba(0,0,0,0.7)]">
          <Dialog.Title className="sr-only">{t("command.title")}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {t("command.description")}
          </Dialog.Description>
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="h-4 w-4 shrink-0 text-faint" />
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
              value={query}
            />
            <Kbd>Esc</Kbd>
          </div>

          <div className="panel-scroll max-h-[340px] overflow-y-auto p-1.5">
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
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line bg-panel">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-medium">
                      {action.label}
                    </span>
                    <span className="block truncate text-[10px] text-faint">
                      {action.description}
                    </span>
                  </span>
                  {action.shortcut && <Kbd>{action.shortcut}</Kbd>}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-8 text-xs text-muted">
                <Command className="h-4 w-4 text-faint" />
                {t("command.noMatch", { query })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[9px] text-faint">
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
            <span className="font-mono">WindowAnchor</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
