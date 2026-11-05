import type { TFunction } from "i18next";
import type { ActivityEntry, AppRule, LayoutProfile } from "./types";

export function profileName(profile: LayoutProfile, t: TFunction) {
  return profile.nameKey ? t(profile.nameKey) : profile.name;
}

export function profileDescription(profile: LayoutProfile, t: TFunction) {
  return profile.descriptionKey
    ? t(profile.descriptionKey)
    : profile.description;
}

export function profileUpdatedAt(profile: LayoutProfile, t: TFunction) {
  return profile.updatedAtKey ? t(profile.updatedAtKey) : profile.updatedAt;
}

export function ruleTarget(rule: AppRule, t: TFunction) {
  return rule.targetKey ? t(rule.targetKey) : rule.target;
}

export function activityTitle(entry: ActivityEntry, t: TFunction) {
  return entry.titleKey
    ? t(entry.titleKey, entry.detailParams)
    : entry.title;
}

export function activityDetail(entry: ActivityEntry, t: TFunction) {
  return entry.detailKey
    ? t(entry.detailKey, entry.detailParams)
    : entry.detail;
}

export function activityTime(entry: ActivityEntry, t: TFunction) {
  return entry.timeKey ? t(entry.timeKey) : entry.time;
}
