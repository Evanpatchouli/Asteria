# Debug API

版本：v0.1

## 1. 范围

Debug API 是仅开发环境可用的诊断协议，不属于插件 API，也不向生产 Renderer 开放模拟事件能力。

## 2. Debug Renderer API

```ts
interface DebugApi {
  closeWindow(): Promise<void>;
  minimizeWindow(): Promise<void>;
  getState(): Promise<DebugTelemetryState>;
  emitAgentEvent(command: DebugEventCommand): Promise<void>;
  clearLogs(): Promise<void>;
  onStateChanged(
    listener: (state: DebugTelemetryState) => void
  ): () => void;
}
```

`DebugEventCommand` 只包含标准 `AgentEventType`。完整 Agent Event 由 Main Process 构造并校验。

`closeWindow()` 和 `minimizeWindow()` 只控制当前 Debug Window。Main Process 会校验调用者必须是当前调试窗口的主 Frame，不提供通用窗口句柄或任意窗口命令。

## 3. Desktop Telemetry API

```ts
interface DebugTelemetryApi {
  report(report: DebugTelemetryReport): void;
}
```

该接口只允许桌宠 Renderer 向 Main 报告：

-   结构化双语日志
-   Runtime 生命周期和状态快照

生产环境实现为无 IPC 的空操作，避免诊断逻辑影响正式运行。

## 4. Telemetry State

```ts
interface DebugTelemetryState {
  connected: boolean;
  sequence: number;
  runtime: DebugRuntimeSnapshot;
  logs: DebugLogEntry[];
}
```

-   `sequence` 单调递增，Debug Renderer 丢弃过期状态。
-   `logs` 最多包含 `200` 条。
-   所有跨进程输入在 Main Process 使用 Zod Schema 校验。
