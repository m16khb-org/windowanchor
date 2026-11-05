import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Copy,
  Download,
  History,
  Info,
  Keyboard,
  Monitor,
  Plus,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  activityDetail,
  activityTime,
  activityTitle,
  ruleTarget,
} from "../lib/profile";
import type { ActivityEntry, AppRule } from "../lib/types";
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
              <SlidersHorizontal className="h-4 w-4 text-amber" />
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
            <Plus className="h-3.5 w-3.5" />
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
              <div className="text-[10px] uppercase tracking-wide text-faint">
                {label}
              </div>
              <div className={cn("mt-0.5 text-[13px] font-medium", tone)}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_90px_44px] gap-3 border-b border-line px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-faint">
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
                  <div className="truncate font-mono text-[9px] text-faint">
                    {rule.matchKey ? t(rule.matchKey) : rule.match}
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px] text-text">
                  {ruleTarget(rule, t)}
                </div>
                <div className="text-[9px] text-faint">
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

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-panel/70 px-3 py-2.5 text-[11px] leading-5 text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue" />
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
  const filtered =
    filter === "all" ? activity : activity.filter((entry) => entry.kind === filter);

  const filters = ["all", "restore", "capture", "skip", "rule"] as const;

  return (
    <div className="panel-scroll min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <History className="h-4 w-4 text-teal" />
              <h1 className="text-lg font-semibold tracking-[-0.01em]">
                {t("activity.title")}
              </h1>
            </div>
            <p className="text-xs leading-5 text-muted">
              {t("activity.description")}
            </p>
          </div>
          <Button onClick={onCopyDiagnostics} size="sm" variant="secondary">
            <Copy className="h-3.5 w-3.5" />
            {t("activity.copy")}
          </Button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            [t("activity.restores7d"), "7", "text-text"],
            [t("activity.successRate"), "96%", "text-green"],
            [t("activity.average"), "412ms", "text-text"],
          ].map(([label, value, tone]) => (
            <div
              className="rounded-lg border border-line bg-panel px-3 py-2.5"
              key={label}
            >
              <div className="text-[10px] uppercase tracking-wide text-faint">
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
                "rounded px-2 py-1 text-[11px] capitalize transition-colors",
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
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : entry.kind === "capture" ? (
                  <Download className="h-3.5 w-3.5" />
                ) : entry.kind === "rule" ? (
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                ) : (
                  <CircleAlert className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12px] font-medium">
                    {activityTitle(entry, t)}
                  </span>
                  <Badge tone={entry.status === "ok" ? "green" : "amber"}>
                    {t(`activity.filters.${entry.kind}`)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] leading-5 text-muted">
                  {activityDetail(entry, t)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[9px] text-faint">
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
  autoRestore,
  onToggleAutoRestore,
  showGrid,
  onToggleGrid,
  onResetData,
}: {
  autoRestore: boolean;
  onToggleAutoRestore: (value: boolean) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onResetData: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [debounce, setDebounce] = useState("1000");
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
      profiles: JSON.parse(localStorage.getItem("windowanchor.profiles") ?? "[]"),
      settings: { autoRestore, showGrid, launchAtLogin, confirmRestore, debounce },
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
            <Sparkles className="h-4 w-4 text-amber" />
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
              checked={autoRestore}
              onCheckedChange={onToggleAutoRestore}
            />
          </SettingRow>
          <SettingRow
            description={t("settings.confirmDesc")}
            label={t("settings.confirm")}
          >
            <Switch
              aria-label={t("settings.confirm")}
              checked={confirmRestore}
              onCheckedChange={setConfirmRestore}
            />
          </SettingRow>
          <SettingRow
            description={t("settings.delayDesc")}
            label={t("settings.delay")}
          >
            <select
              aria-label={t("settings.delay")}
              className="h-8 rounded-md border border-line bg-canvas px-2 text-[11px] text-text focus:border-line-strong focus:outline-none"
              onChange={(event) => setDebounce(event.target.value)}
              value={debounce}
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
              checked={showGrid}
              onCheckedChange={onToggleGrid}
            />
          </SettingRow>
          <SettingRow
            description={t("settings.themeDesc")}
            label={t("settings.theme")}
          >
            <Badge tone="neutral">{t("settings.graphite")}</Badge>
          </SettingRow>
          <SettingRow
            description={t("settings.languageDesc")}
            label={t("settings.language")}
          >
            <select
              aria-label={t("settings.language")}
              className="h-8 rounded-md border border-line bg-canvas px-2 text-[11px] text-text focus:border-line-strong focus:outline-none"
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
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-green" />
            <div>
              <div className="text-[11px] font-medium">{t("settings.windows")}</div>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">
                {t("settings.windowsDesc")}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-start gap-2.5 rounded-md border border-line bg-panel-2/50 px-3 py-2.5">
            <Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <div>
              <div className="text-[11px] font-medium">{t("settings.macos")}</div>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">
                {t("settings.macosDesc")}
              </p>
            </div>
          </div>
        </Section>

        <Section title={t("settings.data")}>
          <div className="flex items-center justify-between gap-3 py-1.5">
            <div>
              <div className="text-[11px] font-medium">{t("settings.export")}</div>
              <p className="text-[10px] text-muted">{t("settings.exportDesc")}</p>
            </div>
            <Button onClick={exportData} size="sm" variant="secondary">
              {saved ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green" />
              ) : (
                <ArrowDownToLine className="h-3.5 w-3.5" />
              )}
              {saved ? t("settings.exported") : t("settings.exportButton")}
            </Button>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between gap-3 py-1.5">
            <div>
              <div className="text-[11px] font-medium">{t("settings.reset")}</div>
              <p className="text-[10px] text-muted">{t("settings.resetDesc")}</p>
            </div>
            <Button onClick={onResetData} size="sm" variant="danger">
              <Trash2 className="h-3.5 w-3.5" />
              {t("settings.resetButton")}
            </Button>
          </div>
        </Section>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2.5 text-[10px] text-faint">
          <span className="flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5" />
            {t("settings.version")}
          </span>
          <span className="flex items-center gap-1 font-mono">
            {t("settings.localFirst")}
            <ArrowRight className="h-3 w-3" />
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
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
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
        <div className="text-[11px] font-medium text-text">{label}</div>
        <p className="text-[10px] leading-4 text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
