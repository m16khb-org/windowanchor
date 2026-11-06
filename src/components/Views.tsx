import {
  Add20Regular,
  ArrowCounterclockwise20Regular,
  ArrowDownload20Regular,
  ArrowRight20Regular,
  CheckmarkCircle20Regular,
  ChevronDown16Regular,
  ChevronRight16Regular,
  Copy20Regular,
  Desktop24Regular,
  Delete20Regular,
  History20Regular,
  Info20Regular,
  Keyboard20Regular,
  Options20Regular,
  Shield20Regular,
  Sparkle20Regular,
  Warning20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ThemeMode } from "../Root";
import {
  activityDetail,
  activityTime,
  activityTitle,
  restoreReasonLabel,
  ruleTarget,
} from "../lib/profile";
import type {
  ActivityEntry,
  AppRule,
  LayoutProfile,
  MonitorConfiguration,
  Settings,
} from "../lib/types";
import { cn } from "../lib/utils";
import { AppGlyph, appLabel } from "./AppGlyph";
import { Badge, Button, Separator, Switch } from "./ui";

export function RulesView({
  rules,
  onToggleRule,
  onAddRule,
}: {
  rules: AppRule[];
  onToggleRule: (id: string) => void;
  onAddRule: () => void;
}) {
  const { t } = useTranslation();
  const enabled = rules.filter((rule) => rule.enabled).length;

  return (
    <div className="panel-scroll min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Options20Regular className="text-[var(--colorBrandForeground1)]" />
              <h1 className="text-lg font-semibold tracking-[-0.01em]">
                {t("rules.title")}
              </h1>
              <Badge tone="neutral">{rules.length}</Badge>
            </div>
            <p className="max-w-xl text-xs leading-5 text-muted">
              {t("rules.description")}
            </p>
          </div>
          <Button onClick={onAddRule} size="sm" variant="primary">
            <Add20Regular />
            {t("rules.newRule")}
          </Button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            [t("rules.enabled"), `${enabled} / ${rules.length}`, "text-green"],
            [t("rules.lastMatch"), t("time.twoMinutes"), "text-text"],
            [t("rules.strategy"), t("rules.strategyValue"), "text-text"],
          ].map(([label, value, tone]) => (
            <div
              className="rounded-lg border border-line bg-panel px-3 py-2.5"
              key={label}
            >
              <div className="text-xs text-muted">
                {label}
              </div>
              <div className={cn("mt-0.5 text-[13px] font-medium", tone)}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_90px_44px] gap-3 border-b border-line px-3 py-2 text-xs font-semibold text-muted">
            <span>{t("rules.application")}</span>
            <span>{t("rules.target")}</span>
            <span>{t("rules.priority")}</span>
            <span className="text-right">{t("rules.on")}</span>
          </div>
          {rules.map((rule) => (
            <div
              className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_90px_44px] items-center gap-3 border-b border-line/70 px-3 py-2.5 last:border-b-0"
              key={rule.id}
            >
              <div className="flex min-w-0 items-center gap-2">
                <AppGlyph processName={rule.processName} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium">
                    {appLabel(rule.processName)}
                  </div>
                  <div className="truncate font-mono text-xs text-faint">
                    {rule.matchKey ? t(rule.matchKey) : rule.match}
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs text-text">
                  {ruleTarget(rule, t)}
                </div>
                <div className="text-xs text-faint">
                  {t("rules.afterRestore")}
                </div>
              </div>
              <div className="font-mono text-[10px] text-muted">
                {String(rule.priority).padStart(2, "0")}
              </div>
              <div className="flex justify-end">
                <Switch
                  aria-label={`${t("rules.title")}: ${appLabel(rule.processName)}`}
                  checked={rule.enabled}
                  onCheckedChange={() => onToggleRule(rule.id)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-panel/70 px-3 py-2.5 text-xs leading-5 text-muted">
          <Info20Regular className="shrink-0 text-[var(--colorBrandForeground1)]" />
          <span>{t("rules.callout")}</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityView({
  activity,
  onCopyDiagnostics,
}: {
  activity: ActivityEntry[];
  onCopyDiagnostics: () => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | ActivityEntry["kind"]>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const filtered =
    filter === "all" ? activity : activity.filter((entry) => entry.kind === filter);

  const filters = ["all", "restore", "capture", "skip", "rule"] as const;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekRestores = activity.filter(
    (entry) =>
      entry.kind === "restore" &&
      typeof entry.at === "number" &&
      entry.at >= weekAgo,
  );
  const reports = weekRestores.flatMap((entry) =>
    entry.report ? [entry.report] : [],
  );
  const attempted = reports.reduce(
    (total, report) => total + report.restored + report.skipped,
    0,
  );
  const restored = reports.reduce(
    (total, report) => total + report.restored,
    0,
  );
  const durations = reports.reduce(
    (total, report) => total + report.durationMs,
    0,
  );
  const stats = [
    [
      t("activity.restores7d"),
      weekRestores.length > 0 ? String(weekRestores.length) : "—",
      "text-text",
    ],
    [
      t("activity.successRate"),
      attempted > 0 ? `${Math.round((restored / attempted) * 100)}%` : "—",
      "text-green",
    ],
    [
      t("activity.average"),
      reports.length > 0 ? `${Math.round(durations / reports.length)} ms` : "—",
      "text-text",
    ],
  ];

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="panel-scroll min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <History20Regular className="text-[var(--colorPaletteTealForeground1)]" />
              <h1 className="text-lg font-semibold tracking-[-0.01em]">
                {t("activity.title")}
              </h1>
            </div>
            <p className="text-xs leading-5 text-muted">
              {t("activity.description")}
            </p>
          </div>
          <Button onClick={onCopyDiagnostics} size="sm" variant="secondary">
            <Copy20Regular />
            {t("activity.copy")}
          </Button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          {stats.map(([label, value, tone]) => (
            <div
              className="rounded-lg border border-line bg-panel px-3 py-2.5"
              key={label}
            >
              <div className="text-xs text-muted">
                {label}
              </div>
              <div className={cn("mt-0.5 font-mono text-[15px]", tone)}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2 flex items-center gap-1">
          {filters.map((kind) => (
            <button
              className={cn(
                "rounded px-2 py-1 text-xs capitalize transition-colors",
                filter === kind
                  ? "bg-panel-2 text-text"
                  : "text-muted hover:bg-panel hover:text-text",
              )}
              key={kind}
              onClick={() => setFilter(kind)}
              type="button"
            >
              {t(`activity.filters.${kind}`)}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          {filtered.map((entry) => (
            <div
              className="flex gap-3 border-b border-line/70 px-3 py-3 last:border-b-0"
              key={entry.id}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                  entry.status === "ok"
                    ? "border-green/25 bg-green/10 text-green"
                    : entry.status === "warn"
                      ? "border-amber/25 bg-amber/10 text-amber"
                      : "border-red/25 bg-red/10 text-red",
                )}
              >
                {entry.kind === "restore" ? (
                  <ArrowCounterclockwise20Regular />
                ) : entry.kind === "capture" ? (
                  <ArrowDownload20Regular />
                ) : entry.kind === "rule" ? (
                  <Options20Regular />
                ) : (
                  <Warning20Regular />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12px] font-medium">
                    {activityTitle(entry, t)}
                  </span>
                  {entry.trigger && (
                    <Badge tone="neutral">
                      {t(`activity.triggers.${entry.trigger}`)}
                    </Badge>
                  )}
                  <Badge tone={entry.status === "ok" ? "green" : "warning"}>
                    {t(`activity.filters.${entry.kind}`)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs leading-5 text-muted">
                  {activityDetail(entry, t)}
                </p>
                {entry.report && entry.report.failed.length > 0 && (
                  <div className="mt-1">
                    <button
                      aria-expanded={expanded.has(entry.id)}
                      className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-text"
                      onClick={() => toggleExpanded(entry.id)}
                      type="button"
                    >
                      {expanded.has(entry.id) ? (
                        <ChevronDown16Regular />
                      ) : (
                        <ChevronRight16Regular />
                      )}
                      {t("activity.report.failed", {
                        count: entry.report.failed.length,
                      })}
                    </button>
                    {expanded.has(entry.id) && (
                      <ul className="mt-1.5 space-y-1 rounded-md border border-line bg-panel-2 px-2 py-1.5">
                        {entry.report.failed.map((failure) => (
                          <li
                            className="flex items-center gap-2 text-xs"
                            key={`${entry.id}-${failure.id}-${failure.reason}`}
                          >
                            <span className="min-w-0 truncate text-text">
                              {failure.title}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-faint">
                              {failure.processName}
                            </span>
                            <span className="ml-auto shrink-0 text-[11px] text-muted">
                              {restoreReasonLabel(failure.reason, t)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs text-faint">
                {activityTime(entry, t)}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-muted">
              {t("activity.empty", {
                filter: t(`activity.filters.${filter}`),
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsView({
  settings,
  profiles,
  rules,
  monitorConfigurations,
  storePath,
  onSettingsChange,
  onResetData,
  themeMode,
  resolvedTheme,
  onThemeModeChange,
}: {
  settings: Settings;
  profiles: LayoutProfile[];
  rules: AppRule[];
  monitorConfigurations: MonitorConfiguration[];
  storePath: string;
  onSettingsChange: (next: Settings) => void;
  onResetData: () => void;
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  onThemeModeChange: (mode: ThemeMode) => void;
}) {
  const { t, i18n } = useTranslation();
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [saved, setSaved] = useState(false);

  const languageOptions = [
    { code: "en", label: t("languages.en") },
    { code: "ko", label: t("languages.ko") },
    { code: "zh-CN", label: t("languages.zh") },
    { code: "ja", label: t("languages.ja") },
  ];

  function exportData() {
    const payload = {
      app: "WindowAnchor",
      version: "0.1.0",
      exportedAt: new Date().toISOString(),
      profiles,
      rules,
      settings,
      monitorConfigurations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "windowanchor-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="panel-scroll min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <div className="mb-1 flex items-center gap-2">
            <Sparkle20Regular className="text-[var(--colorBrandForeground1)]" />
            <h1 className="text-lg font-semibold tracking-[-0.01em]">
              {t("settings.title")}
            </h1>
          </div>
          <p className="text-xs leading-5 text-muted">
            {t("settings.description")}
          </p>
        </div>

        <Section title={t("settings.behavior")}>
          <SettingRow
            description={t("settings.autoRestoreDesc")}
            label={t("settings.autoRestore")}
          >
            <Switch
              aria-label={t("settings.autoRestore")}
              checked={settings.autoRestore}
              onCheckedChange={(value) =>
                onSettingsChange({ ...settings, autoRestore: value })
              }
            />
          </SettingRow>
          <SettingRow
            description={t("settings.confirmDesc")}
            label={t("settings.confirm")}
          >
            <Switch
              aria-label={t("settings.confirm")}
              checked={settings.confirmRestore}
              onCheckedChange={(value) =>
                onSettingsChange({ ...settings, confirmRestore: value })
              }
            />
          </SettingRow>
          <SettingRow
            description={t("settings.delayDesc")}
            label={t("settings.delay")}
          >
            <select
              aria-label={t("settings.delay")}
              className="h-8 rounded-md border border-line bg-canvas px-2 text-xs text-text focus:border-line-strong focus:outline-none"
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  debounceMs: Number(event.target.value),
                })
              }
              value={String(settings.debounceMs)}
            >
              <option value="500">500 ms</option>
              <option value="1000">1 s</option>
              <option value="2000">2 s</option>
              <option value="3000">3 s</option>
            </select>
          </SettingRow>
          <SettingRow
            description={t("settings.launchDesc")}
            label={t("settings.launch")}
          >
            <Switch
              aria-label={t("settings.launch")}
              checked={launchAtLogin}
              onCheckedChange={setLaunchAtLogin}
            />
          </SettingRow>
        </Section>

        <Section title={t("settings.appearance")}>
          <SettingRow
            description={t("settings.gridDesc")}
            label={t("settings.grid")}
          >
            <Switch
              aria-label={t("settings.grid")}
              checked={settings.showGrid}
              onCheckedChange={(value) =>
                onSettingsChange({ ...settings, showGrid: value })
              }
            />
          </SettingRow>
          <SettingRow
            description={t("settings.themeDesc")}
            label={t("settings.theme")}
          >
            <select
              aria-label={t("settings.theme")}
              className="h-8 rounded-md border border-line bg-canvas px-2 text-[12px] text-text focus:border-line-strong focus:outline-none"
              onChange={(event) =>
                onThemeModeChange(event.target.value as ThemeMode)
              }
              value={themeMode}
            >
              <option value="system">
                {t("settings.themeSystem")} (
                {resolvedTheme === "dark"
                  ? t("settings.themeDark")
                  : t("settings.themeLight")}
                )
              </option>
              <option value="light">{t("settings.themeLight")}</option>
              <option value="dark">{t("settings.themeDark")}</option>
            </select>
          </SettingRow>
          <SettingRow
            description={t("settings.languageDesc")}
            label={t("settings.language")}
          >
            <select
              aria-label={t("settings.language")}
              className="h-8 rounded-md border border-line bg-canvas px-2 text-xs text-text focus:border-line-strong focus:outline-none"
              onChange={(event) => void i18n.changeLanguage(event.target.value)}
              value={i18n.resolvedLanguage ?? "en"}
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </SettingRow>
        </Section>

        <Section title={t("settings.permissions")}>
          <div className="flex items-start gap-2.5 rounded-md border border-line bg-panel-2/50 px-3 py-2.5">
            <Shield20Regular className="shrink-0 text-[var(--colorPaletteGreenForeground1)]" />
            <div>
              <div className="text-xs font-medium">{t("settings.windows")}</div>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                {t("settings.windowsDesc")}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-start gap-2.5 rounded-md border border-line bg-panel-2/50 px-3 py-2.5">
            <Keyboard20Regular className="shrink-0 text-muted" />
            <div>
              <div className="text-xs font-medium">{t("settings.macos")}</div>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                {t("settings.macosDesc")}
              </p>
            </div>
          </div>
        </Section>

        <Section title={t("settings.data")}>
          <div className="flex items-center justify-between gap-3 py-1.5">
            <div>
              <div className="text-xs font-medium">{t("settings.export")}</div>
              <p className="text-xs text-muted">{t("settings.exportDesc")}</p>
            </div>
            <Button onClick={exportData} size="sm" variant="secondary">
              {saved ? (
                <CheckmarkCircle20Regular className="text-[var(--colorPaletteGreenForeground1)]" />
              ) : (
                <ArrowDownload20Regular />
              )}
              {saved ? t("settings.exported") : t("settings.exportButton")}
            </Button>
          </div>
          {storePath && (
            <>
              <Separator className="my-2" />
              <div className="py-1.5">
                <div className="text-xs font-medium">
                  {t("settings.storePath")}
                </div>
                <p
                  className="truncate font-mono text-xs text-muted"
                  title={storePath}
                >
                  {storePath}
                </p>
              </div>
            </>
          )}
          <Separator className="my-2" />
          <div className="flex items-center justify-between gap-3 py-1.5">
            <div>
              <div className="text-xs font-medium">{t("settings.reset")}</div>
              <p className="text-xs text-muted">{t("settings.resetDesc")}</p>
            </div>
            <Button onClick={onResetData} size="sm" variant="danger">
              <Delete20Regular />
              {t("settings.resetButton")}
            </Button>
          </div>
        </Section>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2.5 text-[10px] text-faint">
          <span className="flex items-center gap-2">
            <Desktop24Regular />
            {t("settings.version")}
          </span>
          <span className="flex items-center gap-1 font-mono">
            {t("settings.localFirst")}
            <ArrowRight20Regular />
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3 rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-3 py-2">
        <h2 className="text-xs font-semibold text-muted">
          {title}
        </h2>
      </div>
      <div className="px-3 py-2">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line/60 py-2 last:border-b-0">
      <div className="min-w-0">
        <div className="text-xs font-medium text-text">{label}</div>
        <p className="text-xs leading-5 text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
