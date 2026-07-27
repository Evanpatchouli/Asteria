# Runtime API

版本：v0.1

## 1. 目标

定义 Pet Runtime 对外核心接口。

## 2. Runtime Interface

``` ts
interface PetRuntime {
  initialize(): Promise<void>;

  dispatch(event: AgentEvent): void;

  currentState(): PetState;

  destroy(): void;
}
```

## 3. 主要职责

Runtime 负责：

-   事件处理
-   状态转换
-   动作调度
-   Renderer 调用

Runtime 通过构造参数接收：

-   `PetRendererPort`
-   `RuntimeScheduler`
-   `PetStateActionMap`
-   瞬时状态持续时间

`happy` 和 `error` 是瞬时状态，到期后强制回到 `idle`。

外部模块不得绕过 `dispatch` 直接修改状态。

## 4. 不负责

Runtime 不负责：

-   具体动画实现
-   窗口管理
-   Agent 接入细节
