# Debugging Guide

版本：v0.1

## 1. 调试层级

    Agent

    ↓

    Event Bus

    ↓

    Runtime

    ↓

    Renderer

    ↓

    GPU

## 2. 日志规范

日志等级：

-   debug
-   info
-   warn
-   error

## 3. Debug Panel

显示：

-   当前 State
-   最近 Event
-   FPS
-   Memory
-   Plugin 状态

## 4. 常见问题

### 动画卡顿

检查：

-   FPS
-   大纹理
-   React Render

### 状态异常

检查：

-   Event 顺序
-   State Transition
