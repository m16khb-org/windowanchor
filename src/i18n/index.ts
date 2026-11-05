import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const en = {
  common: {
    window_one: "{{count}} window",
    window_other: "{{count}} windows",
    display_one: "{{count}} display",
    display_other: "{{count}} displays",
    capture: "Capture",
    restore: "Restore",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    active: "{{count}} active",
  },
  topbar: {
    layouts: "Layouts",
    rules: "Rules",
    activity: "Activity",
    settings: "Settings",
    autoRestore: "Auto-restore",
    capture: "Capture",
    restore: "Restore",
    commandPalette: "Command palette",
  },
  profiles: {
    title: "Profiles",
    search: "Search layouts",
    noMatch: "No layouts match “{{query}}”.",
    live: "Live",
    localOnly: "Local only",
    create: "Create a layout",
    updated: "Updated {{time}}",
    actions: "Layout actions",
    delete: "Delete layout",
    deleteTitle: "Delete {{name}}?",
    deleteBody:
      "This removes the saved layout from this computer. Window positions are not changed.",
    current: {
      name: "Current desktop",
      description: "Captured from this computer when WindowAnchor started.",
    },
    capturedDescription: "{{count}} windows across {{displays}} displays.",
    sample: {
      focus: {
        name: "Focus",
        description:
          "Editor and reference on the left. Terminal and design on the right.",
      },
      review: {
        name: "Review",
        description:
          "Browser and diff view together, chat on the second display.",
      },
      design: {
        name: "Design",
        description:
          "Canvas at full width with the browser and chat beside it.",
      },
      meeting: {
        name: "Meeting",
        description: "Call, notes, and chat. Everything else out of the way.",
      },
    },
  },
  time: {
    justNow: "Just now",
    twoMinutes: "2m ago",
    eighteenMinutes: "18m ago",
    yesterday: "Yesterday",
    threeDays: "3d ago",
    lastWeek: "Last week",
  },
  canvas: {
    title: "Layout editor",
    clickHint: "Select a window to inspect its layout.",
    all: "All",
    focusDisplay: "Focus display",
    display: "Display {{number}}",
    primary: "PRIMARY",
    taskbar: "Taskbar",
    zoomOut: "Zoom out",
    resetZoom: "Reset zoom",
    zoomIn: "Zoom in",
    toggleGrid: "Toggle grid",
    noDisplaysTitle: "No displays detected",
    noDisplaysBody:
      "Connect a display and refresh. WindowAnchor needs at least one active monitor to build a layout.",
    noWindowsTitle: "No windows on the canvas",
    noWindowsBody:
      "Open the apps you want to keep in place, then capture the current desktop as a layout.",
    captureCurrent: "Capture current desktop",
    selected: "Selected",
    saved: "Saved",
  },
  inspector: {
    title: "Inspector",
    clear: "Clear selection",
    state: {
      normal: "normal",
      minimized: "minimized",
      maximized: "maximized",
    },
    display: "Display {{name}}",
    unassigned: "Unassigned",
    pid: "PID {{pid}}",
    geometry: "Geometry",
    x: "X",
    y: "Y",
    width: "Width",
    height: "Height",
    displayScale: "Display scale",
    restoreBehavior: "Restore behavior",
    pin: "Pin to this display",
    exactSize: "Remember exact size",
    behaviorHelp:
      "When the display is missing, WindowAnchor keeps the relative position and clamps the window inside the nearest work area.",
    matchIdentity: "Match identity",
    process: "Process",
    windowClass: "Window class",
    createRule: "Create app rule",
    partOf:
      "This window is part of <strong>{{profile}}</strong>. Restoring the profile moves it back to these coordinates.",
    layoutHealth: "Layout health",
    updated: "Updated {{time}}",
    windows: "Windows",
    displays: "Displays",
    matched: "Matched",
    currentDesktopNote:
      "{{current}} visible windows. This layout contains {{saved}}; other windows stay where they are.",
    apps: "Apps in this layout",
    recentActivity: "Recent activity",
    noWindows: "No windows captured yet.",
    dockingTip: "Docking tip",
    dockingBody:
      "Capture once per monitor setup. WindowAnchor matches displays by device ID, resolution, and scale before falling back to relative geometry.",
    active: "{{count}} active",
  },
  capture: {
    title: "Capture layout",
    description:
      "Save the selected windows exactly as they are. Displays are recorded by device ID, resolution, and scale.",
    layoutName: "Layout name",
    placeholder: "Focus",
    defaultName: "Layout {{number}}",
    displays: "{{count}} displays",
    selected: "{{count}} windows selected",
    capturable: "{{count}} capturable windows",
    partialWarning:
      "{{count}} visible windows will not be included in this layout.",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    cancel: "Cancel",
    save: "Save layout",
    localOnly: "Captured data stays on this computer.",
    empty:
      "No capturable windows found. Open an app window and try again.",
  },
  command: {
    title: "Command palette",
    description: "Search and run WindowAnchor actions.",
    placeholder: "Type a command or search…",
    noMatch: "No commands match “{{query}}”.",
    navigate: "navigate",
    run: "run",
    actions: {
      capture: {
        label: "Capture current layout",
        description: "Save the selected windows as a named profile.",
      },
      restore: {
        label: "Restore {{name}}",
        description: "Move matched windows back into place.",
      },
      pause: {
        label: "Pause auto-restore",
        description: "Watch display changes, wake, and dock events.",
      },
      enable: {
        label: "Enable auto-restore",
        description: "Watch display changes, wake, and dock events.",
      },
      layouts: {
        label: "Go to Layouts",
        description: "Browse saved desktop layouts.",
      },
      rules: {
        label: "Go to Rules",
        description: "Inspect app matching and placement rules.",
      },
      activity: {
        label: "Go to Activity",
        description: "Review recent restores and skipped windows.",
      },
      settings: {
        label: "Go to Settings",
        description: "Change restore behavior and appearance.",
      },
      hideGrid: {
        label: "Hide grid",
        description: "Toggle the canvas grid.",
      },
      showGrid: {
        label: "Show grid",
        description: "Toggle the canvas grid.",
      },
      fit: {
        label: "Fit canvas",
        description: "Center every display in view.",
      },
    },
  },
  status: {
    watching: "Watching displays",
    paused: "Auto-restore paused",
    local: "local",
    ready: "Ready · local only",
    detected: "{{displays}} displays · {{windows}} windows detected",
    captured: "Captured {{name}} · {{count}} windows",
    restored: "Restored {{name}} · {{detail}}",
    ruleCreated: "Created rule for {{process}}",
    reset: "Local data reset",
  },
  rules: {
    title: "App rules",
    description:
      "Rules run after a profile restore and whenever a matched app opens. Process path wins over window class, and window class wins over title.",
    newRule: "New rule",
    enabled: "Enabled",
    lastMatch: "Last match",
    strategy: "Match strategy",
    strategyValue: "Path → class → title",
    application: "Application",
    target: "Target",
    priority: "Priority",
    on: "On",
    afterRestore: "after restore",
    path: "Process path",
    class: "Window class",
    callout:
      "A rule can move a matched window to a different display, but it never launches the app. Capture a profile to include the app in a layout.",
    targets: {
      code: "Display 1 · left 60%",
      chrome: "Display 1 · right 40%",
      terminal: "Display 2 · top left",
      slack: "Display 2 · bottom left",
      currentPosition: "Current position",
      displayRight: "Display 2 · right half",
    },
  },
  activity: {
    title: "Activity",
    description:
      "Every capture, restore, skipped window, and rule match stays on this machine.",
    copy: "Copy diagnostics",
    restores7d: "Restores · 7d",
    successRate: "Success rate",
    average: "Average restore",
    filters: {
      all: "All",
      restore: "Restore",
      capture: "Capture",
      skip: "Skip",
      rule: "Rule",
    },
    empty: "No {{filter}} activity yet.",
    entries: {
      restoredFocus: {
        title: "Restored Focus",
        detail: "6 windows matched · 0 skipped · 412ms",
      },
      skippedElevated: {
        title: "Skipped one elevated window",
        detail:
          "Task Manager needs the elevation helper. Run WindowAnchor as administrator.",
      },
      updatedFocus: {
        title: "Updated Focus",
        detail: "Captured 2 displays and 6 windows at 100% scale.",
      },
      restoredReview: {
        title: "Restored Review",
        detail: "4 windows matched · 1 missing app · 388ms",
      },
      ruleChrome: {
        title: "Rule applied to chrome.exe",
        detail: "Moved to Display 1 · right 40% after launch.",
      },
    },
  },
  settings: {
    title: "Settings",
    description: "Local behavior and appearance. Nothing leaves this computer.",
    behavior: "Behavior",
    autoRestore: "Auto-restore",
    autoRestoreDesc:
      "Restore the matching profile after a display change, wake, or dock.",
    confirm: "Confirm before restore",
    confirmDesc: "Ask before moving windows. Useful while you tune rules.",
    delay: "Restore delay",
    delayDesc:
      "Wait for the display configuration to settle before restoring.",
    launch: "Launch at login",
    launchDesc: "Start WindowAnchor in the system tray when you sign in.",
    appearance: "Appearance",
    grid: "Grid",
    gridDesc: "Show a subtle grid behind monitor frames.",
    theme: "Theme",
    themeDesc: "Choose light, dark, or follow Windows.",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    language: "Language",
    languageDesc: "Choose the language used across the app.",
    permissions: "Permissions",
    windows: "Windows",
    windowsDesc:
      "No special permission is required for normal windows. Elevated windows need a future helper process.",
    macos: "macOS · later",
    macosDesc:
      "Accessibility permission will be requested on first launch. It is used only to read and move app windows.",
    data: "Data",
    export: "Export data",
    exportDesc: "Profiles and settings as a JSON file.",
    exportButton: "Export",
    exported: "Exported",
    reset: "Reset local data",
    resetDesc: "Removes profiles, rules, and activity from this computer.",
    resetButton: "Reset",
    version: "WindowAnchor 0.1.0 · GPL-3.0-or-later",
    localFirst: "local-first",
  },
  toasts: {
    readFailed: "Could not read the desktop",
    captured: {
      title: "Captured {{name}}",
      detail: "{{count}} windows saved on this computer.",
    },
    noLayout: {
      title: "No layout to restore",
      detail: "Capture a layout first, then try again.",
    },
    restoreFailed: "Restore failed",
    restored: {
      title: "Restored {{name}}",
      detail: "{{count}} windows moved back into place.",
    },
    restoredWithSkips: {
      title: "Restored {{name}} with skips",
      detail:
        "{{restored}} windows moved. {{skipped}} could not be matched or moved. · {{window}}: {{reason}}",
      shortDetail: "{{restored}} windows moved. {{skipped}} could not be matched or moved.",
    },
    ruleCreated: {
      title: "Rule created",
      detail:
        "{{process}} will be matched by process path after a restore.",
    },
    ruleAdded: {
      title: "Rule added",
      detail: "Edit the target and priority in the next iteration.",
    },
    diagnosticsCopied: {
      title: "Diagnostics copied",
      detail: "The report is on your clipboard.",
    },
    diagnosticsFailed: {
      title: "Could not copy diagnostics",
      detail: "Clipboard access was denied by the system.",
    },
    reset: {
      title: "Local data reset",
      detail: "Profiles, rules, and activity were removed.",
    },
    deleted: {
      title: "Layout deleted",
      detail: "{{name}} was removed.",
    },
    confirmReset: "Remove all local profiles, rules, and activity?",
    dismiss: "Dismiss notification",
    reasonWindowClosed: "window is no longer open",
    reasonRefused: "the window refused the move",
    reasonAmbiguous: "multiple matching windows; skipped to avoid moving the wrong one",
    reasonOffScreen: "saved position is outside the current displays",
    reasonInvalid: "saved size is invalid",
    reasonIgnored: "the app ignored the requested position or size",
  },
  languages: {
    en: "English",
    ko: "한국어",
    zh: "简体中文",
    ja: "日本語",
  },
};

