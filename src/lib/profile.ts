import type { TFunction } from "i18next";
import i18n from "../i18n";
import type {
  ActivityEntry,
  AppRule,
  LayoutProfile,
  MonitorConfiguration,
  RestoreFailureReason,
} from "./types";

export function profileName(profile: LayoutProfile, t: TFunction) {
  return profile.nameKey ? t(profile.nameKey) : profile.name;
}

export function profileDescription(profile: LayoutProfile, t: TFunction) {
  return profile.descriptionKey
    ? t(profile.descriptionKey)
    : profile.description;
}

function relativeTime(value: number, t: TFunction) {
  const seconds = Math.round((value - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 60) {
    return t("time.justNow");
  }

  const formatter = new Intl.RelativeTimeFormat(
    i18n.resolvedLanguage ?? i18n.language ?? "en",
    { numeric: "auto" },
  );
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) {
    return formatter.format(days, "day");
  }
  return formatter.format(Math.round(days / 30), "month");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+)?/;

export function profileUpdatedAt(profile: LayoutProfile, t: TFunction) {
  if (profile.updatedAtKey) {
    return t(profile.updatedAtKey);
  }
  if (ISO_DATE.test(profile.updatedAt)) {
    const parsed = Date.parse(profile.updatedAt);
    if (!Number.isNaN(parsed)) {
      return relativeTime(parsed, t);
    }
  }
  return profile.updatedAt;
}

export function ruleTarget(rule: AppRule, t: TFunction) {
  return rule.targetKey ? t(rule.targetKey) : rule.target;
}

/** Backend entries carry keys; `nameKey` inside params must be translated. */
function translatedParams(
  params: Record<string, unknown> | undefined,
  t: TFunction,
) {
  if (!params || typeof params.nameKey !== "string") {
    return params;
  }
  return { ...params, name: t(params.nameKey) };
}

export function activityTitle(entry: ActivityEntry, t: TFunction) {
  return entry.titleKey
    ? t(entry.titleKey, translatedParams(entry.detailParams, t))
    : entry.title;
}

export function activityDetail(entry: ActivityEntry, t: TFunction) {
  return entry.detailKey
    ? t(entry.detailKey, translatedParams(entry.detailParams, t))
    : entry.detail;
}

export function activityTime(entry: ActivityEntry, t: TFunction) {
  if (entry.timeKey) {
    return t(entry.timeKey);
  }
  if (typeof entry.at === "number") {
    return relativeTime(entry.at, t);
  }
  return "";
}

export function restoreReasonLabel(
  reason: RestoreFailureReason,
  t: TFunction,
) {
  switch (reason) {
    case "window_not_found":
      return t("toasts.reasonWindowClosed");
    case "ambiguous_window":
      return t("toasts.reasonAmbiguous");
    case "target_off_screen":
      return t("toasts.reasonOffScreen");
    case "invalid_geometry":
      return t("toasts.reasonInvalid");
    case "move_ignored":
      return t("toasts.reasonIgnored");
    default:
      return reason;
  }
}

/** Mirrors the backend rule: configuration assignment wins, then the first matching profile. */
export function autoProfileId(
  profiles: LayoutProfile[],
  monitorConfigurations: MonitorConfiguration[],
  currentConfigurationId: string,
) {
  if (!currentConfigurationId) {
    return null;
  }
  const configuration = monitorConfigurations.find(
    (candidate) => candidate.id === currentConfigurationId,
  );
  if (
    configuration?.profileId &&
    profiles.some((profile) => profile.id === configuration.profileId)
  ) {
    return configuration.profileId;
  }
  const fallback = profiles.find(
    (profile) => profile.configurationId === currentConfigurationId,
  );
  return fallback?.id ?? null;
}
