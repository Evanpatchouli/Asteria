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
  | "waiting"
  | "happy"
  | "error"
  | "sleep";
```

## 3. 状态转换

示例：

idle -\> thinking -\> coding -\> happy

## 4. 状态优先级

优先级：

1.  error
2.  success
3.  coding
4.  thinking
5.  idle

高优先级状态可以打断低优先级状态。

## 5. Action

Action 是状态对应的具体表现。

例如：

coding: - typing - looking_screen - coffee

thinking: - idle_motion - thinking_pose
