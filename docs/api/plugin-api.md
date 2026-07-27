# Plugin API

版本：v0.1

## 1. 插件目标

Plugin 用于扩展 AI Agent Desktop Companion 能力。

插件负责：

-   接入外部系统
-   监听事件
-   产生事件
-   扩展功能

插件不应该直接修改 Runtime 核心。

## 2. 插件结构

    plugins/
    └── example/
        ├── plugin.json
        └── index.ts

## 3. Plugin Interface

``` ts
interface Plugin {
  name: string;
  version: string;
  install(context: PluginContext): void;
  activate(): void;
  deactivate(): void;
}
```

## 4. Plugin Context

``` ts
interface PluginContext {
  eventBus: EventBus;
  logger: Logger;
  storage: Storage;
}
```

插件只能通过 Event Bus 产生或监听事件，不得直接访问或修改 Pet Runtime。

## 5. 生命周期

    install
     ↓
    initialize
     ↓
    activate
     ↓
    running
     ↓
    deactivate
     ↓
    uninstall

## 6. 示例插件

支持：

-   Claude Plugin
-   Codex Plugin
-   CS2 Plugin
