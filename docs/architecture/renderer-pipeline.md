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

Desktop Renderer 入口只负责组合和生命周期启动。它先加载并校验 Lumi
Manifest，再把 Manifest 状态动作映射交给 Pet Runtime；Runtime 通过 `play` 和
`stop` 独占动画控制权。

## 5. Renderer 实现

当前：

-   `packages/renderer`
-   `PixiPetRenderer`
-   透明 Canvas
-   Manifest 1.1 资源加载器
-   PixiJS `Spritesheet` 与 `AnimatedSprite`
-   Lumi 六状态动画图集
-   `PetRendererPort` 适配

未来支持：

-   ThreeRenderer
-   Live2DRenderer
