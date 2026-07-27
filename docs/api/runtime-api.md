# Runtime API

版本：v0.1

## 1. 目标

定义 Pet Runtime 对外核心接口。

## 2. Runtime Interface

``` ts
interface PetRuntime {
  initialize(): Promise<void>;

  dispatch(event: AgentEvent): StateTransition;

  currentState(): PetState;

  snapshot(): PetRuntimeSnapshot;

  subscribe(observer: PetRuntimeObserver): () => void;

  destroy(): void;
}
```

```ts
type RuntimeStatus = "created" | "initializing" | "ready" | "destroyed";

interface PetRuntimeSnapshot {
  readonly status: RuntimeStatus;
  readonly state: PetState;
  readonly action: string | null;
}

type PetRuntimeObserver = (snapshot: PetRuntimeSnapshot) => void;
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
-   按状态配置的瞬时状态持续时间

```ts
interface PetRuntimeOptions {
  readonly renderer: PetRendererPort;
  readonly scheduler: RuntimeScheduler;
  readonly stateActions: PetStateActionMap;
  readonly transientStateDurationsMs?: Readonly<
    Partial<Record<"happy" | "error", number>>
  >;
}
```

`happy` 和 `error` 是瞬时状态，到期后强制回到 `idle`。两者默认持续时间均为
`2400ms`，组合层可以分别覆盖时长；配置值必须是有限的非负数。

`agent.tool_call` 映射为独立的 `tooling` 状态，不再复用 `coding`。`tooling` 与
`coding` 优先级相同，但拥有独立 Renderer Action。

外部模块不得绕过 `dispatch` 直接修改状态。

`dispatch` 返回 `StateTransition`，供组合层记录状态转换成功或因同状态、低优先级而保持不变；返回值不会改变事件驱动边界。

`snapshot` 与 `subscribe` 只提供只读观察能力：

-   订阅时立即回传当前快照
-   生命周期进入 `initializing`、`ready`、初始化失败回到 `created` 以及 `destroyed` 时通知
-   Agent Event 造成状态变化，以及瞬时状态回落到 `idle` 时通知
-   `action` 仅在 `ready` 时表示当前播放动作，其他生命周期状态为 `null`
-   观察者异常不得影响 Runtime 行为
-   `destroy` 通知最终快照后清空观察者

## 4. 不负责

Runtime 不负责：

-   具体动画实现
-   窗口管理
-   Agent 接入细节
