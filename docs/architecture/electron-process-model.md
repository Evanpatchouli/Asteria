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
-   全局快捷键
-   文件系统
-   原生 API

## 4. Renderer 职责

负责：

-   宠物渲染
-   动画循环
-   用户界面
-   状态展示

## 5. 原则

禁止：

-   Renderer 直接访问系统权限
-   Main 参与动画逻辑
-   Agent 逻辑耦合窗口代码
