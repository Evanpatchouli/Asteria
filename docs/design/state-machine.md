# Pet State Machine Design

版本：v0.1

## 1. 目标

状态机负责将 Agent 事件转换为宠物行为。

流程：

Event ↓ State Machine ↓ Action ↓ Animation

## 2. 状态定义

``` ts
type PetState =
  | "idle"
  | "thinking"
  | "coding"
  | "tooling"
  | "waiting"
  | "happy"
  | "error"
  | "sleep";
```

## 3. 状态转换

示例：

idle -\> thinking -\> coding -\> happy

idle -\> thinking -\> tooling -\> happy

## 4. 状态优先级

优先级：

1.  error
2.  happy
3.  coding / tooling
4.  thinking
5.  waiting
6.  idle / sleep

高优先级状态可以打断低优先级状态。

`coding` 与 `tooling` 具有相同优先级，可以互相切换：

-   `coding` 表示持续编写代码
-   `tooling` 表示调用、检查或操作外部工具

`happy` 与 `error` 是瞬时状态。Runtime 按状态分别调度回落时间，默认均在
`2400ms` 后强制回到 `idle`；重复收到相同瞬时状态事件会重新计算该状态的持续时间。

## 5. Action

Action 是状态对应的具体表现。

例如：

coding: - typing - looking_screen - coffee

tooling: - inspect - operate_tool - verify

thinking: - idle_motion - thinking_pose
