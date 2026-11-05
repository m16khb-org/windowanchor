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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CaptureDialog } from "./components/CaptureDialog";
import {
  CommandPalette,
  type CommandAction,
} from "./components/CommandPalette";
import { DeleteProfileDialog } from "./components/DeleteProfileDialog";
import { Inspector } from "./components/Inspector";
import { LayoutCanvas } from "./components/LayoutCanvas";
import { ProfileRail } from "./components/ProfileRail";
import { StatusBar } from "./components/StatusBar";
import { Toast, type ToastMessage } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { ActivityView, RulesView, SettingsView } from "./components/Views";
import type { ThemeMode } from "./Root";
import { MOCK_ACTIVITY, MOCK_PROFILES, MOCK_RULES } from "./lib/mock";
import { profileName } from "./lib/profile";
import {
  isTauri,
  loadDisplays,
  loadWindows,
  restoreWindows,
  type RestoreResult,
} from "./lib/tauri";
import type {
  ActivityEntry,
  AppRule,
  Display,
  LayoutProfile,
  View,
  WindowInfo,
} from "./lib/types";

const STORAGE_KEY = "windowanchor.profiles";
const AUTO_RESTORE_KEY = "windowanchor.autoRestore";
const GRID_KEY = "windowanchor.grid";

function loadStoredProfiles(): LayoutProfile[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as LayoutProfile[];
    if (!Array.isArray(parsed)) {
      return null;
    }
    const persisted = parsed.filter((profile) => profile.id !== "live");
    return persisted.length > 0 ? persisted : null;
  } catch {
    return null;
  }
}

