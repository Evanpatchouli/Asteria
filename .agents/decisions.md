# 架构决策记录

## 2026-07-27：MVP Phase 1 共享契约

- 内部 Agent 事件统一使用 `agent.*` 命名空间。
- `AgentEvent.protocolVersion` 使用语义化字符串，当前值为 `1.0`。
- `agent.success` 是输入事件，宠物内部成功表现状态使用 `happy`。
- IPC Channel 使用 `module:action` 命名，本阶段定义为 `agent:event`。
- 插件和外部适配器只能产生 Agent Event，不直接访问 Pet Runtime。
- Phase 1 只支持 `pixijs` 宠物资源，其他渲染引擎待后续 ADR 扩展。

## 2026-07-27：Pet Runtime 状态语义

- 状态优先级为 `error > happy > coding > thinking > waiting > idle/sleep`。
- 低优先级事件不能打断高优先级状态。
- `agent.idle` 是显式复位事件，可强制回到 `idle`。
- `happy` 和 `error` 是瞬时状态，通过环境注入的调度器回落到 `idle`。
- Runtime 只消费动作名称和最小 Renderer Port，不依赖具体渲染引擎或资源路径。

## 2026-07-27：Electron 基础工程

- Electron 应用使用 `apps/desktop/src/{main,preload,renderer}` 三入口。
- 使用 electron-vite 统一 Main、Preload 和 Renderer 的开发与构建流程。
- electron-vite 5 的 Peer 范围止于 Vite 7，因此 Desktop 包固定使用 Vite 7，不依赖根测试工具传递安装的 Vite。
- Renderer 保持 `contextIsolation: true`、`nodeIntegration: false` 和 `sandbox: true`。
- 沙箱 Preload 完整打包为单个 CommonJS 产物，不通过禁用沙箱规避 ESM 限制。
- `@asteria/shared/ipc` 作为 Preload 的窄共享契约入口，避免把事件校验 Schema 打入 Preload 启动包。
- 外部 Agent Event 由 Main Process 使用 `forwardAgentEvent` 完成运行时校验后再发送，Preload 只接收已验证事件。
- 生产 Renderer CSP 不开放 WebSocket；开发 CSP 仅允许 localhost 和 127.0.0.1 的 Vite HMR WebSocket。
