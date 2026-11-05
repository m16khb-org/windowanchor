export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Display = {
  id: string;
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

export type ActivityKind = "capture" | "restore" | "skip" | "rule";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  title: string;
  titleKey?: string;
  detail: string;
  detailKey?: string;
  detailParams?: Record<string, unknown>;
  time: string;
  timeKey?: string;
  status: "ok" | "warn" | "error";
};

export type View = "layouts" | "rules" | "activity" | "settings";