function storedBoolean(key: string, fallback: boolean) {
  const raw = localStorage.getItem(key);
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return fallback;
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
  const [profiles, setProfiles] = useState<LayoutProfile[]>(() => {
    const stored = loadStoredProfiles();
    if (stored && stored.length > 0) {
      return stored;
    }
    return isTauri ? [] : MOCK_PROFILES;
  });
  const [activeProfileId, setActiveProfileId] = useState(
    () => profiles[0]?.id ?? "",
  );
  const [selectedWindowId, setSelectedWindowId] = useState<number | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [deleteProfile, setDeleteProfile] = useState<LayoutProfile | null>(null);
  const [autoRestore, setAutoRestore] = useState(() =>
    storedBoolean(AUTO_RESTORE_KEY, true),
  );
  const [showGrid, setShowGrid] = useState(() => storedBoolean(GRID_KEY, true));
  const [zoom, setZoom] = useState(1);
  const [rules, setRules] = useState<AppRule[]>(MOCK_RULES);
  const [activity, setActivity] = useState<ActivityEntry[]>(MOCK_ACTIVITY);
  const [lastAction, setLastAction] = useState(() => t("status.ready"));
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null;
  const selectedWindow =
    windows.find((window) => window.id === selectedWindowId) ?? null;

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadDisplays(), loadWindows()])
      .then(([nextDisplays, nextWindows]) => {
        if (cancelled) {
          return;
        }
        setDisplays(nextDisplays);
        setWindows(nextWindows);
        setLastAction(
          t("status.detected", {
            displays: nextDisplays.length,
            windows: nextWindows.length,
          }),
        );

        if (isTauri && profiles.length === 0 && nextWindows.length > 0) {
          const liveProfile: LayoutProfile = {
            id: "live",
            name: "Current desktop",
            nameKey: "profiles.current.name",
            description:
              "Captured from this computer when WindowAnchor started.",
            descriptionKey: "profiles.current.description",
            updatedAt: "Just now",
            updatedAtKey: "time.justNow",
            displays: nextDisplays,
            windows: nextWindows,
            accent: "#f5a524",
          };
          setProfiles([liveProfile]);
          setActiveProfileId(liveProfile.id);
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setToast({
          id: Date.now(),
          title: t("toasts.readFailed"),
          detail: message,
          tone: "warning",
        });
      });

    return () => {
      cancelled = true;
    };
    // The initial load runs once; profiles is intentionally read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const persisted = profiles.filter((profile) => profile.id !== "live");
    if (persisted.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(AUTO_RESTORE_KEY, String(autoRestore));
  }, [autoRestore]);

  useEffect(() => {
    localStorage.setItem(GRID_KEY, String(showGrid));
  }, [showGrid]);

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

  function showToast(
    title: string,
    detail: string,
    tone: ToastMessage["tone"] = "success",
  ) {
    setToast({ id: Date.now(), title, detail, tone });
  }

  function handleCapture(name: string, capturedWindows: WindowInfo[]) {
    const accentPalette = ["#f5a524", "#2dd4bf", "#60a5fa", "#fb7185", "#34d399"];
    const profile: LayoutProfile = {
      id: crypto.randomUUID(),
      name,
      description: t("profiles.capturedDescription", {
        count: capturedWindows.length,
        displays: displays.length,
      }),
      updatedAt: t("time.justNow"),
      updatedAtKey: "time.justNow",
      displays,
      windows: capturedWindows,
      accent: accentPalette[profiles.length % accentPalette.length],
    };

    setProfiles((current) => [profile, ...current]);
    setActiveProfileId(profile.id);
    setCaptureOpen(false);
    setView("layouts");
    setLastAction(
      t("status.captured", { name, count: capturedWindows.length }),
    );
    setActivity((current) => [
      {
        id: crypto.randomUUID(),
        kind: "capture",
        title: t("toasts.captured.title", { name }),
        detail: t("toasts.captured.detail", {
          count: capturedWindows.length,
        }),
        time: t("time.justNow"),
        timeKey: "time.justNow",
        status: "ok",
      },
      ...current,
    ]);
    showToast(
      t("toasts.captured.title", { name }),
      t("toasts.captured.detail", { count: capturedWindows.length }),
    );
  }

  async function handleRestore() {
    if (!activeProfile) {
      showToast(
        t("toasts.noLayout.title"),
        t("toasts.noLayout.detail"),
        "warning",
      );
      return;
    }

    const name = profileName(activeProfile, t);
    const targets = activeProfile.windows.map((window) => {
      const targetRect =
        window.state === "minimized" && window.normalRect
          ? window.normalRect
          : window.rect;

      return {
        id: window.id,
        processPath: window.processPath,
        processName: window.processName,
        className: window.className,
        title: window.title,
        x: targetRect.x,
        y: targetRect.y,
        width: targetRect.width,
        height: targetRect.height,
        state: window.state,
      };
    });

    let result: RestoreResult | null = null;
    try {
      result = await restoreWindows(targets);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(t("toasts.restoreFailed"), message, "warning");
      return;
    }

    const restored = result?.restored ?? targets.length;
    const skipped = result?.skipped ?? 0;
    const status = skipped > 0 ? "warn" : "ok";
    const firstFailure = result?.failed?.[0];
    const failedTarget = firstFailure
      ? activeProfile.windows.find((window) => window.id === firstFailure.id)
      : undefined;
    const failureReason = firstFailure?.reason;
    const reasonLabel =
      failureReason === "window_not_found"
        ? t("toasts.reasonWindowClosed")
        : failureReason === "move_failed"
          ? t("toasts.reasonRefused")
          : failureReason === "ambiguous_window"
            ? t("toasts.reasonAmbiguous")
            : failureReason === "target_off_screen"
              ? t("toasts.reasonOffScreen")
              : failureReason === "invalid_geometry"
                ? t("toasts.reasonInvalid")
                : failureReason === "move_ignored"
                  ? t("toasts.reasonIgnored")
                  : failureReason;
    const failureDetail =
      failedTarget && reasonLabel
        ? ` · ${failedTarget.title}: ${reasonLabel}`
        : "";
    const detail =
      skipped > 0
        ? t("toasts.restoredWithSkips.shortDetail", { restored, skipped })
        : t("toasts.restored.detail", { count: restored });

    setLastAction(t("status.restored", { name, detail }));
    setActivity((current) => [
      {
        id: crypto.randomUUID(),
        kind: "restore",
        title:
          skipped > 0
            ? t("toasts.restoredWithSkips.title", { name })
            : t("toasts.restored.title", { name }),
        detail: `${detail}${failureDetail}`,
        time: t("time.justNow"),
        timeKey: "time.justNow",
        status,
      },
      ...current,
    ]);
    showToast(
      skipped > 0
        ? t("toasts.restoredWithSkips.title", { name })
        : t("toasts.restored.title", { name }),
      skipped > 0
        ? `${detail}${failureDetail}`
        : t("toasts.restored.detail", { count: restored }),
      skipped > 0 ? "warning" : "success",
    );
  }

  function handleCreateRule(window: WindowInfo) {
    const rule: AppRule = {
      id: crypto.randomUUID(),
      processName: window.processName,
      match: t("rules.path"),
      matchKey: "rules.path",
      target: t("rules.targets.currentPosition"),
      targetKey: "rules.targets.currentPosition",
      priority: (rules.length + 1) * 10,
      enabled: true,
    };
    setRules((current) => [...current, rule]);
    setView("rules");
    setLastAction(t("status.ruleCreated", { process: window.processName }));
    showToast(
      t("toasts.ruleCreated.title"),
      t("toasts.ruleCreated.detail", { process: window.processName }),
    );
  }

  function handleAddRule() {
    const rule: AppRule = {
      id: crypto.randomUUID(),
      processName: "chrome.exe",
      match: t("rules.path"),
      matchKey: "rules.path",
      target: t("rules.targets.displayRight"),
      targetKey: "rules.targets.displayRight",
      priority: (rules.length + 1) * 10,
      enabled: true,
    };
    setRules((current) => [...current, rule]);
    showToast(
      t("toasts.ruleAdded.title"),
      t("toasts.ruleAdded.detail"),
    );
  }

  function handleToggleRule(id: string) {
    setRules((current) =>
      current.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    );
  }

  function handleDeleteProfile(profile: LayoutProfile) {
    const name = profileName(profile, t);
    const nextProfiles = profiles.filter((item) => item.id !== profile.id);

    setProfiles(nextProfiles);
    if (activeProfileId === profile.id) {
      setActiveProfileId(nextProfiles[0]?.id ?? "");
    }
    setSelectedWindowId(null);
    setDeleteProfile(null);
    setLastAction(t("toasts.deleted.title"));
    showToast(
      t("toasts.deleted.title"),
      t("toasts.deleted.detail", { name }),
    );
  }

  function handleCopyDiagnostics() {
    const payload = {
      app: "WindowAnchor",
      version: "0.1.0",
      capturedAt: new Date().toISOString(),
      displays,
      windows,
      activeProfileId,
      profiles,
      rules,
      activity,
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

  function handleResetData() {
    if (!window.confirm(t("toasts.confirmReset"))) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTO_RESTORE_KEY);
    localStorage.removeItem(GRID_KEY);
    setProfiles(isTauri ? [] : MOCK_PROFILES);
    setActiveProfileId("");
    setRules(MOCK_RULES);
    setActivity([]);
    setSelectedWindowId(null);
    setLastAction(t("status.reset"));
    showToast(
      t("toasts.reset.title"),
      t("toasts.reset.detail"),
    );
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
        label: autoRestore
          ? t("command.actions.pause.label")
          : t("command.actions.enable.label"),
        description: autoRestore
          ? t("command.actions.pause.description")
          : t("command.actions.enable.description"),
        icon: ShieldCheckmark24Regular,
        onSelect: () => setAutoRestore((current) => !current),
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
        label: showGrid
          ? t("command.actions.hideGrid.label")
          : t("command.actions.showGrid.label"),
        description: showGrid
          ? t("command.actions.hideGrid.description")
          : t("command.actions.showGrid.description"),
        icon: Grid20Regular,
        onSelect: () => setShowGrid((current) => !current),
      },
      {
        id: "fit",
        label: t("command.actions.fit.label"),
        description: t("command.actions.fit.description"),
        icon: ArrowFit20Regular,
        onSelect: () => setZoom(1),
      },
    ],
    // handleRestore closes over activeProfile; the action list is rebuilt when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeProfile, autoRestore, showGrid, t],
  );

  return (
    <div className="flex h-full flex-col bg-canvas text-text">
      <TopBar
        activeProfile={activeProfile}
        autoRestore={autoRestore}
        displays={displays}
        onCapture={() => setCaptureOpen(true)}
        onOpenCommand={() => setCommandOpen(true)}
        onRestore={handleRestore}
        onToggleAutoRestore={setAutoRestore}
        view={view}
        windows={windows}
      />

      <div className="flex min-h-0 flex-1">
        <ProfileRail
          activeProfileId={activeProfile?.id ?? ""}
          onCapture={() => setCaptureOpen(true)}
          onDeleteProfile={setDeleteProfile}
          onNavigate={setView}
          onSelectProfile={(profile) => {
            setActiveProfileId(profile.id);
            setView("layouts");
            setSelectedWindowId(null);
          }}
          profiles={profiles}
          view={view}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {view === "layouts" && (
            <LayoutCanvas
              displays={displays}
              onCapture={() => setCaptureOpen(true)}
              onSelectWindow={setSelectedWindowId}
              onToggleGrid={() => setShowGrid((current) => !current)}
              onZoomChange={setZoom}
              selectedWindowId={selectedWindowId}
              showGrid={showGrid}
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
              autoRestore={autoRestore}
              onResetData={handleResetData}
              onThemeModeChange={onThemeModeChange}
              onToggleAutoRestore={setAutoRestore}
              onToggleGrid={() => setShowGrid((current) => !current)}
              resolvedTheme={resolvedTheme}
              showGrid={showGrid}
              themeMode={themeMode}
            />
          )}

          <StatusBar
            autoRestore={autoRestore}
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
          number: profiles.length + 1,
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

      <CommandPalette
        actions={commandActions}
        onOpenChange={setCommandOpen}
        open={commandOpen}
      />

      <Toast onClose={() => setToast(null)} toast={toast} />
    </div>
  );
}
