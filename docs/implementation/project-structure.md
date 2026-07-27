# Project Structure

版本：v0.1

## 1. 目标

定义项目代码组织方式。

## 2. 目录

    ai-pet/

    ├── apps/
    │   └── desktop/
    │       └── src/
    │           ├── main/
    │           ├── preload/
    │           └── renderer/

    ├── packages/
    │   ├── agent-core/
    │   ├── event-bus/
    │   ├── pet-runtime/
    │   ├── renderer/
    │   ├── plugin-sdk/
    │   └── shared/

    ├── pets/

    └── plugins/

## 3. 模块职责

### apps/desktop

Electron 应用入口：

-   `main` 管理窗口和应用生命周期
-   `preload` 提供类型化安全桥
-   `renderer` 承载 React UI、Pet Runtime 和 Renderer
-   `renderer/src/debug` 承载开发环境诊断面板
-   Main Process 的 Debug Adapter 和 Telemetry Hub 中转模拟事件与只读遥测

### packages/agent-core

负责 Agent 抽象。

### packages/event-bus

负责事件通信。

### packages/pet-runtime

负责状态和行为。

### packages/renderer

负责动画渲染：

-   `PixiPetRenderer` 实现 Phase 1 Renderer Port
-   管理 PixiJS Application、Ticker、Canvas 和 GPU 资源生命周期
-   加载并校验 Manifest 1.1 与 PixiJS Sprite Sheet
-   通过私有 Ticker 驱动 `AnimatedSprite`

该包不依赖 React，不处理 Agent Event，不管理窗口。

### packages/shared

负责跨进程、跨模块共享的事件、IPC、开发诊断和资源 Manifest 契约。

### plugins

外部能力扩展。

### pets

-   `lumi/reference` 保存用户确认的角色主设定稿与状态关键姿势
-   `lumi/source` 保存六状态 3×2 透明动画源图
-   `public/lumi` 保存由构建脚本生成并发布给 Electron Renderer 的运行时资源包
