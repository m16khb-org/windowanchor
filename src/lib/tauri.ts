import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  DEFAULT_SETTINGS,
  MOCK_ACTIVITY,
  MOCK_DISPLAYS,
  MOCK_PROFILES,
  MOCK_RULES,
  MOCK_WINDOWS,
} from "./mock";
import type {
  ActivityEntry,
  AppRule,
  AppState,
  ConfigurationChangedPayload,
  Display,
  LayoutProfile,
  MonitorConfiguration,
  RestoreConfirmRequest,
  RestoreReport,
  RestoreTrigger,
  Settings,
  WindowInfo,
} from "./types";

export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
  arch: string;
};

export type BackendEventHandlers = {
  onActivityAdded?: (entry: ActivityEntry) => void;
  onRestoreConfirm?: (request: RestoreConfirmRequest) => void;
  onConfigurationChanged?: (payload: ConfigurationChangedPayload) => void;
};

export type Unsubscribe = () => void;

/* ------------------------------------------------------------------ */
/* Browser preview backend                                            */
/* ------------------------------------------------------------------ */

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** 64-bit FNV-1a over sorted display tuples, matching the backend fingerprint. */
function fingerprint(displays: Display[]) {
  const parts = displays
    .map(
      (display) =>
        `${display.deviceId}|${display.width}x${display.height}|${Math.round(
          display.scaleFactor * 100,
        )}%|${display.primary ? 1 : 0}|${display.x},${display.y}`,
    )
    .sort();
  let hash = 0xcbf29ce484222325n;
  for (const part of parts.join("\n")) {
    for (let index = 0; index < part.length; index += 1) {
      hash ^= BigInt(part.charCodeAt(index));
      hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
    }
  }
  return `cfg-${hash.toString(16).padStart(16, "0")}`;
}

function configurationFor(
  configurations: MonitorConfiguration[],
  displays: Display[],
  create: boolean,
): MonitorConfiguration | null {
  const id = fingerprint(displays);
  const existing = configurations.find((configuration) => configuration.id === id);
  if (existing) {
    existing.lastSeen = Date.now();
    return existing;
  }
  if (!create) {
    return null;
  }
  const configuration: MonitorConfiguration = {
    id,
    displays: clone(displays),
    profileId: null,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
  };
  configurations.push(configuration);
  return configuration;
}

function seedMockState(): AppState {
  const displays = clone(MOCK_DISPLAYS);
  const configurationId = fingerprint(displays);
  const profiles = clone(MOCK_PROFILES);
  const now = Date.now();
  if (profiles[0]) {
    profiles[0].configurationId = configurationId;
  }
  return {
    profiles,
    rules: clone(MOCK_RULES),
    settings: { ...DEFAULT_SETTINGS },
    activity: clone(MOCK_ACTIVITY),
    monitorConfigurations: [
      {
        id: configurationId,
        displays,
        profileId: null,
        firstSeen: now - 24 * 60 * 60 * 1000,
        lastSeen: now,
      },
    ],
    currentConfigurationId: configurationId,
    storePath: "",
  };
}

let mockState: AppState | null = null;

function readMockState(): AppState {
  mockState ??= seedMockState();
  return mockState;
}

function writeMockState(next: AppState): AppState {
  mockState = next;
  return clone(next);
}

function updateMockState(update: (state: AppState) => AppState): AppState {
  return writeMockState(update(readMockState()));
}

function mockSaveProfile(profile: LayoutProfile): AppState {
  return updateMockState((state) => {
    const configurationId = fingerprint(profile.displays);
    const stored: LayoutProfile = { ...clone(profile), configurationId };
    const index = state.profiles.findIndex((item) => item.id === profile.id);
    const profiles =
      index === -1
        ? [stored, ...state.profiles]
        : state.profiles.map((item) =>
            item.id === profile.id ? stored : item,
          );
    if (index === -1) {
      const configuration = state.monitorConfigurations.find(
        (item) => item.id === configurationId,
      );
      if (configuration) {
        configuration.profileId = stored.id;
      }
    }
    return { ...state, profiles };
  });
}

/* ------------------------------------------------------------------ */
/* Commands                                                           */
/* ------------------------------------------------------------------ */

export async function loadDisplays(): Promise<Display[]> {
  if (!isTauri) {
    return clone(MOCK_DISPLAYS);
  }
  return invoke<Display[]>("list_displays");
}

export async function loadWindows(): Promise<WindowInfo[]> {
  if (!isTauri) {
    return clone(MOCK_WINDOWS);
  }
  return invoke<WindowInfo[]>("list_windows");
}

