# Event Bus Implementation

版本：v0.1

## 1. 目标

提供进程内统一事件通信。

## 2. 接口

``` ts
interface EventBus {
  emit(event: AgentEvent): Promise<void>;

  on<T extends AgentEvent["type"]>(
    type: T,
    handler: AgentEventHandler<T>
  ): () => void;

  off<T extends AgentEvent["type"]>(
    type: T,
    handler: AgentEventHandler<T>
  ): void;
}
```

## 3. 实现要求

支持：

-   类型安全
-   异步处理
-   日志记录
-   错误隔离

## 4. 交付语义

-   事件按 `emit` 调用顺序串行交付
-   处理器按订阅顺序执行
-   异步处理器完成后才执行下一个处理器
-   单个处理器失败不会中断后续处理器
-   处理器错误通过注入的 `onHandlerError` 回调交给日志层
-   `on` 返回幂等的取消订阅函数
-   同一个处理器不会在同一事件类型下重复注册

## 5. 扩展

未来支持：

-   IPC Event Bus
-   WebSocket Event Bus
-   Remote Agent Event Bus
