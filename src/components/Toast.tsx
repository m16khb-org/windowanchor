import {
  CheckmarkCircle20Regular,
  Dismiss16Regular,
  Info20Regular,
  Warning20Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { IconButton } from "./ui";

export type ToastMessage = {
  id: number;
  title: string;
  detail: string;
  tone: "success" | "warning" | "info";
};

export function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!toast) {
    return null;
  }

  const Icon =
    toast.tone === "success"
      ? CheckmarkCircle20Regular
      : toast.tone === "warning"
        ? Warning20Regular
        : Info20Regular;

  return (
    <div
      aria-live="polite"
      className="toast-in fixed bottom-10 right-4 z-50 flex w-[360px] items-start gap-2.5 rounded-lg border border-line bg-surface p-3 shadow-[var(--shadow16)]"
      role="status"
    >
      <Icon
        className={cn(
          "mt-0.5 shrink-0",
          toast.tone === "success"
            ? "text-[var(--colorPaletteGreenForeground1)]"
            : toast.tone === "warning"
              ? "text-[var(--colorPaletteDarkOrangeForeground1)]"
              : "text-[var(--colorBrandForeground1)]",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text">{toast.title}</div>
        <div className="mt-0.5 text-xs leading-5 text-muted">
          {toast.detail}
        </div>
      </div>
      <IconButton
        aria-label={t("toasts.dismiss")}
        className="h-7 w-7"
        onClick={onClose}
      >
        <Dismiss16Regular />
      </IconButton>
    </div>
  );
}
