export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Display = {
  id: string;
  /** Monitor device interface path; "" for mock and legacy data. */
  deviceId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
  primary: boolean;
};

export type WindowState = "normal" | "minimized" | "maximized";

export type WindowInfo = {
  id: number;
  pid: number;
  processPath: string;
  processName: string;
  className: string;
  title: string;
  rect: Rect;
  normalRect: Rect | null;
  visualRect: Rect | null;
  state: WindowState;
  monitorId: string | null;
};

export type LayoutProfile = {
  id: string;
  name: string;
  nameKey?: string;
  description: string;
  descriptionKey?: string;
  hotkey?: string;
  updatedAt: string;
  updatedAtKey?: string;
  displays: Display[];
  windows: WindowInfo[];
  accent: string;
  /** Fingerprint of the profile displays; written by the backend only. */
  configurationId?: string;
};

export type AppRule = {
  id: string;
  processName: string;
  match: string;
  matchKey?: string;
  target: string;
  targetKey?: string;
  priority: number;
  enabled: boolean;
};

export type Settings = {
  autoRestore: boolean;
  confirmRestore: boolean;
  debounceMs: number;
  showGrid: boolean;
};

export type MonitorConfiguration = {
  id: string;
  displays: Display[];
  profileId: string | null;
  firstSeen: number;
  lastSeen: number;
};

export type RestoreTrigger = "manual" | "display" | "workArea" | "wake";

export type RestoreFailureReason =
  | "window_not_found"
  | "ambiguous_window"
  | "target_off_screen"
  | "invalid_geometry"
  | "move_ignored";

export type RestoreFailure = {
  id: number;
  title: string;
  processName: string;
  reason: RestoreFailureReason;
};

export type RestoreReport = {
  profileId: string;
  profileName: string;
  profileNameKey?: string;
  trigger: RestoreTrigger;
  restored: number;
  skipped: number;
  failed: RestoreFailure[];
  durationMs: number;
};

export type ActivityKind = "capture" | "restore" | "skip" | "rule";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  title: string;
  titleKey?: string;
  detail: string;
  detailKey?: string;
  detailParams?: Record<string, unknown>;
  /** Epoch milliseconds; set on every backend-created entry. */
  at?: number;
  /** Mock entries only; takes precedence over `at`. */
  timeKey?: string;
  status: "ok" | "warn" | "error";
  trigger?: RestoreTrigger;
  report?: RestoreReport;
};

export type AppState = {
  profiles: LayoutProfile[];
  rules: AppRule[];
  settings: Settings;
  activity: ActivityEntry[];
  monitorConfigurations: MonitorConfiguration[];
  currentConfigurationId: string;
  storePath: string;
};

export type RestoreConfirmRequest = {
  profileId: string;
  trigger: RestoreTrigger;
};

export type ConfigurationChangedPayload = {
  configurationId: string;
  displays: Display[];
  monitorConfigurations: MonitorConfiguration[];
};

export type View = "layouts" | "rules" | "activity" | "settings";
