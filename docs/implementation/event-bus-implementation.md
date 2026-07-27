# Event Bus Implementation

版本：v0.1

## 1. 目标

提供进程内统一事件通信。

## 2. 接口

``` ts
interface EventBus {
  emit(event: AgentEvent): void;

  on(
    type: string,
    handler: Function
  ): void;

  off(
    type: string,
    handler: Function
  ): void;
}
```

## 3. 实现要求

支持：

-   类型安全
-   异步处理
-   日志记录
-   错误隔离

## 4. 扩展

未来支持：

-   IPC Event Bus
-   WebSocket Event Bus
-   Remote Agent Event Bus
