# ADR-005: Tooling State and Transient Durations

状态：Accepted

## Context

Lumi 的编码动作与工具调用动作具有不同语义和视觉表现：

- `agent.coding` 表示持续输入代码
- `agent.tool_call` 表示检查或操作外部工具

此前两类事件都映射到 `coding`，Renderer 无法选择独立动画。同时，Runtime 使用
单一瞬时状态持续时间控制 `happy` 和 `error`，无法针对完整的成功庆祝与错误动作
分别调整播放窗口。

## Decision

### Tooling State

- Pet State 新增 `tooling`。
- `agent.tool_call` 映射到 `tooling`，不再映射到 `coding`。
- `tooling` 与 `coding` 具有相同优先级，可以相互切换。
- Renderer Action Map 必须分别提供 `coding` 和 `tooling` 动作。

### Manifest Protocol

- Pet Manifest 协议升级至 `1.1`。
- `states.tooling` 成为必需字段，并且必须引用已声明的动画。
- 不接受 `1.0` Manifest，也不提供隐式补全或兼容垫片。

### Transient Durations

- 移除单一的 `transientStateDurationMs`。
- Runtime 改用 `transientStateDurationsMs`，按 `happy` 和 `error` 分别配置。
- 两个状态默认持续时间均为 `2400ms`。
- 配置值必须是有限的非负数。
- 重复收到相同瞬时状态事件时，重新开始该状态的回落计时。

## Consequences

- Pet Runtime 可以为编码和工具调用播放语义明确的独立动画。
- 成功与错误动作可以拥有不同播放时长，而不改变状态机优先级。
- 所有内置角色包和测试 Fixture 必须升级到 Manifest `1.1` 并提供 `tooling` 动画。
- 使用旧 Runtime 构造参数或 Manifest `1.0` 的调用方必须同步迁移。
