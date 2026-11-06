import {
  ArrowFit20Regular,
  Camera24Regular,
  Grid20Regular,
  History20Regular,
  Layer20Regular,
  Options20Regular,
  Play24Regular,
  Settings20Regular,
  ShieldCheckmark24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CaptureDialog } from "./components/CaptureDialog";
import {
  CommandPalette,
  type CommandAction,
} from "./components/CommandPalette";
import { ConfirmRestoreDialog } from "./components/ConfirmRestoreDialog";
import { DeleteProfileDialog } from "./components/DeleteProfileDialog";
import { Inspector } from "./components/Inspector";
import { LayoutCanvas } from "./components/LayoutCanvas";
import { ProfileRail } from "./components/ProfileRail";
import { StatusBar } from "./components/StatusBar";
import { Toast, type ToastMessage } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { ActivityView, RulesView, SettingsView } from "./components/Views";
import type { ThemeMode } from "./Root";
import { DEFAULT_SETTINGS } from "./lib/mock";
import {
  activityDetail,
  profileName,
  restoreReasonLabel,
} from "./lib/profile";
import {
  appendActivity,
  assignProfile,
  deleteProfile as deleteProfileCommand,
  isTauri,
  loadDisplays,
  loadState,
  loadWindows,
  resetStore,
  restoreLayout,
  saveProfile,
  saveRules,
  saveSettings,
  subscribe,
} from "./lib/tauri";
import type {
  AppRule,
  AppState,
  Display,
  LayoutProfile,
  RestoreConfirmRequest,
  RestoreReport,
  RestoreTrigger,
  Settings,
  View,
  WindowInfo,
} from "./lib/types";

const LEGACY_PROFILES_KEY = "windowanchor.profiles";
const LEGACY_AUTO_RESTORE_KEY = "windowanchor.autoRestore";
const LEGACY_GRID_KEY = "windowanchor.grid";

function emptyState(): AppState {
  return {
    profiles: [],
    rules: [],
    settings: { ...DEFAULT_SETTINGS },
    activity: [],
    monitorConfigurations: [],
    currentConfigurationId: "",
    storePath: "",
  };
}

function liveProfile(displays: Display[], windows: WindowInfo[]): LayoutProfile {
  return {
    id: "live",
    name: "Current desktop",
    nameKey: "profiles.current.name",
    description: "Captured from this computer when WindowAnchor started.",
    descriptionKey: "profiles.current.description",
    updatedAt: new Date().toISOString(),
    updatedAtKey: "time.justNow",
    displays,
    windows,
    accent: "#f5a524",
  };
}

/** The unsaved "Current desktop" profile exists only while the store has none. */
function withLiveProfile(
  next: AppState,
  displays: Display[],
  windows: WindowInfo[],
): AppState {
  if (next.profiles.length > 0 || windows.length === 0) {
    return next;
  }
  return { ...next, profiles: [liveProfile(displays, windows)] };
}

/**
 * Legacy captures stored the translated "Just now" text instead of a date. They
 * get the migration time so their age is shown correctly from now on.
 */
