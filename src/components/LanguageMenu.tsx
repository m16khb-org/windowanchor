import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";

const LANGUAGES = [
  { code: "en", short: "EN" },
  { code: "ko", short: "한" },
  { code: "zh-CN", short: "中" },
  { code: "ja", short: "日" },
];

export function LanguageMenu() {
  const { t, i18n } = useTranslation();
  const current =
    LANGUAGES.find((language) => i18n.resolvedLanguage === language.code) ??
    LANGUAGES[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t("settings.language")}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-panel px-2 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-text"
          title={t("settings.language")}
          type="button"
        >
          <Globe2 className="h-3.5 w-3.5" />
          <span className="font-mono">{current.short}</span>
          <ChevronDown className="h-3 w-3 text-faint" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[168px] rounded-lg border border-line-strong bg-panel p-1 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
          sideOffset={6}
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-[9px] uppercase tracking-[0.14em] text-faint">
            {t("settings.language")}
          </DropdownMenu.Label>
          {LANGUAGES.map((language) => {
            const active = current.code === language.code;
            const label = t(
              `languages.${language.code === "zh-CN" ? "zh" : language.code}`,
            );
            return (
              <DropdownMenu.Item
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] outline-none",
                  active
                    ? "bg-panel-2 text-text"
                    : "text-muted data-[highlighted]:bg-panel-2 data-[highlighted]:text-text",
                )}
                key={language.code}
                onSelect={() => void i18n.changeLanguage(language.code)}
              >
                <span className="w-4 font-mono text-[9px] text-faint">
                  {language.short}
                </span>
                <span className="flex-1">{label}</span>
                {active && <Check className="h-3 w-3 text-amber" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