export async function loadState(): Promise<AppState> {
  if (!isTauri) {
    return clone(readMockState());
  }
  return invoke<AppState>("load_state");
}

export async function saveProfile(profile: LayoutProfile): Promise<AppState> {
  if (!isTauri) {
    return mockSaveProfile(profile);
  }
  return invoke<AppState>("save_profile", { profile });
}

export async function deleteProfile(id: string): Promise<AppState> {
  if (!isTauri) {
    return updateMockState((state) => ({
      ...state,
      profiles: state.profiles.filter((profile) => profile.id !== id),
      monitorConfigurations: state.monitorConfigurations.map(
        (configuration) =>
          configuration.profileId === id
            ? { ...configuration, profileId: null }
            : configuration,
      ),
    }));
  }
  return invoke<AppState>("delete_profile", { id });
}

export async function assignProfile(profileId: string): Promise<AppState> {
  if (!isTauri) {
    return updateMockState((state) => {
      const configurations = state.monitorConfigurations;
      const configuration = configurationFor(
        configurations,
        MOCK_DISPLAYS,
        true,
      );
      if (configuration) {
        configuration.profileId = profileId;
      }
      return { ...state, monitorConfigurations: configurations };
    });
  }
  return invoke<AppState>("assign_profile", { profileId });
}

export async function saveRules(rules: AppRule[]): Promise<AppState> {
  if (!isTauri) {
    return updateMockState((state) => ({ ...state, rules: clone(rules) }));
  }
  return invoke<AppState>("save_rules", { rules });
}

export async function saveSettings(settings: Settings): Promise<AppState> {
  if (!isTauri) {
    return updateMockState((state) => ({
      ...state,
      settings: clone(settings),
    }));
  }
  return invoke<AppState>("save_settings", { settings });
}

export async function appendActivity(
  entry: ActivityEntry,
): Promise<AppState> {
  if (!isTauri) {
    return updateMockState((state) => ({
      ...state,
      activity: [clone(entry), ...state.activity].slice(0, 500),
    }));
  }
  return invoke<AppState>("append_activity", { entry });
}

export async function resetStore(): Promise<AppState> {
  if (!isTauri) {
    return writeMockState({
      profiles: [],
      rules: [],
      settings: { ...DEFAULT_SETTINGS },
      activity: [],
      monitorConfigurations: [],
      currentConfigurationId: fingerprint(MOCK_DISPLAYS),
      storePath: "",
    });
  }
  return invoke<AppState>("reset_store");
}

export async function restoreLayout(
  profile: LayoutProfile,
  trigger: RestoreTrigger,
): Promise<RestoreReport> {
  if (!isTauri) {
    const report: RestoreReport = {
      profileId: profile.id,
      profileName: profile.name,
      profileNameKey: profile.nameKey,
      trigger,
      restored: profile.windows.length,
      skipped: 0,
      failed: [],
      durationMs: 0,
    };
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      kind: "restore",
      title: "",
      titleKey: "activity.log.restored",
      detail: "",
      detailKey: "activity.log.restoreDetail",
      detailParams: {
        name: profile.name,
        nameKey: profile.nameKey,
        restored: report.restored,
        skipped: report.skipped,
        durationMs: report.durationMs,
      },
      at: Date.now(),
      status: "ok",
      trigger,
      report,
    };
    updateMockState((state) => ({
      ...state,
      activity: [entry, ...state.activity].slice(0, 500),
    }));
    return report;
  }
  return invoke<RestoreReport>("restore_layout", { profile, trigger });
}

export async function loadAppInfo(): Promise<AppInfo | null> {
  if (!isTauri) {
    return null;
  }
  return invoke<AppInfo>("app_info");
}

/* ------------------------------------------------------------------ */
/* Events                                                             */
/* ------------------------------------------------------------------ */

/** Subscribes to backend events; returns an unsubscribe function. */
export function subscribe(handlers: BackendEventHandlers): Unsubscribe {
  if (!isTauri) {
    return () => {};
  }

  const unlisteners: Array<Promise<UnlistenFn>> = [
    listen<ActivityEntry>("activity-added", (event) => {
      handlers.onActivityAdded?.(event.payload);
    }),
    listen<RestoreConfirmRequest>("restore-confirm", (event) => {
      handlers.onRestoreConfirm?.(event.payload);
    }),
    listen<ConfigurationChangedPayload>(
      "configuration-changed",
      (event) => {
        handlers.onConfigurationChanged?.(event.payload);
      },
    ),
  ];

  return () => {
    for (const pending of unlisteners) {
      void pending.then((unlisten) => unlisten()).catch(() => {});
    }
  };
}
