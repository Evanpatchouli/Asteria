# IPC Design

版本：v0.1

## 1. 目标

定义 Main Process 与 Renderer Process 通信规范。

## 2. 通信类型

### Main -\> Renderer

用于：

-   Agent 事件通知
-   系统状态变化
-   更新通知

### Renderer -\> Main

用于：

-   设置保存
-   文件操作
-   系统调用
-   开发环境结构化遥测

### Debug Renderer -\> Main

仅开发环境用于：

-   获取诊断状态
-   发送模拟 Agent Event 意图
-   清空内存日志
-   最小化或关闭当前调试窗口

## 3. Channel 命名规范

格式：

    module:action

示例：

    agent:event

    settings:update

    window:hide

开发诊断 Channel：

    debug:get-state
    debug:emit-agent-event
    debug:clear-logs
    debug:minimize-window
    debug:close-window
    debug:state-changed
    debug:telemetry-report

## 4. 数据规范

所有 IPC 数据需要：

-   TypeScript 类型
-   Zod 校验
-   错误处理

## 5. 安全原则

避免：

-   任意 IPC 调用
-   暴露 Node API
-   不可信输入直接执行

## 6. 开发诊断边界

-   Debug Renderer 使用窗口专属的窄 Preload API。
-   Main 必须同时校验 IPC sender、主 Frame 和 Zod Schema。
-   Main 为模拟事件生成 `id`、`timestamp`、`protocolVersion` 和 `source: "custom"`。
-   模拟事件复用正式 `agent:event` 通道，不直接访问 Runtime。
-   Desktop Renderer 仅回传低频结构化日志和只读 Runtime 快照。
-   Main 使用最多 `200` 条的内存日志，不写入磁盘。
-   调试窗口控制只提供固定的最小化和关闭命令，并校验当前窗口主 Frame。
-   非 `pnpm dev` 环境不注册 Debug IPC Handler。
