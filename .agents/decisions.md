# 架构决策记录

## 2026-07-27：MVP Phase 1 共享契约

- 内部 Agent 事件统一使用 `agent.*` 命名空间。
- `AgentEvent.protocolVersion` 使用语义化字符串，当前值为 `1.0`。
- `agent.success` 是输入事件，宠物内部成功表现状态使用 `happy`。
- IPC Channel 使用 `module:action` 命名，本阶段定义为 `agent:event`。
- 插件和外部适配器只能产生 Agent Event，不直接访问 Pet Runtime。
- Phase 1 只支持 `pixijs` 宠物资源，其他渲染引擎待后续 ADR 扩展。
