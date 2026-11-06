import {
  Add20Regular,
  ChevronRight16Regular,
  Delete20Regular,
  Desktop20Regular,
  History20Regular,
  Layer20Regular,
  MoreHorizontal20Regular,
  Options20Regular,
  Search20Regular,
  Settings20Regular,
} from "@fluentui/react-icons";
import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  autoProfileId,
  profileDescription,
  profileName,
  profileUpdatedAt,
} from "../lib/profile";
import type {
  LayoutProfile,
  MonitorConfiguration,
  View,
} from "../lib/types";
import { cn } from "../lib/utils";
import { MiniMap } from "./MiniMap";
import { Badge, Button, IconButton, Kbd } from "./ui";

const NAV_ITEMS: Array<{
  id: Exclude<View, "layouts">;
  labelKey: string;
  icon: typeof Layer20Regular;
}> = [
  { id: "rules", labelKey: "topbar.rules", icon: Options20Regular },
  { id: "activity", labelKey: "topbar.activity", icon: History20Regular },
  { id: "settings", labelKey: "topbar.settings", icon: Settings20Regular },
];

export function ProfileRail({
  profiles,
  activeProfileId,
  view,
  monitorConfigurations,
  currentConfigurationId,
  ruleCount,
  activityCount,
  onSelectProfile,
  onNavigate,
  onCapture,
  onDeleteProfile,
  onAssignProfile,
}: {
  profiles: LayoutProfile[];
  activeProfileId: string;
  view: View;
  monitorConfigurations: MonitorConfiguration[];
  currentConfigurationId: string;
  ruleCount: number;
  activityCount: number;
  onSelectProfile: (profile: LayoutProfile) => void;
  onNavigate: (view: Exclude<View, "layouts">) => void;
  onCapture: () => void;
  onDeleteProfile: (profile: LayoutProfile) => void;
  onAssignProfile: (profile: LayoutProfile) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const thisSetupId = autoProfileId(
    profiles,
    monitorConfigurations,
    currentConfigurationId,
  );
  const navCounts: Record<Exclude<View, "layouts">, number> = {
    rules: ruleCount,
    activity: activityCount,
    settings: 0,
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return profiles;
    }
    return profiles.filter(
      (profile) =>
        profile.name.toLowerCase().includes(normalized) ||
        profile.description.toLowerCase().includes(normalized),
    );
  }, [profiles, query]);

  return (
    <aside className="flex w-[272px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layer20Regular className="text-muted" />
            <h2 className="text-xs font-semibold text-muted">
              {t("profiles.title")}
            </h2>
            <span className="font-mono text-[10px] text-faint">
              {profiles.length}
            </span>
          </div>
          <Button
            aria-label={t("profiles.create")}
            className="h-7 w-7"
            onClick={onCapture}
            size="icon"
            variant="ghost"
          >
            <Add20Regular />
          </Button>
        </div>

        <div className="relative">
          <Search20Regular className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            aria-label={t("profiles.search")}
            className="h-8 w-full rounded-md border border-line bg-panel pl-8 pr-2 text-xs text-text placeholder:text-faint focus:border-line-strong focus:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("profiles.search")}
            type="search"
            value={query}
          />
        </div>
      </div>

      <div className="panel-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 && (
          <div className="px-2 py-8 text-center text-xs text-faint">
            {t("profiles.noMatch", { query })}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {filtered.map((profile) => {
            const active = view === "layouts" && profile.id === activeProfileId;
            return (
              <div
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative w-full rounded-lg border px-2.5 pb-2.5 pt-2 text-left transition-colors",
                  active
                    ? "border-line-strong bg-panel-2"
                    : "border-transparent bg-transparent hover:border-line hover:bg-panel",
                )}
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectProfile(profile);
                  }
                }}
                role="button"
                style={
                  active
                    ? {
                        boxShadow: "inset 2px 0 0 var(--colorBrandBackground)",
                      }
                    : undefined
                }
                tabIndex={0}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: profile.accent }}
                  />
                  <span className="truncate text-sm font-semibold">
                    {profileName(profile, t)}
                  </span>
                  {profile.id === thisSetupId && (
                    <span className="shrink-0">
                      <Badge tone="teal">{t("profiles.thisSetup")}</Badge>
                    </span>
                  )}
                  <div
                    className="ml-auto flex shrink-0 items-center gap-1"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {active && (
                      <Badge tone="amber">{t("profiles.live")}</Badge>
                    )}
                    {!active && profile.hotkey && (
                      <span className="opacity-0 transition-opacity group-hover:opacity-100">
                        <Kbd>{profile.hotkey}</Kbd>
                      </span>
                    )}
                    <Menu>
                      <MenuTrigger disableButtonEnhancement>
                        <IconButton
                          aria-label={t("profiles.actions")}
                          className="h-7 w-7"
                          title={t("profiles.actions")}
                        >
                          <MoreHorizontal20Regular />
                        </IconButton>
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuItem
                            disabled={
                              profile.id === "live" ||
                              profile.id === thisSetupId
                            }
                            icon={<Desktop20Regular />}
                            onClick={() => onAssignProfile(profile)}
                          >
                            {t("profiles.assign")}
                          </MenuItem>
                          <MenuItem
                            disabled={profile.id === "live"}
                            icon={<Delete20Regular />}
                            onClick={() => onDeleteProfile(profile)}
                          >
                            {t("profiles.delete")}
                          </MenuItem>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  </div>
                </div>

                <p className="mb-2 line-clamp-2 text-xs leading-5 text-muted">
                  {profileDescription(profile, t)}
                </p>

                <div className="relative overflow-hidden rounded-md border border-line bg-panel-2 p-1">
                  <MiniMap
                    accent={profile.accent}
                    className="h-[54px] w-full"
                    displays={profile.displays}
                    windows={profile.windows}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-faint">
                  <span className="min-w-0 truncate font-mono">
                    {t("common.window", { count: profile.windows.length })} ·{" "}
                    {t("common.display", { count: profile.displays.length })}
                  </span>
                  <span className="shrink-0">{profileUpdatedAt(profile, t)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs transition-colors",
                active
                  ? "bg-panel-2 font-medium text-text"
                  : "text-muted hover:bg-panel-2 hover:text-text",
              )}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
              {navCounts[item.id] > 0 && (
                <span className="ml-auto font-mono text-[10px] text-faint">
                  {navCounts[item.id]}
                </span>
              )}
              <ChevronRight16Regular className="text-faint" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[10px] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-green" />
          {t("profiles.localOnly")}
        </span>
        <span className="font-mono">GPL-3.0</span>
      </div>
    </aside>
  );
}
