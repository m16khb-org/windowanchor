import {
  ChevronRight,
  History,
  Layers,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  profileDescription,
  profileName,
  profileUpdatedAt,
} from "../lib/profile";
import type { LayoutProfile, View } from "../lib/types";
import { cn } from "../lib/utils";
import { MiniMap } from "./MiniMap";
import { Badge, Button, Kbd } from "./ui";

const NAV_ITEMS: Array<{
  id: Exclude<View, "layouts">;
  labelKey: string;
  icon: typeof Layers;
  meta: string;
}> = [
  { id: "rules", labelKey: "topbar.rules", icon: SlidersHorizontal, meta: "4" },
  { id: "activity", labelKey: "topbar.activity", icon: History, meta: "12" },
  { id: "settings", labelKey: "topbar.settings", icon: Settings, meta: "" },
];

export function ProfileRail({
  profiles,
  activeProfileId,
  view,
  onSelectProfile,
  onNavigate,
  onCapture,
}: {
  profiles: LayoutProfile[];
  activeProfileId: string;
  view: View;
  onSelectProfile: (profile: LayoutProfile) => void;
  onNavigate: (view: Exclude<View, "layouts">) => void;
  onCapture: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

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
    <aside className="flex w-[268px] shrink-0 flex-col border-r border-line bg-surface/60">
      <div className="border-b border-line px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
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
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
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
              <button
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative w-full rounded-lg border px-2.5 pb-2.5 pt-2 text-left transition-colors",
                  active
                    ? "border-line-strong bg-panel-2"
                    : "border-transparent bg-transparent hover:border-line hover:bg-panel",
                )}
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                style={
                  active
                    ? {
                        boxShadow: `inset 2px 0 0 ${profile.accent}`,
                      }
                    : undefined
                }
                type="button"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: profile.accent }}
                  />
                  <span className="truncate text-[13px] font-semibold">
                    {profileName(profile, t)}
                  </span>
                  {active && (
                    <Badge className="ml-auto" tone="amber">
                      {t("profiles.live")}
                    </Badge>
                  )}
                  {!active && profile.hotkey && (
                    <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                      <Kbd>{profile.hotkey}</Kbd>
                    </span>
                  )}
                </div>

                <p className="mb-2 line-clamp-2 text-[11px] leading-4 text-muted">
                  {profileDescription(profile, t)}
                </p>

                <div className="relative overflow-hidden rounded border border-line/80 bg-canvas/80 p-1">
                  <MiniMap
                    accent={profile.accent}
                    className="h-[54px] w-full"
                    displays={profile.displays}
                    windows={profile.windows}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-faint">
                  <span className="min-w-0 truncate font-mono">
                    {t("common.window", { count: profile.windows.length })} ·{" "}
                    {t("common.display", { count: profile.displays.length })}
                  </span>
                  <span className="shrink-0">{profileUpdatedAt(profile, t)}</span>
                </div>
              </button>
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
                  ? "bg-panel-2 text-text"
                  : "text-muted hover:bg-panel hover:text-text",
              )}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t(item.labelKey)}</span>
              {item.meta && (
                <span className="ml-auto font-mono text-[10px] text-faint">
                  {item.meta}
                </span>
              )}
              <ChevronRight className="h-3 w-3 text-faint" />
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
