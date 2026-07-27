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

## 3. Channel 命名规范

格式：

    module:action

示例：

    agent:event

    settings:update

    window:hide

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
