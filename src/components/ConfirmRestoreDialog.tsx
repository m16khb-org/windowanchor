import {
  Button as FluentButton,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import { Play20Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { profileName } from "../lib/profile";
import type { LayoutProfile, RestoreTrigger } from "../lib/types";
import { Button } from "./ui";

export function ConfirmRestoreDialog({
  profile,
  trigger,
  onOpenChange,
  onConfirm,
}: {
  profile: LayoutProfile | null;
  trigger: RestoreTrigger | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const name = profile ? profileName(profile, t) : "";

  return (
    <Dialog
      open={profile !== null && trigger !== null}
      onOpenChange={(_, data) => {
        if (!data.open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogSurface
        className="w-[min(440px,calc(100vw-48px))] max-w-none"
        style={{ padding: 0 }}
      >
        <DialogBody
          style={{ display: "flex", flexDirection: "column", padding: 0 }}
        >
          <div className="px-5 pt-5">
            <DialogTitle className="text-xl font-semibold">
              {t("confirmRestore.title", { name })}
            </DialogTitle>
            <DialogContent style={{ padding: 0 }}>
              <p className="mt-2 text-sm leading-5 text-muted">
                {t("confirmRestore.body", {
                  trigger: trigger ? t(`activity.triggers.${trigger}`) : "",
                })}
              </p>
            </DialogContent>
          </div>
          <DialogActions
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "20px",
            }}
          >
            <FluentButton
              appearance="secondary"
              onClick={() => onOpenChange(false)}
              size="small"
            >
              {t("confirmRestore.later")}
            </FluentButton>
            <Button onClick={onConfirm} size="sm" variant="primary">
              <Play20Regular />
              {t("confirmRestore.restore")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
