# Event Protocol

版本：v0.1

## 1. 设计目标

Event Protocol 是 AI Agent Desktop Companion 内部统一事件协议。

所有外部来源：

-   Claude Code
-   Codex
-   MCP
-   Game Plugin
-   Custom Agent

均需要转换为统一事件模型：

`AgentEvent`

数据流：

    External Source
            ↓
    Adapter
            ↓
    AgentEvent
            ↓
    Event Bus
            ↓
    Pet Runtime
            ↓
    Renderer

## 2. AgentEvent

``` ts
interface AgentEvent {
  id: string;
  protocolVersion: "1.0";
  source: "claude" | "codex" | "mcp" | "game" | "custom";
  type:
    | "agent.idle"
    | "agent.thinking"
    | "agent.coding"
    | "agent.tool_call"
    | "agent.success"
    | "agent.error";
  timestamp: number;
  payload?: unknown;
}
```

## 3. 标准事件

-   agent.idle
-   agent.thinking
-   agent.coding
-   agent.tool_call
-   agent.success
-   agent.error

## 4. Pet Event

``` ts
type PetEvent =
  | "pet.state_change"
  | "pet.action_start"
  | "pet.action_end"
  | "pet.expression_change";
```

## 5. 协议版本

所有事件需要携带 `protocolVersion`。当前版本为 `"1.0"`。

事件必须在外部接入和 IPC 边界通过运行时 Schema 校验。