function readLegacyProfiles(): LayoutProfile[] {
  const raw = localStorage.getItem(LEGACY_PROFILES_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as LayoutProfile[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    const migratedAt = new Date().toISOString();
    return parsed
      .filter((profile) => profile && profile.id !== "live")
      .map(({ updatedAtKey: _legacyKey, ...profile }) =>
        Number.isNaN(Date.parse(profile.updatedAt))
          ? { ...profile, updatedAt: migratedAt }
          : profile,
      );
  } catch {
    return [];
  }
}

/**
 * One-shot migration of the localStorage store into the app data store.
 * Profiles are saved oldest first so the backend's newest-first insert keeps order.
 */
async function migrateLegacyStore(initial: AppState): Promise<AppState> {
  let state = initial;
  const legacyProfiles = readLegacyProfiles();
  for (const profile of [...legacyProfiles].reverse()) {
    try {
      state = await saveProfile(profile);
    } catch {
      // A single unreadable legacy profile must not block the rest.
    }
  }

  const autoRestore = localStorage.getItem(LEGACY_AUTO_RESTORE_KEY);
  const grid = localStorage.getItem(LEGACY_GRID_KEY);
  const folded: Partial<Settings> = {};
  if (autoRestore === "true" || autoRestore === "false") {
    folded.autoRestore = autoRestore === "true";
  }
  if (grid === "true" || grid === "false") {
    folded.showGrid = grid === "true";
  }
  if (Object.keys(folded).length > 0) {
    try {
      state = await saveSettings({ ...state.settings, ...folded });
    } catch {
      // Keep the store settings when the fold fails.
    }
  }

  localStorage.removeItem(LEGACY_PROFILES_KEY);
  localStorage.removeItem(LEGACY_AUTO_RESTORE_KEY);
  localStorage.removeItem(LEGACY_GRID_KEY);
  return state;
}

export default function App({
  themeMode,
  resolvedTheme,
  onThemeModeChange,
}: {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  onThemeModeChange: (mode: ThemeMode) => void;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>("layouts");
  const [displays, setDisplays] = useState<Display[]>([]);
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [state, setState] = useState<AppState>(emptyState);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [selectedWindowId, setSelectedWindowId] = useState<number | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [deleteProfile, setDeleteProfile] = useState<LayoutProfile | null>(null);
  const [restoreRequest, setRestoreRequest] =
    useState<RestoreConfirmRequest | null>(null);
  const [zoom, setZoom] = useState(1);
  const [lastAction, setLastAction] = useState(() => t("status.ready"));
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const displaysRef = useRef(displays);
  const windowsRef = useRef(windows);
  useEffect(() => {
    displaysRef.current = displays;
    windowsRef.current = windows;
  }, [displays, windows]);

  const {
    profiles,
    rules,
    settings,
    activity,
    monitorConfigurations,
    currentConfigurationId,
    storePath,
  } = state;

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ??
    profiles[0] ??
    null;
  const selectedWindow =
    windows.find((window) => window.id === selectedWindowId) ?? null;
  const storedProfiles = useMemo(
    () => profiles.filter((profile) => profile.id !== "live"),
    [profiles],
  );
  const restoreProfile = restoreRequest
    ? (profiles.find((profile) => profile.id === restoreRequest.profileId) ??
      null)
    : null;

  function commitState(
    next: AppState,
    nextDisplays = displaysRef.current,
    nextWindows = windowsRef.current,
  ) {
    setState(withLiveProfile(next, nextDisplays, nextWindows));
  }

  function showToast(
    title: string,
    detail: string,
    tone: ToastMessage["tone"] = "success",
  ) {
    setToast({ id: Date.now(), title, detail, tone });
  }

  function reportError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    showToast(t("toasts.saveFailed"), message, "warning");
  }

  async function refreshDesktop() {
    try {
      const [nextDisplays, nextWindows, nextState] = await Promise.all([
        loadDisplays(),
        loadWindows(),
        loadState(),
      ]);
      setDisplays(nextDisplays);
      setWindows(nextWindows);
      commitState(nextState, nextDisplays, nextWindows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(t("toasts.readFailed"), message, "warning");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const [nextDisplays, nextWindows, initial] = await Promise.all([
          loadDisplays(),
          loadWindows(),
          loadState(),
        ]);
        if (cancelled) {
          return;
        }
        const nextState = isTauri
          ? await migrateLegacyStore(initial)
          : initial;
        if (cancelled) {
          return;
        }
        const applied = withLiveProfile(nextState, nextDisplays, nextWindows);
        setDisplays(nextDisplays);
        setWindows(nextWindows);
        setState(applied);
        setActiveProfileId(applied.profiles[0]?.id ?? "");
        setLastAction(
          t("status.detected", {
            displays: nextDisplays.length,
            windows: nextWindows.length,
          }),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToast({
          id: Date.now(),
          title: t("toasts.readFailed"),
          detail: message,
          tone: "warning",
        });
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
    // The initial load runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe({
      onActivityAdded: (entry) => {
        setState((current) =>
          current.activity.some((existing) => existing.id === entry.id)
            ? current
            : { ...current, activity: [entry, ...current.activity] },
        );
        if (!entry.trigger || entry.trigger === "manual") {
          return;
        }
        if (entry.kind === "skip") {
          showToast(
            t("toasts.autoSkip.title"),
            activityDetail(entry, t),
            "warning",
          );
          return;
        }
        void refreshDesktop();
        showToast(
          t("toasts.autoRestored.title"),
          t("toasts.autoRestored.detail", {
            trigger: t(`activity.triggers.${entry.trigger}`),
            detail: activityDetail(entry, t),
          }),
          entry.status === "ok" ? "success" : "warning",
        );
      },
      onRestoreConfirm: (request) => setRestoreRequest(request),
      onConfigurationChanged: () => {
        void refreshDesktop();
      },
    });
    return unsubscribe;
    // Re-subscribe so automatic-restore toasts follow the active language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 4800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        setCaptureOpen(true);
      }
      if (event.key === "Escape" && !captureOpen && !commandOpen) {
        setSelectedWindowId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [captureOpen, commandOpen]);

  async function handleCapture(name: string, capturedWindows: WindowInfo[]) {
    const accentPalette = ["#f5a524", "#2dd4bf", "#60a5fa", "#fb7185", "#34d399"];
    const profile: LayoutProfile = {
      id: crypto.randomUUID(),
      name,
      description: t("profiles.capturedDescription", {
        count: capturedWindows.length,
        displays: displays.length,
      }),
      updatedAt: new Date().toISOString(),
      displays,
      windows: capturedWindows,
      accent: accentPalette[storedProfiles.length % accentPalette.length],
    };

    setCaptureOpen(false);
    setView("layouts");
    setSelectedWindowId(null);
    try {
      const saved = await saveProfile(profile);
      commitState(saved);
      setActiveProfileId(profile.id);
      const withActivity = await appendActivity({
        id: crypto.randomUUID(),
        kind: "capture",
        title: "",
        titleKey: "toasts.captured.title",
        detail: "",
        detailKey: "toasts.captured.detail",
        detailParams: { name, count: capturedWindows.length },
        at: Date.now(),
        status: "ok",
      });
      commitState(withActivity);
      setLastAction(
        t("status.captured", { name, count: capturedWindows.length }),
      );
      showToast(
        t("toasts.captured.title", { name }),
        t("toasts.captured.detail", { count: capturedWindows.length }),
      );
    } catch (error: unknown) {
      reportError(error);
    }
  }

  function reportName(report: RestoreReport) {
    return report.profileNameKey
      ? t(report.profileNameKey)
      : report.profileName;
  }

  function reportDetail(report: RestoreReport) {
    const first = report.failed[0];
    const failure = first
      ? ` · ${first.title}: ${restoreReasonLabel(first.reason, t)}`
      : "";
    return report.skipped > 0
      ? `${t("toasts.restoredWithSkips.shortDetail", {
          restored: report.restored,
          skipped: report.skipped,
        })}${failure}`
      : t("toasts.restored.detail", { count: report.restored });
  }

  async function runRestore(profile: LayoutProfile, trigger: RestoreTrigger) {
    try {
      const report = await restoreLayout(profile, trigger);
      const name = reportName(report);
      showToast(
        report.skipped > 0
          ? t("toasts.restoredWithSkips.title", { name })
          : t("toasts.restored.title", { name }),
        reportDetail(report),
        report.skipped > 0 ? "warning" : "success",
      );
      setLastAction(
        t("status.restored", { name, detail: reportDetail(report) }),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(t("toasts.restoreFailed"), message, "warning");
    } finally {
      await refreshDesktop();
    }
  }

  function handleRestore() {
    if (!activeProfile) {
      showToast(
        t("toasts.noLayout.title"),
        t("toasts.noLayout.detail"),
        "warning",
      );
      return;
    }
    void runRestore(activeProfile, "manual");
  }

  async function handleConfirmRestore() {
    const request = restoreRequest;
    setRestoreRequest(null);
    if (!request) {
      return;
    }
    const profile = profiles.find((item) => item.id === request.profileId);
    if (!profile) {
      return;
    }
    await runRestore(profile, request.trigger);
  }

  async function persistRules(nextRules: AppRule[]) {
    try {
      const next = await saveRules(nextRules);
      commitState(next);
    } catch (error: unknown) {
      reportError(error);
    }
  }

  function handleCreateRule(window: WindowInfo) {
    void persistRules([
      ...rules,
      {
        id: crypto.randomUUID(),
        processName: window.processName,
        match: t("rules.path"),
        matchKey: "rules.path",
        target: t("rules.targets.currentPosition"),
        targetKey: "rules.targets.currentPosition",
        priority: (rules.length + 1) * 10,
        enabled: true,
      },
    ]);
    setView("rules");
    setLastAction(t("status.ruleCreated", { process: window.processName }));
    showToast(
      t("toasts.ruleCreated.title"),
      t("toasts.ruleCreated.detail", { process: window.processName }),
    );
  }

  function handleAddRule() {
    void persistRules([
      ...rules,
      {
        id: crypto.randomUUID(),
        processName: "chrome.exe",
        match: t("rules.path"),
        matchKey: "rules.path",
        target: t("rules.targets.displayRight"),
        targetKey: "rules.targets.displayRight",
        priority: (rules.length + 1) * 10,
        enabled: true,
      },
    ]);
    showToast(t("toasts.ruleAdded.title"), t("toasts.ruleAdded.detail"));
  }

  function handleToggleRule(id: string) {
    void persistRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    );
  }

  async function handleDeleteProfile(profile: LayoutProfile) {
    const name = profileName(profile, t);
    setDeleteProfile(null);
    setSelectedWindowId(null);
    try {
      const next = await deleteProfileCommand(profile.id);
      commitState(next);
      if (activeProfileId === profile.id) {
        setActiveProfileId("");
      }
      setLastAction(t("toasts.deleted.title"));
      showToast(
        t("toasts.deleted.title"),
        t("toasts.deleted.detail", { name }),
      );
    } catch (error: unknown) {
      reportError(error);
    }
  }

  async function handleAssignProfile(profile: LayoutProfile) {
    const name = profileName(profile, t);
    try {
      const next = await assignProfile(profile.id);
      commitState(next);
      showToast(
        t("toasts.assigned.title", { name }),
        t("toasts.assigned.detail", { name }),
      );
    } catch (error: unknown) {
      reportError(error);
    }
  }

  async function handleSettingsChange(next: Settings) {
    try {
      commitState(await saveSettings(next));
    } catch (error: unknown) {
      reportError(error);
    }
  }

  function handleCopyDiagnostics() {
    const payload = {
      app: "WindowAnchor",
      version: "0.1.0",
      capturedAt: new Date().toISOString(),
      storePath,
      displays,
      windows,
      activeProfileId,
      profiles,
      rules,
      settings,
      activity,
      monitorConfigurations,
      currentConfigurationId,
    };
    navigator.clipboard
      .writeText(JSON.stringify(payload, null, 2))
      .then(() =>
        showToast(
          t("toasts.diagnosticsCopied.title"),
          t("toasts.diagnosticsCopied.detail"),
        ),
      )
      .catch(() =>
        showToast(
          t("toasts.diagnosticsFailed.title"),
          t("toasts.diagnosticsFailed.detail"),
          "warning",
        ),
      );
  }

  async function handleResetData() {
    if (!window.confirm(t("toasts.confirmReset"))) {
      return;
    }
    try {
      const next = await resetStore();
      setState(next);
      setActiveProfileId("");
      setSelectedWindowId(null);
      setLastAction(t("status.reset"));
      showToast(t("toasts.reset.title"), t("toasts.reset.detail"));
    } catch (error: unknown) {
      reportError(error);
    }
  }

  const commandActions = useMemo<CommandAction[]>(
    () => [
      {
        id: "capture",
        label: t("command.actions.capture.label"),
        description: t("command.actions.capture.description"),
        icon: Camera24Regular,
        shortcut: "Ctrl Shift C",
        onSelect: () => setCaptureOpen(true),
      },
      {
        id: "restore",
        label: t("command.actions.restore.label", {
          name: activeProfile ? profileName(activeProfile, t) : t("topbar.layouts"),
        }),
        description: t("command.actions.restore.description"),
        icon: Play24Regular,
        onSelect: handleRestore,
      },
      {
        id: "auto",
        label: settings.autoRestore
          ? t("command.actions.pause.label")
          : t("command.actions.enable.label"),
        description: settings.autoRestore
          ? t("command.actions.pause.description")
          : t("command.actions.enable.description"),
        icon: ShieldCheckmark24Regular,
        onSelect: () =>
          void handleSettingsChange({
            ...settings,
            autoRestore: !settings.autoRestore,
          }),
      },
      {
        id: "layouts",
        label: t("command.actions.layouts.label"),
        description: t("command.actions.layouts.description"),
        icon: Layer20Regular,
        onSelect: () => setView("layouts"),
      },
      {
        id: "rules",
        label: t("command.actions.rules.label"),
        description: t("command.actions.rules.description"),
        icon: Options20Regular,
        onSelect: () => setView("rules"),
      },
      {
        id: "activity",
        label: t("command.actions.activity.label"),
        description: t("command.actions.activity.description"),
        icon: History20Regular,
        onSelect: () => setView("activity"),
      },
      {
        id: "settings",
        label: t("command.actions.settings.label"),
        description: t("command.actions.settings.description"),
        icon: Settings20Regular,
        onSelect: () => setView("settings"),
      },
      {
        id: "grid",
        label: settings.showGrid
          ? t("command.actions.hideGrid.label")
          : t("command.actions.showGrid.label"),
        description: settings.showGrid
          ? t("command.actions.hideGrid.description")
          : t("command.actions.showGrid.description"),
        icon: Grid20Regular,
        onSelect: () =>
          void handleSettingsChange({
            ...settings,
            showGrid: !settings.showGrid,
          }),
      },
      {
        id: "fit",
        label: t("command.actions.fit.label"),
        description: t("command.actions.fit.description"),
        icon: ArrowFit20Regular,
        onSelect: () => setZoom(1),
      },
    ],
    // handleRestore and the settings actions close over the current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeProfile, settings, t],
  );

  return (
    <div className="flex h-full flex-col bg-canvas text-text">
      <TopBar
        activeProfile={activeProfile}
        autoRestore={settings.autoRestore}
        displays={displays}
        onCapture={() => setCaptureOpen(true)}
        onOpenCommand={() => setCommandOpen(true)}
        onRestore={handleRestore}
        onToggleAutoRestore={(value) =>
          void handleSettingsChange({ ...settings, autoRestore: value })
        }
        view={view}
        windows={windows}
      />

      <div className="flex min-h-0 flex-1">
        <ProfileRail
          activeProfileId={activeProfile?.id ?? ""}
          activityCount={activity.length}
          currentConfigurationId={currentConfigurationId}
          monitorConfigurations={monitorConfigurations}
          onAssignProfile={handleAssignProfile}
          onCapture={() => setCaptureOpen(true)}
          onDeleteProfile={setDeleteProfile}
          onNavigate={setView}
          onSelectProfile={(profile) => {
            setActiveProfileId(profile.id);
            setView("layouts");
            setSelectedWindowId(null);
          }}
          profiles={profiles}
          ruleCount={rules.length}
          view={view}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {view === "layouts" && (
            <LayoutCanvas
              displays={displays}
              onCapture={() => setCaptureOpen(true)}
              onSelectWindow={setSelectedWindowId}
              onToggleGrid={() =>
                void handleSettingsChange({
                  ...settings,
                  showGrid: !settings.showGrid,
                })
              }
              onZoomChange={setZoom}
              selectedWindowId={selectedWindowId}
              showGrid={settings.showGrid}
              windows={windows}
              zoom={zoom}
            />
          )}
          {view === "rules" && (
            <RulesView
              onAddRule={handleAddRule}
              onToggleRule={handleToggleRule}
              rules={rules}
            />
          )}
          {view === "activity" && (
            <ActivityView
              activity={activity}
              onCopyDiagnostics={handleCopyDiagnostics}
            />
          )}
          {view === "settings" && (
            <SettingsView
              monitorConfigurations={monitorConfigurations}
              onResetData={handleResetData}
              onSettingsChange={handleSettingsChange}
              onThemeModeChange={onThemeModeChange}
              profiles={storedProfiles}
              resolvedTheme={resolvedTheme}
              rules={rules}
              settings={settings}
              storePath={storePath}
              themeMode={themeMode}
            />
          )}

          <StatusBar
            autoRestore={settings.autoRestore}
            displays={displays}
            lastAction={lastAction}
            windows={windows}
          />
        </main>

        {view === "layouts" && (
          <Inspector
            activity={activity}
            currentWindowCount={windows.length}
            displays={displays}
            onCapture={() => setCaptureOpen(true)}
            onClearSelection={() => setSelectedWindowId(null)}
            onCreateRule={handleCreateRule}
            onRestore={handleRestore}
            profile={activeProfile}
            selectedWindow={selectedWindow}
          />
        )}
      </div>

      <CaptureDialog
        defaultName={t("capture.defaultName", {
          number: storedProfiles.length + 1,
        })}
        displays={displays}
        onOpenChange={setCaptureOpen}
        onSave={handleCapture}
        open={captureOpen}
        windows={windows}
      />

      <DeleteProfileDialog
        onConfirm={handleDeleteProfile}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProfile(null);
          }
        }}
        profile={deleteProfile}
      />

      <ConfirmRestoreDialog
        onConfirm={() => void handleConfirmRestore()}
        onOpenChange={(open) => {
          if (!open) {
            setRestoreRequest(null);
          }
        }}
        profile={restoreProfile}
        trigger={restoreRequest?.trigger ?? null}
      />

      <CommandPalette
        actions={commandActions}
        onOpenChange={setCommandOpen}
        open={commandOpen}
      />

      <Toast onClose={() => setToast(null)} toast={toast} />
    </div>
  );
}
