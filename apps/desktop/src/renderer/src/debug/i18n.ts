export type DebugLocale = "en" | "zh";

const DEBUG_LOCALE_STORAGE_KEY = "asteria.debug.locale.v1";

export const DEBUG_COPY = {
  en: {
    activeAction: "Active Action",
    clearLog: "Clear Log",
    closeWindow: "Close",
    connected: "CONNECTED",
    detail: "Detail",
    disconnected: "DISCONNECTED",
    emptyLog: "No diagnostic events yet.",
    event: "Event",
    eventLog: "Event Log",
    eventSimulator: "Event Simulator",
    eventsProcessed: "Events Processed",
    lastEvent: "Last Event",
    minimizeWindow: "Minimize",
    petState: "Pet State",
    runtime: "Runtime",
    runtimeOverview: "Runtime Overview",
    source: "Source",
    stage: "Stage",
    time: "Time",
    title: "Asteria Debug Console",
  },
  zh: {
    activeAction: "当前动作",
    clearLog: "清空日志",
    closeWindow: "关闭",
    connected: "已连接",
    detail: "详情",
    disconnected: "未连接",
    emptyLog: "暂无诊断事件。",
    event: "事件",
    eventLog: "事件日志",
    eventSimulator: "事件模拟",
    eventsProcessed: "已处理事件",
    lastEvent: "最后事件",
    minimizeWindow: "最小化",
    petState: "桌宠状态",
    runtime: "运行时",
    runtimeOverview: "运行时概览",
    source: "来源",
    stage: "阶段",
    time: "时间",
    title: "Asteria 调试控制台",
  },
} as const;

export const EVENT_BUTTON_LABELS = {
  en: {
    "agent.coding": "Coding",
    "agent.error": "Error",
    "agent.idle": "Idle",
    "agent.success": "Success",
    "agent.thinking": "Thinking",
    "agent.tool_call": "Tool Call",
  },
  zh: {
    "agent.coding": "编码",
    "agent.error": "错误",
    "agent.idle": "空闲",
    "agent.success": "成功",
    "agent.thinking": "思考",
    "agent.tool_call": "工具调用",
  },
} as const;

/** Returns the saved locale or falls back to the operating-system language. */
export function getInitialDebugLocale(): DebugLocale {
  const savedLocale = window.localStorage.getItem(DEBUG_LOCALE_STORAGE_KEY);

  if (savedLocale === "en" || savedLocale === "zh") {
    return savedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** Persists the selected debug-panel locale. */
export function saveDebugLocale(locale: DebugLocale): void {
  window.localStorage.setItem(DEBUG_LOCALE_STORAGE_KEY, locale);
}
