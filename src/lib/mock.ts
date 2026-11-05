import type {
  ActivityEntry,
  AppRule,
  Display,
  LayoutProfile,
  WindowInfo,
} from "./types";

export const APP_COLORS: Record<string, string> = {
  "Code.exe": "#f5a524",
  "chrome.exe": "#2dd4bf",
  "WindowsTerminal.exe": "#60a5fa",
  "Figma.exe": "#fb7185",
  "Slack.exe": "#34d399",
  "explorer.exe": "#94a3b8",
};

const FALLBACK_COLORS = [
  "#2dd4bf",
  "#60a5fa",
  "#fb7185",
  "#34d399",
  "#f5a524",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
];

export function appColor(processName: string) {
  const known = APP_COLORS[processName];
  if (known) {
    return known;
  }

  let hash = 0;
  for (let index = 0; index < processName.length; index += 1) {
    hash = (hash * 31 + processName.charCodeAt(index)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export const MOCK_DISPLAYS: Display[] = [
  {
    id: "\\\\.\\DISPLAY1",
    name: "Display 1",
    x: -3840,
    y: 0,
    width: 2560,
    height: 1440,
    scaleFactor: 1,
    primary: false,
  },
  {
    id: "\\\\.\\DISPLAY2",
    name: "Display 2",
    x: 0,
    y: 0,
    width: 2560,
    height: 1440,
    scaleFactor: 1,
    primary: true,
  },
];

let nextId = 100;

function windowInfo(
  processName: string,
  title: string,
  className: string,
  rect: { x: number; y: number; width: number; height: number },
  monitorId: string,
  state: WindowInfo["state"] = "normal",
): WindowInfo {
  return {
    id: nextId++,
    pid: 2000 + nextId,
    processPath: `C:\\Apps\\${processName}`,
    processName,
    className,
    title,
    rect,
    normalRect: rect,
    visualRect: rect,
    state,
    monitorId,
  };
}

export const MOCK_WINDOWS: WindowInfo[] = [
  windowInfo(
    "Code.exe",
    "windowanchor — src/App.tsx",
    "Chrome_WidgetWin_1",
    { x: -3712, y: 64, width: 1180, height: 1150 },
    "\\\\.\\DISPLAY1",
  ),
  windowInfo(
    "chrome.exe",
    "Tauri v2 · Build smaller, faster, more secure",
    "Chrome_WidgetWin_1",
    { x: -2480, y: 64, width: 960, height: 1240 },
    "\\\\.\\DISPLAY1",
  ),
  windowInfo(
    "WindowsTerminal.exe",
    "windowanchor — npm run tauri dev",
    "CASCADIA_HOSTING_WINDOW_CLASS",
    { x: 64, y: 64, width: 1100, height: 700 },
    "\\\\.\\DISPLAY2",
  ),
  windowInfo(
    "Figma.exe",
    "WindowAnchor — Layout canvas",
    "Chrome_WidgetWin_1",
    { x: 1200, y: 64, width: 1296, height: 900 },
    "\\\\.\\DISPLAY2",
  ),
  windowInfo(
    "Slack.exe",
    "WindowAnchor · design",
    "Chrome_WidgetWin_1",
    { x: 64, y: 800, width: 1100, height: 544 },
    "\\\\.\\DISPLAY2",
  ),
  windowInfo(
    "explorer.exe",
    "WindowAnchor — File Explorer",
    "CabinetWClass",
    { x: 1200, y: 1000, width: 1296, height: 344 },
    "\\\\.\\DISPLAY2",
  ),
];

export const MOCK_PROFILES: LayoutProfile[] = [
  {
    id: "focus",
    name: "Focus",
    nameKey: "profiles.sample.focus.name",
    description: "Editor and reference on the left. Terminal and design on the right.",
    descriptionKey: "profiles.sample.focus.description",
    hotkey: "Ctrl 1",
    updatedAt: "2m ago",
    updatedAtKey: "time.twoMinutes",
    displays: MOCK_DISPLAYS,
    windows: MOCK_WINDOWS,
    accent: "#f5a524",
  },
  {
    id: "review",
    name: "Review",
    nameKey: "profiles.sample.review.name",
    description: "Browser and diff view together, chat on the second display.",
    descriptionKey: "profiles.sample.review.description",
    hotkey: "Ctrl 2",
    updatedAt: "Yesterday",
    updatedAtKey: "time.yesterday",
    displays: MOCK_DISPLAYS,
    windows: MOCK_WINDOWS.filter((window) =>
      ["chrome.exe", "Code.exe", "Slack.exe", "explorer.exe"].includes(window.processName),
    ),
    accent: "#2dd4bf",
  },
  {
    id: "design",
    name: "Design",
    nameKey: "profiles.sample.design.name",
    description: "Canvas at full width with the browser and chat beside it.",
    descriptionKey: "profiles.sample.design.description",
    hotkey: "Ctrl 3",
    updatedAt: "3d ago",
    updatedAtKey: "time.threeDays",
    displays: MOCK_DISPLAYS,
    windows: MOCK_WINDOWS.filter((window) =>
      ["Figma.exe", "chrome.exe", "Slack.exe"].includes(window.processName),
    ),
    accent: "#fb7185",
  },
  {
    id: "meeting",
    name: "Meeting",
    nameKey: "profiles.sample.meeting.name",
    description: "Call, notes, and chat. Everything else out of the way.",
    descriptionKey: "profiles.sample.meeting.description",
    hotkey: "Ctrl 4",
    updatedAt: "Last week",
    updatedAtKey: "time.lastWeek",
    displays: MOCK_DISPLAYS,
    windows: MOCK_WINDOWS.filter((window) =>
      ["chrome.exe", "Slack.exe", "WindowsTerminal.exe"].includes(window.processName),
    ),
    accent: "#60a5fa",
  },
];

export const MOCK_RULES: AppRule[] = [
  {
    id: "rule-code",
    processName: "Code.exe",
    match: "Process path",
    matchKey: "rules.path",
    target: "Display 1 · left 60%",
    targetKey: "rules.targets.code",
    priority: 10,
    enabled: true,
  },
  {
    id: "rule-chrome",
    processName: "chrome.exe",
    match: "Process path",
    matchKey: "rules.path",
    target: "Display 1 · right 40%",
    targetKey: "rules.targets.chrome",
    priority: 20,
    enabled: true,
  },
  {
    id: "rule-terminal",
    processName: "WindowsTerminal.exe",
    match: "Window class",
    matchKey: "rules.class",
    target: "Display 2 · top left",
    targetKey: "rules.targets.terminal",
    priority: 30,
    enabled: true,
  },
  {
    id: "rule-slack",
    processName: "Slack.exe",
    match: "Process path",
    matchKey: "rules.path",
    target: "Display 2 · bottom left",
    targetKey: "rules.targets.slack",
    priority: 40,
    enabled: false,
  },
];

export const MOCK_ACTIVITY: ActivityEntry[] = [
  {
    id: "activity-1",
    kind: "restore",
    title: "Restored Focus",
    titleKey: "activity.entries.restoredFocus.title",
    detail: "6 windows matched · 0 skipped · 412ms",
    detailKey: "activity.entries.restoredFocus.detail",
    time: "2m ago",
    timeKey: "time.twoMinutes",
    status: "ok",
  },
  {
    id: "activity-2",
    kind: "skip",
    title: "Skipped one elevated window",
    titleKey: "activity.entries.skippedElevated.title",
    detail: "Task Manager needs the elevation helper. Run WindowAnchor as administrator.",
    detailKey: "activity.entries.skippedElevated.detail",
    time: "2m ago",
    timeKey: "time.twoMinutes",
    status: "warn",
  },
  {
    id: "activity-3",
    kind: "capture",
    title: "Updated Focus",
    titleKey: "activity.entries.updatedFocus.title",
    detail: "Captured 2 displays and 6 windows at 100% scale.",
    detailKey: "activity.entries.updatedFocus.detail",
    time: "18m ago",
    timeKey: "time.eighteenMinutes",
    status: "ok",
  },
  {
    id: "activity-4",
    kind: "restore",
    title: "Restored Review",
    titleKey: "activity.entries.restoredReview.title",
    detail: "4 windows matched · 1 missing app · 388ms",
    detailKey: "activity.entries.restoredReview.detail",
    time: "Yesterday",
    timeKey: "time.yesterday",
    status: "warn",
  },
  {
    id: "activity-5",
    kind: "rule",
    title: "Rule applied to chrome.exe",
    titleKey: "activity.entries.ruleChrome.title",
    detail: "Moved to Display 1 · right 40% after launch.",
    detailKey: "activity.entries.ruleChrome.detail",
    time: "Yesterday",
    timeKey: "time.yesterday",
    status: "ok",
  },
];

