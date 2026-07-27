# State Machine Implementation

版本：v0.1

## 1. 目标

将 Agent 状态转换为宠物行为。

## 2. 核心流程

    AgentEvent

    ↓

    State Transition

    ↓

    Action

    ↓

    Animation

## 3. 接口

``` ts
interface StateMachine {
  current(): PetState;

  transition(
    state: PetState,
    options?: {
      force?: boolean
    }
  ): StateTransition;
}
```

## 4. 状态规则

每个状态定义：

-   进入动作
-   持续动作
-   退出动作
-   优先级

MVP 优先级：

1.  `error`
2.  `happy`
3.  `coding`
4.  `thinking`
5.  `waiting`
6.  `idle` / `sleep`

低优先级状态不能打断高优先级状态。

`agent.idle` 和瞬时状态回落使用强制转换，确保 Runtime 可以恢复到稳定状态。

状态机只负责纯状态转换，不调用 Renderer。

## 5. 示例

coding:

进入： - start typing

持续： - typing loop

退出： - stop typing
