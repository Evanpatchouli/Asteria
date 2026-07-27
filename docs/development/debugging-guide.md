# Development Debugging Guide

版本：v0.1

## 1. 目标

使用开发环境调试面板验证 Agent Event、Event Bus、Pet Runtime 和 PixiJS 的真实闭环。

## 2. 启动

```bash
pnpm dev
```

右键 Asteria 系统托盘图标，选择“调试面板”。

该入口仅在 Electron 连接开发 Renderer Server 时存在。`pnpm build` 和生产预览不会注册相关 IPC。

调试面板使用自定义无边框标题栏。顶部非交互区域可拖动窗口，右上角提供最小化和关闭按钮；关闭后可再次通过托盘创建。

## 3. 模拟事件

调试面板支持：

-   `agent.idle`
-   `agent.thinking`
-   `agent.coding`
-   `agent.tool_call`
-   `agent.success`
-   `agent.error`

Main Process 为事件生成协议版本、唯一 ID、时间戳和 `custom` 来源，并通过正式 `agent:event` IPC 转发。

## 4. Runtime 数据

面板显示：

-   生命周期状态
-   当前 Pet State
-   当前 Action
-   最后一个 Agent Event
-   已处理事件数量

Runtime 快照是只读观察面。外部模块仍只能通过 `dispatch(event)` 驱动状态。

## 5. 日志

日志阶段包括：

-   `MAIN`
-   `EVENT BUS`
-   `RUNTIME`
-   `RENDERER`

日志只保存在 Main Process 内存中，最多 `200` 条。关闭并重新打开调试窗口时历史仍保留；应用退出后清空。

调试面板不捕获全部 `console`，不记录文件，也不包含 FPS、Memory 或 GPU 数据。

## 6. 双语

界面提供“中文 / EN”切换，首次打开默认跟随系统语言，选择保存在版本化 `localStorage` Key 中。

事件类型、状态值和日志事件名保持协议原文；人类可读的界面和日志说明随语言切换。

Renderer 进程异常退出时，连接状态会切换为“未连接 / DISCONNECTED”；恢复并重新上报 Runtime 快照后自动恢复。
