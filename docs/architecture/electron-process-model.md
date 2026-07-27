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

## 3. Main Process 职责

负责：

-   创建窗口
-   生命周期管理
-   系统托盘
-   窗口位置和鼠标穿透状态
-   全局快捷键
-   文件系统
-   原生 API

## 4. Renderer 职责

负责：

-   宠物渲染
-   动画循环
-   用户界面
-   状态展示

## 5. Preload 职责

负责：

-   通过 `contextBridge` 暴露明确、类型化的 API
-   将 Electron IPC 事件转换为不包含 Electron 内部对象的业务数据
-   为每个订阅返回可重复调用的取消订阅函数

Preload 不暴露：

-   `ipcRenderer`
-   Node.js API
-   任意 Channel 的 `send`、`invoke` 或 `on`

## 6. 安全配置

Renderer Window 必须启用：

-   `contextIsolation: true`
-   `nodeIntegration: false`
-   `sandbox: true`

沙箱 Preload 必须完整打包为单个 CommonJS 文件。

## 7. 原则

禁止：

-   Renderer 直接访问系统权限
-   Main 参与动画逻辑
-   Agent 逻辑耦合窗口代码

窗口拖动使用 Renderer 的 CSS `app-region: drag` 声明，但坐标恢复、持久化、显示、隐藏和鼠标穿透均由 Main Process 管理。
