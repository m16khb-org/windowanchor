import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
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
      ? CheckCircle2
      : toast.tone === "warning"
        ? AlertTriangle
        : Info;

  return (
    <div
      aria-live="polite"
      className="toast-in fixed bottom-11 right-4 z-50 flex w-[340px] items-start gap-2.5 rounded-lg border border-line-strong bg-panel-2/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur"
      role="status"
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          toast.tone === "success"
            ? "text-green"
            : toast.tone === "warning"
              ? "text-amber"
              : "text-blue",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-text">{toast.title}</div>
        <div className="mt-0.5 text-[10px] leading-4 text-muted">
          {toast.detail}
        </div>
      </div>
      <IconButton
        aria-label={t("toasts.dismiss")}
        className="h-6 w-6"
        onClick={onClose}
      >
        <X className="h-3 w-3" />
      </IconButton>
    </div>
  );
}