const ko = {
  common: {
    window_one: "창 {{count}}개",
    window_other: "창 {{count}}개",
    display_one: "디스플레이 {{count}}개",
    display_other: "디스플레이 {{count}}개",
    capture: "캡처",
    restore: "복원",
    cancel: "취소",
    save: "저장",
    close: "닫기",
    active: "{{count}}개 활성",
  },
  topbar: {
    layouts: "레이아웃",
    rules: "규칙",
    activity: "활동",
    settings: "설정",
    autoRestore: "자동 복원",
    capture: "캡처",
    restore: "복원",
    commandPalette: "명령 팔레트",
  },
  profiles: {
    title: "프로필",
    search: "레이아웃 검색",
    noMatch: "“{{query}}”와 일치하는 레이아웃이 없습니다.",
    live: "사용 중",
    localOnly: "로컬 전용",
    create: "레이아웃 만들기",
    updated: "{{time}} 업데이트",
    actions: "레이아웃 작업",
    delete: "레이아웃 삭제",
    deleteTitle: "{{name}} 레이아웃을 삭제할까요?",
    deleteBody:
      "이 컴퓨터에서 저장한 레이아웃을 삭제합니다. 창 위치는 변경되지 않습니다.",
    current: {
      name: "현재 데스크톱",
      description: "WindowAnchor가 시작될 때 이 컴퓨터에서 캡처했습니다.",
    },
    capturedDescription: "디스플레이 {{displays}}개에 걸쳐 창 {{count}}개.",
    sample: {
      focus: {
        name: "집중",
        description:
          "왼쪽에는 편집기와 참고 자료, 오른쪽에는 터미널과 디자인을 둡니다.",
      },
      review: {
        name: "리뷰",
        description:
          "브라우저와 변경 사항을 함께 보고, 두 번째 화면에는 채팅을 둡니다.",
      },
      design: {
        name: "디자인",
        description:
          "캔버스를 넓게 펼치고 옆에 브라우저와 채팅을 둡니다.",
      },
      meeting: {
        name: "회의",
        description: "통화, 메모, 채팅만 남기고 나머지는 치웁니다.",
      },
    },
  },
  time: {
    justNow: "방금",
    twoMinutes: "2분 전",
    eighteenMinutes: "18분 전",
    yesterday: "어제",
    threeDays: "3일 전",
    lastWeek: "지난주",
  },
  canvas: {
    title: "레이아웃 편집기",
    clickHint: "창을 선택하면 배치를 확인할 수 있습니다.",
    all: "전체",
    focusDisplay: "디스플레이 집중",
    display: "디스플레이 {{number}}",
    primary: "주 화면",
    taskbar: "작업 표시줄",
    zoomOut: "축소",
    resetZoom: "배율 초기화",
    zoomIn: "확대",
    toggleGrid: "격자 표시 전환",
    noDisplaysTitle: "디스플레이를 찾지 못했습니다",
    noDisplaysBody:
      "디스플레이를 연결하고 새로 고침하세요. 레이아웃을 만들려면 활성 모니터가 하나 이상 필요합니다.",
    noWindowsTitle: "캔버스에 창이 없습니다",
    noWindowsBody:
      "고정할 앱을 연 다음 현재 데스크톱을 레이아웃으로 캡처하세요.",
    captureCurrent: "현재 데스크톱 캡처",
    selected: "선택됨",
    saved: "저장됨",
  },
  inspector: {
    title: "속성",
    clear: "선택 해제",
    state: {
      normal: "일반",
      minimized: "최소화",
      maximized: "최대화",
    },
    display: "디스플레이 {{name}}",
    unassigned: "지정 안 됨",
    pid: "PID {{pid}}",
    geometry: "위치와 크기",
    x: "X",
    y: "Y",
    width: "너비",
    height: "높이",
    displayScale: "화면 배율",
    restoreBehavior: "복원 동작",
    pin: "이 디스플레이에 고정",
    exactSize: "정확한 크기 기억",
    behaviorHelp:
      "디스플레이가 없으면 상대 위치를 유지하고 가장 가까운 작업 영역 안으로 창을 밀어 넣습니다.",
    matchIdentity: "매칭 기준",
    process: "프로세스",
    windowClass: "창 클래스",
    createRule: "앱 규칙 만들기",
    partOf:
      "이 창은 <strong>{{profile}}</strong> 레이아웃에 속합니다. 프로필을 복원하면 이 좌표로 돌아갑니다.",
    layoutHealth: "레이아웃 상태",
    updated: "{{time}} 업데이트",
    windows: "창",
    displays: "디스플레이",
    matched: "매칭",
    currentDesktopNote:
      "현재 창 {{current}}개가 열려 있습니다. 이 레이아웃에는 {{saved}}개가 포함되어 있으며, 나머지 창은 그대로 둡니다.",
    apps: "이 레이아웃의 앱",
    recentActivity: "최근 활동",
    noWindows: "아직 캡처한 창이 없습니다.",
    dockingTip: "도킹 팁",
    dockingBody:
      "모니터 구성마다 한 번씩 캡처하세요. WindowAnchor는 장치 ID, 해상도, 배율로 디스플레이를 매칭하고, 실패하면 상대 위치로 대체합니다.",
    active: "{{count}}개 활성",
  },
  capture: {
    title: "레이아웃 캡처",
    description:
      "선택한 창을 현재 상태 그대로 저장합니다. 디스플레이는 장치 ID, 해상도, 배율과 함께 기록됩니다.",
    layoutName: "레이아웃 이름",
    placeholder: "집중",
    defaultName: "레이아웃 {{number}}",
    displays: "디스플레이 {{count}}개",
    selected: "창 {{count}}개 선택됨",
    capturable: "캡처 가능한 창 {{count}}개",
    partialWarning: "현재 열린 창 {{count}}개는 이 레이아웃에 포함되지 않습니다.",
    selectAll: "모두 선택",
    deselectAll: "모두 해제",
    cancel: "취소",
    save: "레이아웃 저장",
    localOnly: "캡처한 데이터는 이 컴퓨터에만 저장됩니다.",
    empty: "캡처할 창이 없습니다. 앱 창을 연 뒤 다시 시도하세요.",
  },
  command: {
    title: "명령 팔레트",
    description: "WindowAnchor 명령을 검색하고 실행합니다.",
    placeholder: "명령을 입력하거나 검색하세요…",
    noMatch: "“{{query}}”와 일치하는 명령이 없습니다.",
    navigate: "이동",
    run: "실행",
    actions: {
      capture: {
        label: "현재 레이아웃 캡처",
        description: "선택한 창을 이름이 있는 프로필로 저장합니다.",
      },
      restore: {
        label: "{{name}} 복원",
        description: "매칭된 창을 원래 위치로 옮깁니다.",
      },
      pause: {
        label: "자동 복원 일시 중지",
        description: "디스플레이 변경, 절전 복귀, 도킹 이벤트를 감시합니다.",
      },
      enable: {
        label: "자동 복원 켜기",
        description: "디스플레이 변경, 절전 복귀, 도킹 이벤트를 감시합니다.",
      },
      layouts: {
        label: "레이아웃으로 이동",
        description: "저장한 데스크톱 레이아웃을 둘러봅니다.",
      },
      rules: {
        label: "규칙으로 이동",
        description: "앱 매칭과 배치 규칙을 확인합니다.",
      },
      activity: {
        label: "활동으로 이동",
        description: "최근 복원과 건너뛴 창을 확인합니다.",
      },
      settings: {
        label: "설정으로 이동",
        description: "복원 동작과 화면을 변경합니다.",
      },
      hideGrid: {
        label: "격자 숨기기",
        description: "캔버스 격자를 전환합니다.",
      },
      showGrid: {
        label: "격자 표시",
        description: "캔버스 격자를 전환합니다.",
      },
      fit: {
        label: "캔버스 맞추기",
        description: "모든 디스플레이를 화면 가운데에 맞춥니다.",
      },
    },
  },
  status: {
    watching: "디스플레이 감시 중",
    paused: "자동 복원 일시 중지됨",
    local: "로컬",
    ready: "준비됨 · 로컬 전용",
    detected: "디스플레이 {{displays}}개 · 창 {{windows}}개 감지됨",
    captured: "{{name}} 캡처됨 · 창 {{count}}개",
    restored: "{{name}} 복원됨 · {{detail}}",
    ruleCreated: "{{process}} 규칙 생성됨",
    reset: "로컬 데이터 초기화됨",
  },
  rules: {
    title: "앱 규칙",
    description:
      "규칙은 프로필 복원 후, 그리고 매칭된 앱이 열릴 때 실행됩니다. 프로세스 경로가 창 클래스보다 우선하고, 창 클래스가 제목보다 우선합니다.",
    newRule: "새 규칙",
    enabled: "활성",
    lastMatch: "마지막 매칭",
    strategy: "매칭 전략",
    strategyValue: "경로 → 클래스 → 제목",
    application: "애플리케이션",
    target: "대상",
    priority: "우선순위",
    on: "켜짐",
    afterRestore: "복원 후",
    path: "프로세스 경로",
    class: "창 클래스",
    callout:
      "규칙은 매칭된 창을 다른 디스플레이로 옮길 수 있지만 앱을 실행하지는 않습니다. 앱을 레이아웃에 포함하려면 프로필을 캡처하세요.",
    targets: {
      code: "디스플레이 1 · 왼쪽 60%",
      chrome: "디스플레이 1 · 오른쪽 40%",
      terminal: "디스플레이 2 · 왼쪽 위",
      slack: "디스플레이 2 · 왼쪽 아래",
      currentPosition: "현재 위치",
      displayRight: "디스플레이 2 · 오른쪽 절반",
    },
  },
  activity: {
    title: "활동",
    description:
      "모든 캡처, 복원, 건너뛴 창, 규칙 매칭은 이 컴퓨터에만 기록됩니다.",
    copy: "진단 정보 복사",
    restores7d: "복원 · 7일",
    successRate: "성공률",
    average: "평균 복원 시간",
    filters: {
      all: "전체",
      restore: "복원",
      capture: "캡처",
      skip: "건너뜀",
      rule: "규칙",
    },
    empty: "{{filter}} 활동이 아직 없습니다.",
    entries: {
      restoredFocus: {
        title: "집중 복원됨",
        detail: "창 6개 매칭 · 건너뜀 0개 · 412ms",
      },
      skippedElevated: {
        title: "관리자 권한 창 1개를 건너뜀",
        detail:
          "작업 관리자는 권한 상승 도우미가 필요합니다. WindowAnchor를 관리자 권한으로 실행하세요.",
      },
      updatedFocus: {
        title: "집중 업데이트됨",
        detail: "디스플레이 2개와 창 6개를 100% 배율로 캡처했습니다.",
      },
      restoredReview: {
        title: "리뷰 복원됨",
        detail: "창 4개 매칭 · 앱 1개 누락 · 388ms",
      },
      ruleChrome: {
        title: "chrome.exe에 규칙 적용됨",
        detail: "실행 후 디스플레이 1 · 오른쪽 40%로 이동했습니다.",
      },
    },
  },
  settings: {
    title: "설정",
    description: "로컬 동작과 화면 설정입니다. 어떤 데이터도 이 컴퓨터를 떠나지 않습니다.",
    behavior: "동작",
    autoRestore: "자동 복원",
    autoRestoreDesc:
      "디스플레이 변경, 절전 복귀, 도킹 후 일치하는 프로필을 복원합니다.",
    confirm: "복원 전에 확인",
    confirmDesc: "창을 옮기기 전에 확인합니다. 규칙을 조정할 때 유용합니다.",
    delay: "복원 지연",
    delayDesc: "디스플레이 구성이 안정된 뒤 복원합니다.",
    launch: "로그인 시 실행",
    launchDesc: "로그인하면 WindowAnchor를 시스템 트레이에서 시작합니다.",
    appearance: "화면",
    grid: "격자",
    gridDesc: "모니터 프레임 뒤에 은은한 격자를 표시합니다.",
    theme: "테마",
    themeDesc: "라이트, 다크 또는 Windows 설정을 따릅니다.",
    themeSystem: "시스템",
    themeLight: "라이트",
    themeDark: "다크",
    language: "언어",
    languageDesc: "앱 전체에서 사용할 언어를 선택합니다.",
    permissions: "권한",
    windows: "Windows",
    windowsDesc:
      "일반 창에는 특별한 권한이 필요하지 않습니다. 관리자 권한 창은 향후 도우미 프로세스가 처리합니다.",
    macos: "macOS · 추후",
    macosDesc:
      "첫 실행 시 손쉬운 사용 권한을 요청합니다. 이 권한은 앱 창을 읽고 옮기는 데만 사용합니다.",
    data: "데이터",
    export: "데이터 내보내기",
    exportDesc: "프로필과 설정을 JSON 파일로 저장합니다.",
    exportButton: "내보내기",
    exported: "내보냄",
    reset: "로컬 데이터 초기화",
    resetDesc: "이 컴퓨터에서 프로필, 규칙, 활동을 삭제합니다.",
    resetButton: "초기화",
    version: "WindowAnchor 0.1.0 · GPL-3.0-or-later",
    localFirst: "로컬 우선",
  },
  toasts: {
    readFailed: "데스크톱을 읽지 못했습니다",
    captured: {
      title: "{{name}} 캡처됨",
      detail: "창 {{count}}개를 이 컴퓨터에 저장했습니다.",
    },
    noLayout: {
      title: "복원할 레이아웃이 없습니다",
      detail: "먼저 레이아웃을 캡처한 뒤 다시 시도하세요.",
    },
    restoreFailed: "복원 실패",
    restored: {
      title: "{{name}} 복원됨",
      detail: "창 {{count}}개를 원래 위치로 옮겼습니다.",
    },
    restoredWithSkips: {
      title: "{{name}} 일부만 복원됨",
      detail:
        "창 {{restored}}개를 옮겼습니다. {{skipped}}개는 매칭하거나 옮기지 못했습니다. · {{window}}: {{reason}}",
      shortDetail:
        "창 {{restored}}개를 옮겼습니다. {{skipped}}개는 매칭하거나 옮기지 못했습니다.",
    },
    ruleCreated: {
      title: "규칙 생성됨",
      detail: "복원 후 {{process}}를 프로세스 경로로 매칭합니다.",
    },
    ruleAdded: {
      title: "규칙 추가됨",
      detail: "다음 단계에서 대상과 우선순위를 편집할 수 있습니다.",
    },
    diagnosticsCopied: {
      title: "진단 정보 복사됨",
      detail: "보고서가 클립보드에 있습니다.",
    },
    diagnosticsFailed: {
      title: "진단 정보를 복사하지 못했습니다",
      detail: "시스템에서 클립보드 접근을 거부했습니다.",
    },
    reset: {
      title: "로컬 데이터 초기화됨",
      detail: "프로필, 규칙, 활동을 삭제했습니다.",
    },
    deleted: {
      title: "레이아웃 삭제됨",
      detail: "{{name}} 레이아웃을 삭제했습니다.",
    },
    confirmReset: "모든 로컬 프로필, 규칙, 활동을 삭제할까요?",
    dismiss: "알림 닫기",
    reasonWindowClosed: "창이 더 이상 열려 있지 않음",
    reasonRefused: "창이 이동을 거부함",
    reasonAmbiguous: "같은 창이 여러 개라 잘못 옮기지 않도록 건너뜀",
    reasonOffScreen: "저장된 위치가 현재 디스플레이 밖에 있음",
    reasonInvalid: "저장된 크기가 올바르지 않음",
    reasonIgnored: "앱이 요청한 위치나 크기를 무시함",
  },
  languages: {
    en: "English",
    ko: "한국어",
    zh: "简体中文",
    ja: "日本語",
  },
};

