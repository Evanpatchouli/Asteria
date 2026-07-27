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
