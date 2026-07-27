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
    state: PetState
  ): void;
}
```

## 4. 状态规则

每个状态定义：

-   进入动作
-   持续动作
-   退出动作
-   优先级

## 5. 示例

coding:

进入： - start typing

持续： - typing loop

退出： - stop typing
