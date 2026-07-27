# ADR-004: MVP Runtime Boundaries

状态：Accepted

## Context

Phase 1 需要连接 Claude Code、Electron、Pet Runtime 与 PixiJS，同时保持模块可测试、可替换。

现有文档在事件命名、成功状态、Renderer 包名和插件上下文上存在差异。

## Decision

### Event Protocol

- Agent Event 使用 `agent.*` 命名空间。
- 所有 Agent Event 携带 `protocolVersion`。
- `agent.success` 映射到宠物内部 `happy` 状态。

### Process Boundary

- Electron Main 负责外部 Agent 接入、系统能力和窗口生命周期。
- Preload 只暴露明确、类型化的 API。
- Renderer Process 承载 Pet Runtime 与 Renderer。
- 跨进程输入必须在 Main Process 中完成运行时校验。

### Module Boundary

- Pet Runtime 只依赖 `PetRenderer` 接口。
- Agent Adapter 和插件只产生 Agent Event，不直接访问 Pet Runtime。
- Renderer 包使用 `packages/renderer`。

### Phase 1 Scope

- 只支持 PixiJS Renderer。
- Claude Adapter 静态内置，不实现动态插件加载器、沙箱或 Marketplace。
- 不实现 SQLite、Memory、Live2D、VRM、语音和云同步。

## Consequences

- Event、IPC 和资源 Manifest 由 `packages/shared` 提供唯一契约。
- 后续新增 Renderer 或协议版本时需要新的 ADR 和迁移策略。
- 插件 API 不得向插件暴露可直接修改状态的 Runtime 引用。