const zh = {
  common: {
    window_one: "{{count}} 个窗口",
    window_other: "{{count}} 个窗口",
    display_one: "{{count}} 个显示器",
    display_other: "{{count}} 个显示器",
    capture: "捕获",
    restore: "恢复",
    cancel: "取消",
    save: "保存",
    close: "关闭",
    active: "{{count}} 个活动",
  },
  topbar: {
    layouts: "布局",
    rules: "规则",
    activity: "活动",
    settings: "设置",
    autoRestore: "自动恢复",
    capture: "捕获",
    restore: "恢复",
    commandPalette: "命令面板",
  },
  profiles: {
    title: "配置文件",
    search: "搜索布局",
    noMatch: "没有与“{{query}}”匹配的布局。",
    live: "当前",
    localOnly: "仅本地",
    create: "创建布局",
    updated: "更新于 {{time}}",
    actions: "布局操作",
    delete: "删除布局",
    deleteTitle: "删除{{name}}？",
    deleteBody: "从这台电脑删除已保存的布局。窗口位置不会改变。",
    current: {
      name: "当前桌面",
      description: "WindowAnchor 启动时从这台电脑捕获。",
    },
    capturedDescription: "{{count}} 个窗口分布在 {{displays}} 个显示器上。",
    sample: {
      focus: {
        name: "专注",
        description: "左侧放编辑器和参考资料，右侧放终端和设计稿。",
      },
      review: {
        name: "审查",
        description: "浏览器和差异视图并排，第二个显示器放聊天。",
      },
      design: {
        name: "设计",
        description: "画布铺满宽度，旁边放浏览器和聊天。",
      },
      meeting: {
        name: "会议",
        description: "只留通话、笔记和聊天，其余全部收起。",
      },
    },
  },
  time: {
    justNow: "刚刚",
    twoMinutes: "2 分钟前",
    eighteenMinutes: "18 分钟前",
    yesterday: "昨天",
    threeDays: "3 天前",
    lastWeek: "上周",
  },
  canvas: {
    title: "布局编辑器",
    clickHint: "选择一个窗口以查看其布局。",
    all: "全部",
    focusDisplay: "聚焦显示器",
    display: "显示器 {{number}}",
    primary: "主显示器",
    taskbar: "任务栏",
    zoomOut: "缩小",
    resetZoom: "重置缩放",
    zoomIn: "放大",
    toggleGrid: "切换网格",
    noDisplaysTitle: "未检测到显示器",
    noDisplaysBody: "连接显示器并刷新。创建布局至少需要一个活动显示器。",
    noWindowsTitle: "画布上没有窗口",
    noWindowsBody: "打开需要固定的应用，然后将当前桌面捕获为布局。",
    captureCurrent: "捕获当前桌面",
    selected: "已选择",
    saved: "已保存",
  },
  inspector: {
    title: "检查器",
    clear: "清除选择",
    state: {
      normal: "普通",
      minimized: "最小化",
      maximized: "最大化",
    },
    display: "显示器 {{name}}",
    unassigned: "未分配",
    pid: "PID {{pid}}",
    geometry: "位置与大小",
    x: "X",
    y: "Y",
    width: "宽度",
    height: "高度",
    displayScale: "显示缩放",
    restoreBehavior: "恢复行为",
    pin: "固定到此显示器",
    exactSize: "记住精确大小",
    behaviorHelp:
      "当显示器不存在时，WindowAnchor 会保留相对位置，并将窗口限制在最近的工作区内。",
    matchIdentity: "匹配标识",
    process: "进程",
    windowClass: "窗口类",
    createRule: "创建应用规则",
    partOf:
      "此窗口属于 <strong>{{profile}}</strong>。恢复配置文件会将其移回这些坐标。",
    layoutHealth: "布局状态",
    updated: "更新于 {{time}}",
    windows: "窗口",
    displays: "显示器",
    matched: "已匹配",
    currentDesktopNote:
      "当前有 {{current}} 个可见窗口。此布局包含 {{saved}} 个；其他窗口会保持原位。",
    apps: "此布局中的应用",
    recentActivity: "最近活动",
    noWindows: "尚未捕获窗口。",
    dockingTip: "停靠提示",
    dockingBody:
      "每种显示器配置捕获一次。WindowAnchor 会按设备 ID、分辨率和缩放匹配显示器，失败时回退到相对位置。",
    active: "{{count}} 个活动",
  },
  capture: {
    title: "捕获布局",
    description:
      "按当前状态保存所选窗口。显示器信息按设备 ID、分辨率和缩放记录。",
    layoutName: "布局名称",
    placeholder: "专注",
    defaultName: "布局 {{number}}",
    displays: "{{count}} 个显示器",
    selected: "已选择 {{count}} 个窗口",
    capturable: "{{count}} 个可捕获窗口",
    partialWarning: "当前有 {{count}} 个可见窗口不会包含在此布局中。",
    selectAll: "全选",
    deselectAll: "取消全选",
    cancel: "取消",
    save: "保存布局",
    localOnly: "捕获的数据只保存在这台电脑上。",
    empty: "没有可捕获的窗口。请打开一个应用窗口后重试。",
  },
  command: {
    title: "命令面板",
    description: "搜索并运行 WindowAnchor 操作。",
    placeholder: "输入命令或搜索…",
    noMatch: "没有与“{{query}}”匹配的命令。",
    navigate: "导航",
    run: "运行",
    actions: {
      capture: {
        label: "捕获当前布局",
        description: "将所选窗口保存为命名配置文件。",
      },
      restore: {
        label: "恢复 {{name}}",
        description: "将匹配的窗口移回原位。",
      },
      pause: {
        label: "暂停自动恢复",
        description: "监听显示器变化、唤醒和停靠事件。",
      },
      enable: {
        label: "启用自动恢复",
        description: "监听显示器变化、唤醒和停靠事件。",
      },
      layouts: {
        label: "前往布局",
        description: "浏览已保存的桌面布局。",
      },
      rules: {
        label: "前往规则",
        description: "查看应用匹配和放置规则。",
      },
      activity: {
        label: "前往活动",
        description: "查看最近的恢复和跳过的窗口。",
      },
      settings: {
        label: "前往设置",
        description: "更改恢复行为和外观。",
      },
      hideGrid: {
        label: "隐藏网格",
        description: "切换画布网格。",
      },
      showGrid: {
        label: "显示网格",
        description: "切换画布网格。",
      },
      fit: {
        label: "适应画布",
        description: "将所有显示器居中显示。",
      },
    },
  },
  status: {
    watching: "正在监视显示器",
    paused: "自动恢复已暂停",
    local: "本地",
    ready: "就绪 · 仅本地",
    detected: "检测到 {{displays}} 个显示器 · {{windows}} 个窗口",
    captured: "已捕获 {{name}} · {{count}} 个窗口",
    restored: "已恢复 {{name}} · {{detail}}",
    ruleCreated: "已为 {{process}} 创建规则",
    reset: "本地数据已重置",
  },
  rules: {
    title: "应用规则",
    description:
      "规则会在配置文件恢复后以及匹配的应用打开时运行。进程路径优先于窗口类，窗口类优先于标题。",
    newRule: "新建规则",
    enabled: "已启用",
    lastMatch: "上次匹配",
    strategy: "匹配策略",
    strategyValue: "路径 → 类 → 标题",
    application: "应用",
    target: "目标",
    priority: "优先级",
    on: "开启",
    afterRestore: "恢复后",
    path: "进程路径",
    class: "窗口类",
    callout:
      "规则可以将匹配的窗口移到其他显示器，但不会启动应用。要将应用纳入布局，请捕获配置文件。",
    targets: {
      code: "显示器 1 · 左侧 60%",
      chrome: "显示器 1 · 右侧 40%",
      terminal: "显示器 2 · 左上",
      slack: "显示器 2 · 左下",
      currentPosition: "当前位置",
      displayRight: "显示器 2 · 右半部分",
    },
  },
  activity: {
    title: "活动",
    description: "所有捕获、恢复、跳过的窗口和规则匹配都只记录在这台电脑上。",
    copy: "复制诊断信息",
    restores7d: "恢复 · 7 天",
    successRate: "成功率",
    average: "平均恢复时间",
    filters: {
      all: "全部",
      restore: "恢复",
      capture: "捕获",
      skip: "跳过",
      rule: "规则",
    },
    empty: "暂无{{filter}}活动。",
    entries: {
      restoredFocus: {
        title: "已恢复专注",
        detail: "匹配 6 个窗口 · 跳过 0 个 · 412ms",
      },
      skippedElevated: {
        title: "跳过 1 个提升权限的窗口",
        detail: "任务管理器需要提权助手。请以管理员身份运行 WindowAnchor。",
      },
      updatedFocus: {
        title: "已更新专注",
        detail: "以 100% 缩放捕获 2 个显示器和 6 个窗口。",
      },
      restoredReview: {
        title: "已恢复审查",
        detail: "匹配 4 个窗口 · 缺少 1 个应用 · 388ms",
      },
      ruleChrome: {
        title: "已对 chrome.exe 应用规则",
        detail: "启动后移动到显示器 1 · 右侧 40%。",
      },
    },
  },
  settings: {
    title: "设置",
    description: "本地行为和外观。任何数据都不会离开这台电脑。",
    behavior: "行为",
    autoRestore: "自动恢复",
    autoRestoreDesc: "显示器变化、唤醒或停靠后恢复匹配的配置文件。",
    confirm: "恢复前确认",
    confirmDesc: "移动窗口前询问。调整规则时很有用。",
    delay: "恢复延迟",
    delayDesc: "等待显示器配置稳定后再恢复。",
    launch: "登录时启动",
    launchDesc: "登录后在系统托盘中启动 WindowAnchor。",
    appearance: "外观",
    grid: "网格",
    gridDesc: "在显示器边框后显示细微网格。",
    theme: "主题",
    themeDesc: "选择浅色、深色或跟随 Windows。",
    themeSystem: "系统",
    themeLight: "浅色",
    themeDark: "深色",
    language: "语言",
    languageDesc: "选择应用使用的语言。",
    permissions: "权限",
    windows: "Windows",
    windowsDesc:
      "普通窗口不需要特殊权限。提升权限的窗口需要未来的助手进程。",
    macos: "macOS · 以后",
    macosDesc:
      "首次启动时会请求辅助功能权限。该权限仅用于读取和移动应用窗口。",
    data: "数据",
    export: "导出数据",
    exportDesc: "将配置文件和设置导出为 JSON 文件。",
    exportButton: "导出",
    exported: "已导出",
    reset: "重置本地数据",
    resetDesc: "从这台电脑删除配置文件、规则和活动。",
    resetButton: "重置",
    version: "WindowAnchor 0.1.0 · GPL-3.0-or-later",
    localFirst: "本地优先",
  },
  toasts: {
    readFailed: "无法读取桌面",
    captured: {
      title: "已捕获 {{name}}",
      detail: "已将 {{count}} 个窗口保存到这台电脑。",
    },
    noLayout: {
      title: "没有可恢复的布局",
      detail: "请先捕获布局，然后重试。",
    },
    restoreFailed: "恢复失败",
    restored: {
      title: "已恢复 {{name}}",
      detail: "已将 {{count}} 个窗口移回原位。",
    },
    restoredWithSkips: {
      title: "{{name}} 已部分恢复",
      detail:
        "已移动 {{restored}} 个窗口。{{skipped}} 个无法匹配或移动。 · {{window}}：{{reason}}",
      shortDetail: "已移动 {{restored}} 个窗口。{{skipped}} 个无法匹配或移动。",
    },
    ruleCreated: {
      title: "已创建规则",
      detail: "恢复后将按进程路径匹配 {{process}}。",
    },
    ruleAdded: {
      title: "已添加规则",
      detail: "下一步可以编辑目标和优先级。",
    },
    diagnosticsCopied: {
      title: "已复制诊断信息",
      detail: "报告已在剪贴板中。",
    },
    diagnosticsFailed: {
      title: "无法复制诊断信息",
      detail: "系统拒绝了剪贴板访问。",
    },
    reset: {
      title: "本地数据已重置",
      detail: "配置文件、规则和活动已删除。",
    },
    deleted: {
      title: "布局已删除",
      detail: "已删除{{name}}。",
    },
    confirmReset: "删除所有本地配置文件、规则和活动？",
    dismiss: "关闭通知",
    reasonWindowClosed: "窗口已不再打开",
    reasonRefused: "窗口拒绝了移动",
    reasonAmbiguous: "存在多个匹配窗口，已跳过以避免移动错误的窗口",
    reasonOffScreen: "保存的位置在当前显示器之外",
    reasonInvalid: "保存的大小无效",
    reasonIgnored: "应用忽略了请求的位置或大小",
  },
  languages: {
    en: "English",
    ko: "한국어",
    zh: "简体中文",
    ja: "日本語",
  },
};

