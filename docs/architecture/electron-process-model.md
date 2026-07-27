# Electron Process Model

版本：v0.1

## 1. 目标

定义 Electron 应用内部进程职责。

原则：

-   Main Process 管理系统能力
-   Renderer Process 负责渲染表现
-   两者通过 IPC 通信

## 2. 架构

    Electron Main Process

        |
        | IPC

        v

    Preload Bridge

        |
        | Typed API

        v

    Renderer Process

        |
        |
    Pet Runtime

        |
    Renderer Engine

开发环境额外提供独立诊断窗口：

    Debug Renderer

        |
        | Debug Preload

        v

    Main Debug Adapter / Telemetry Hub

        |
        | 标准 Agent Event

        v

    Desktop Renderer Event Bus

## 3. Main Process 职责

负责：

-   创建窗口
-   生命周期管理
-   系统托盘
-   窗口位置和鼠标穿透状态
-   全局快捷键
-   文件系统
-   原生 API
-   开发环境调试窗口和结构化遥测中转

## 4. Renderer 职责

负责：

-   宠物渲染
-   动画循环
-   用户界面
-   状态展示
-   Event Bus、Pet Runtime 和 PixiJS 的唯一组合根

Desktop Renderer 不把 Runtime 或 Renderer 实例暴露给调试窗口。

## 5. 调试 Renderer 职责

仅在 `pnpm dev` 环境启用，负责：

-   发送标准模拟 Agent Event 意图
-   展示 Main 提供的只读 Runtime 快照
-   展示最多 `200` 条内存结构化日志
-   提供中文和英文界面
-   渲染无边框标题栏，并通过窄 IPC 请求最小化或关闭自身

调试 Renderer 不创建第二套 Event Bus 或 Pet Runtime，也不能直接控制 PixiJS。

## 6. Preload 职责

负责：

-   通过 `contextBridge` 暴露明确、类型化的 API
-   将 Electron IPC 事件转换为不包含 Electron 内部对象的业务数据
-   为每个订阅返回可重复调用的取消订阅函数

Preload 不暴露：

-   `ipcRenderer`
-   Node.js API
-   任意 Channel 的 `send`、`invoke` 或 `on`

## 7. 安全配置

两个 Renderer Window 均保持：

-   `contextIsolation: true`
-   `nodeIntegration: false`
-   `sandbox: true`

沙箱 Preload 必须完整打包为单个 CommonJS 文件。Desktop 与 Debug Window 共用该 Bundle，通过 Main 注入的窗口参数只暴露对应的窄 API。Debug API 不会暴露给桌宠窗口。

生产环境不注册 Debug IPC，不显示托盘入口，也不构建 Debug Renderer HTML。

Debug Window 使用 `frame: false`。Renderer Header 通过 CSS `app-region: drag` 提供拖动区域，语言切换和窗口控制使用 `app-region: no-drag`；Renderer 不获得原生窗口对象。

## 8. 原则

禁止：

-   Renderer 直接访问系统权限
-   Main 参与动画逻辑
-   Agent 逻辑耦合窗口代码

窗口拖动使用 Renderer 的 CSS `app-region: drag` 声明，但坐标恢复、持久化、显示、隐藏、最小化、关闭和鼠标穿透均由 Main Process 管理。
