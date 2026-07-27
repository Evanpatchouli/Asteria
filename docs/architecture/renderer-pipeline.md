# Renderer Pipeline

版本：v0.1

## 1. 目标

设计高性能宠物渲染流程。

## 2. Pipeline

    Agent Event

    ↓

    Pet Runtime

    ↓

    Animation State

    ↓

    Renderer Adapter

    ↓

    GPU Render

## 3. Render Loop

PixiJS 实现使用应用私有 Ticker。Ticker 基于
`requestAnimationFrame()` 驱动，并限制最高 `60 FPS`：

``` ts
app.ticker.maxFPS = 60;
app.ticker.add(update);
```

流程：

    Update

    ↓

    Calculate

    ↓

    Render

## 4. React 职责

React 负责：

-   设置界面
-   配置管理
-   调试面板

React 不负责：

-   动画状态
-   每帧更新
-   Sprite 控制

Desktop Renderer 入口只负责组合和生命周期启动。当前周期在 Pet Runtime
接线前启动默认 `idle` 占位动作；后续由 Pet Runtime 接管 `play` 和 `stop`。

## 5. Renderer 实现

当前：

-   `packages/renderer`
-   `PixiPetRenderer`
-   透明 Canvas
-   程序化占位 Sprite
-   `PetRendererPort` 适配

未来支持：

-   ThreeRenderer
-   Live2DRenderer