const ja = {
  common: {
    window_one: "{{count}} 個のウィンドウ",
    window_other: "{{count}} 個のウィンドウ",
    display_one: "{{count}} 台のディスプレイ",
    display_other: "{{count}} 台のディスプレイ",
    capture: "キャプチャ",
    restore: "復元",
    cancel: "キャンセル",
    save: "保存",
    close: "閉じる",
    active: "{{count}} 件アクティブ",
  },
  topbar: {
    layouts: "レイアウト",
    rules: "ルール",
    activity: "アクティビティ",
    settings: "設定",
    autoRestore: "自動復元",
    capture: "キャプチャ",
    restore: "復元",
    commandPalette: "コマンドパレット",
  },
  profiles: {
    title: "プロファイル",
    search: "レイアウトを検索",
    noMatch: "「{{query}}」に一致するレイアウトはありません。",
    live: "使用中",
    localOnly: "ローカルのみ",
    create: "レイアウトを作成",
    updated: "{{time}}に更新",
    actions: "レイアウト操作",
    delete: "レイアウトを削除",
    deleteTitle: "{{name}} を削除しますか？",
    deleteBody:
      "このコンピューターから保存したレイアウトを削除します。ウィンドウの位置は変更されません。",
    current: {
      name: "現在のデスクトップ",
      description: "WindowAnchor の起動時にこのコンピューターからキャプチャしました。",
    },
    capturedDescription: "{{displays}} 台のディスプレイに {{count}} 個のウィンドウ。",
    sample: {
      focus: {
        name: "集中",
        description:
          "左にエディターと参照資料、右にターミナルとデザインを置きます。",
      },
      review: {
        name: "レビュー",
        description:
          "ブラウザーと差分を並べ、2 台目のディスプレイにチャットを置きます。",
      },
      design: {
        name: "デザイン",
        description:
          "キャンバスを広く使い、隣にブラウザーとチャットを置きます。",
      },
      meeting: {
        name: "会議",
        description: "通話、メモ、チャットだけを残し、それ以外は片付けます。",
      },
    },
  },
  time: {
    justNow: "たった今",
    twoMinutes: "2 分前",
    eighteenMinutes: "18 分前",
    yesterday: "昨日",
    threeDays: "3 日前",
    lastWeek: "先週",
  },
  canvas: {
    title: "レイアウトエディター",
    clickHint: "ウィンドウを選択すると配置を確認できます。",
    all: "すべて",
    focusDisplay: "ディスプレイをフォーカス",
    display: "ディスプレイ {{number}}",
    primary: "メイン",
    taskbar: "タスクバー",
    zoomOut: "縮小",
    resetZoom: "ズームをリセット",
    zoomIn: "拡大",
    toggleGrid: "グリッドを切り替え",
    noDisplaysTitle: "ディスプレイが見つかりません",
    noDisplaysBody:
      "ディスプレイを接続して更新してください。レイアウトには 1 台以上の有効なモニターが必要です。",
    noWindowsTitle: "キャンバスにウィンドウがありません",
    noWindowsBody:
      "固定したいアプリを開き、現在のデスクトップをレイアウトとしてキャプチャしてください。",
    captureCurrent: "現在のデスクトップをキャプチャ",
    selected: "選択中",
    saved: "保存済み",
  },
  inspector: {
    title: "インスペクター",
    clear: "選択を解除",
    state: {
      normal: "通常",
      minimized: "最小化",
      maximized: "最大化",
    },
    display: "ディスプレイ {{name}}",
    unassigned: "未割り当て",
    pid: "PID {{pid}}",
    geometry: "位置とサイズ",
    x: "X",
    y: "Y",
    width: "幅",
    height: "高さ",
    displayScale: "表示スケール",
    restoreBehavior: "復元の動作",
    pin: "このディスプレイに固定",
    exactSize: "正確なサイズを記憶",
    behaviorHelp:
      "ディスプレイが見つからない場合、WindowAnchor は相対位置を保ち、最も近い作業領域内にウィンドウを収めます。",
    matchIdentity: "一致条件",
    process: "プロセス",
    windowClass: "ウィンドウクラス",
    createRule: "アプリルールを作成",
    partOf:
      "このウィンドウは <strong>{{profile}}</strong> に含まれています。プロファイルを復元すると、この座標に戻ります。",
    layoutHealth: "レイアウトの状態",
    updated: "{{time}}に更新",
    windows: "ウィンドウ",
    displays: "ディスプレイ",
    matched: "一致",
    currentDesktopNote:
      "現在 {{current}} 個のウィンドウが表示されています。このレイアウトには {{saved}} 個が含まれ、それ以外はそのまま残ります。",
    apps: "このレイアウトのアプリ",
    recentActivity: "最近のアクティビティ",
    noWindows: "まだウィンドウをキャプチャしていません。",
    dockingTip: "ドッキングのヒント",
    dockingBody:
      "モニター構成ごとに 1 回キャプチャしてください。WindowAnchor はデバイス ID、解像度、スケールでディスプレイを照合し、失敗した場合は相対位置にフォールバックします。",
    active: "{{count}} 件アクティブ",
  },
  capture: {
    title: "レイアウトをキャプチャ",
    description:
      "選択したウィンドウを現在の状態のまま保存します。ディスプレイはデバイス ID、解像度、スケールとともに記録されます。",
    layoutName: "レイアウト名",
    placeholder: "集中",
    defaultName: "レイアウト {{number}}",
    displays: "{{count}} 台のディスプレイ",
    selected: "{{count}} 個のウィンドウを選択中",
    capturable: "キャプチャ可能なウィンドウ {{count}} 個",
    partialWarning:
      "現在表示されている {{count}} 個のウィンドウはこのレイアウトに含まれません。",
    selectAll: "すべて選択",
    deselectAll: "すべて解除",
    cancel: "キャンセル",
    save: "レイアウトを保存",
    localOnly: "キャプチャしたデータはこのコンピューターにのみ保存されます。",
    empty:
      "キャプチャできるウィンドウがありません。アプリのウィンドウを開いて再試行してください。",
  },
  command: {
    title: "コマンドパレット",
    description: "WindowAnchor の操作を検索して実行します。",
    placeholder: "コマンドを入力または検索…",
    noMatch: "「{{query}}」に一致するコマンドはありません。",
    navigate: "移動",
    run: "実行",
    actions: {
      capture: {
        label: "現在のレイアウトをキャプチャ",
        description: "選択したウィンドウを名前付きプロファイルとして保存します。",
      },
      restore: {
        label: "{{name}} を復元",
        description: "一致したウィンドウを元の位置に戻します。",
      },
      pause: {
        label: "自動復元を一時停止",
        description: "ディスプレイ変更、スリープ復帰、ドッキングを監視します。",
      },
      enable: {
        label: "自動復元を有効化",
        description: "ディスプレイ変更、スリープ復帰、ドッキングを監視します。",
      },
      layouts: {
        label: "レイアウトへ移動",
        description: "保存したデスクトップレイアウトを閲覧します。",
      },
      rules: {
        label: "ルールへ移動",
        description: "アプリの一致と配置ルールを確認します。",
      },
      activity: {
        label: "アクティビティへ移動",
        description: "最近の復元とスキップされたウィンドウを確認します。",
      },
      settings: {
        label: "設定へ移動",
        description: "復元の動作と外観を変更します。",
      },
      hideGrid: {
        label: "グリッドを隠す",
        description: "キャンバスのグリッドを切り替えます。",
      },
      showGrid: {
        label: "グリッドを表示",
        description: "キャンバスのグリッドを切り替えます。",
      },
      fit: {
        label: "キャンバスに合わせる",
        description: "すべてのディスプレイを中央に表示します。",
      },
    },
  },
  status: {
    watching: "ディスプレイを監視中",
    paused: "自動復元は一時停止中",
    local: "ローカル",
    ready: "準備完了 · ローカルのみ",
    detected: "{{displays}} 台のディスプレイ · {{windows}} 個のウィンドウを検出",
    captured: "{{name}} をキャプチャ · {{count}} 個のウィンドウ",
    restored: "{{name}} を復元 · {{detail}}",
    ruleCreated: "{{process}} のルールを作成",
    reset: "ローカルデータをリセット",
  },
  rules: {
    title: "アプリルール",
    description:
      "ルールはプロファイルの復元後、および一致するアプリが開いたときに実行されます。プロセスパスがウィンドウクラスより優先され、ウィンドウクラスがタイトルより優先されます。",
    newRule: "新しいルール",
    enabled: "有効",
    lastMatch: "最後の一致",
    strategy: "一致戦略",
    strategyValue: "パス → クラス → タイトル",
    application: "アプリケーション",
    target: "対象",
    priority: "優先度",
    on: "オン",
    afterRestore: "復元後",
    path: "プロセスパス",
    class: "ウィンドウクラス",
    callout:
      "ルールは一致したウィンドウを別のディスプレイへ移動できますが、アプリは起動しません。アプリをレイアウトに含めるにはプロファイルをキャプチャしてください。",
    targets: {
      code: "ディスプレイ 1 · 左 60%",
      chrome: "ディスプレイ 1 · 右 40%",
      terminal: "ディスプレイ 2 · 左上",
      slack: "ディスプレイ 2 · 左下",
      currentPosition: "現在の位置",
      displayRight: "ディスプレイ 2 · 右半分",
    },
  },
  activity: {
    title: "アクティビティ",
    description:
      "すべてのキャプチャ、復元、スキップされたウィンドウ、ルール一致はこのコンピューターにのみ記録されます。",
    copy: "診断情報をコピー",
    restores7d: "復元 · 7 日",
    successRate: "成功率",
    average: "平均復元時間",
    filters: {
      all: "すべて",
      restore: "復元",
      capture: "キャプチャ",
      skip: "スキップ",
      rule: "ルール",
    },
    empty: "{{filter}}のアクティビティはまだありません。",
    entries: {
      restoredFocus: {
        title: "集中を復元しました",
        detail: "6 個のウィンドウが一致 · スキップ 0 · 412ms",
      },
      skippedElevated: {
        title: "管理者権限のウィンドウを 1 個スキップ",
        detail:
          "タスクマネージャーには昇格ヘルパーが必要です。WindowAnchor を管理者として実行してください。",
      },
      updatedFocus: {
        title: "集中を更新しました",
        detail: "2 台のディスプレイと 6 個のウィンドウを 100% スケールでキャプチャしました。",
      },
      restoredReview: {
        title: "レビューを復元しました",
        detail: "4 個のウィンドウが一致 · アプリ 1 個が不足 · 388ms",
      },
      ruleChrome: {
        title: "chrome.exe にルールを適用",
        detail: "起動後にディスプレイ 1 · 右 40% へ移動しました。",
      },
    },
  },
  settings: {
    title: "設定",
    description: "ローカルの動作と外観。データがこのコンピューターの外に出ることはありません。",
    behavior: "動作",
    autoRestore: "自動復元",
    autoRestoreDesc:
      "ディスプレイ変更、スリープ復帰、ドッキング後に一致するプロファイルを復元します。",
    confirm: "復元前に確認",
    confirmDesc: "ウィンドウを動かす前に確認します。ルール調整時に便利です。",
    delay: "復元の遅延",
    delayDesc: "ディスプレイ構成が安定するまで待ってから復元します。",
    launch: "ログイン時に起動",
    launchDesc: "サインイン時に WindowAnchor をシステムトレイで起動します。",
    appearance: "外観",
    grid: "グリッド",
    gridDesc: "モニターフレームの背後に控えめなグリッドを表示します。",
    theme: "テーマ",
    themeDesc: "ライト、ダーク、または Windows に従います。",
    themeSystem: "システム",
    themeLight: "ライト",
    themeDark: "ダーク",
    language: "言語",
    languageDesc: "アプリ全体で使用する言語を選択します。",
    permissions: "権限",
    windows: "Windows",
    windowsDesc:
      "通常のウィンドウに特別な権限は不要です。管理者権限のウィンドウは将来のヘルパープロセスで処理します。",
    macos: "macOS · 後日",
    macosDesc:
      "初回起動時にアクセシビリティ権限を要求します。この権限はアプリのウィンドウを読み取り、移動するためだけに使用します。",
    data: "データ",
    export: "データをエクスポート",
    exportDesc: "プロファイルと設定を JSON ファイルとして保存します。",
    exportButton: "エクスポート",
    exported: "エクスポート済み",
    reset: "ローカルデータをリセット",
    resetDesc: "このコンピューターからプロファイル、ルール、アクティビティを削除します。",
    resetButton: "リセット",
    version: "WindowAnchor 0.1.0 · GPL-3.0-or-later",
    localFirst: "ローカル優先",
  },
  toasts: {
    readFailed: "デスクトップを読み取れませんでした",
    captured: {
      title: "{{name}} をキャプチャしました",
      detail: "{{count}} 個のウィンドウをこのコンピューターに保存しました。",
    },
    noLayout: {
      title: "復元するレイアウトがありません",
      detail: "先にレイアウトをキャプチャしてから再試行してください。",
    },
    restoreFailed: "復元に失敗しました",
    restored: {
      title: "{{name}} を復元しました",
      detail: "{{count}} 個のウィンドウを元の位置に戻しました。",
    },
    restoredWithSkips: {
      title: "{{name}} を一部復元しました",
      detail:
        "{{restored}} 個のウィンドウを移動しました。{{skipped}} 個は一致または移動できませんでした。 · {{window}}: {{reason}}",
      shortDetail:
        "{{restored}} 個のウィンドウを移動しました。{{skipped}} 個は一致または移動できませんでした。",
    },
    ruleCreated: {
      title: "ルールを作成しました",
      detail: "復元後、{{process}} をプロセスパスで照合します。",
    },
    ruleAdded: {
      title: "ルールを追加しました",
      detail: "次のステップで対象と優先度を編集できます。",
    },
    diagnosticsCopied: {
      title: "診断情報をコピーしました",
      detail: "レポートがクリップボードにあります。",
    },
    diagnosticsFailed: {
      title: "診断情報をコピーできませんでした",
      detail: "システムがクリップボードへのアクセスを拒否しました。",
    },
    reset: {
      title: "ローカルデータをリセットしました",
      detail: "プロファイル、ルール、アクティビティを削除しました。",
    },
    deleted: {
      title: "レイアウトを削除しました",
      detail: "{{name}} を削除しました。",
    },
    confirmReset: "すべてのローカルプロファイル、ルール、アクティビティを削除しますか？",
    dismiss: "通知を閉じる",
    reasonWindowClosed: "ウィンドウが開かれていません",
    reasonRefused: "ウィンドウが移動を拒否しました",
    reasonAmbiguous: "一致するウィンドウが複数あるため、誤移動を避けてスキップしました",
    reasonOffScreen: "保存された位置が現在のディスプレイ外です",
    reasonInvalid: "保存されたサイズが無効です",
    reasonIgnored: "アプリが要求した位置またはサイズを無視しました",
  },
  languages: {
    en: "English",
    ko: "한국어",
    zh: "简体中文",
    ja: "日本語",
  },
};

const storedLanguage = localStorage.getItem("windowanchor.language");
const browserLanguage = navigator.language.toLowerCase();
const detectedLanguage =
  storedLanguage ??
  (browserLanguage.startsWith("ko")
    ? "ko"
    : browserLanguage.startsWith("ja")
      ? "ja"
      : browserLanguage.startsWith("zh")
        ? "zh-CN"
        : "en");

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    "zh-CN": { translation: zh },
    ja: { translation: ja },
  },
  lng: detectedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem("windowanchor.language", language);
  document.documentElement.lang = language;
});

document.documentElement.lang = detectedLanguage;

export default i18n;
