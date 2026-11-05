import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import {
  Checkmark16Regular,
  ChevronDown16Regular,
  Globe20Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

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
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          aria-label={t("settings.language")}
          icon={<Globe20Regular />}
          size="small"
        >
          <span className="font-mono text-[11px]">{current.short}</span>
          <ChevronDown16Regular />
        </Button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {LANGUAGES.map((language) => {
            const active = current.code === language.code;
            const label = t(
              `languages.${language.code === "zh-CN" ? "zh" : language.code}`,
            );
            return (
              <MenuItem
                icon={
                  active ? (
                    <Checkmark16Regular />
                  ) : (
                    <span className="w-4 font-mono text-[10px] text-faint">
                      {language.short}
                    </span>
                  )
                }
                key={language.code}
                onClick={() => void i18n.changeLanguage(language.code)}
              >
                {label}
              </MenuItem>
            );
          })}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
