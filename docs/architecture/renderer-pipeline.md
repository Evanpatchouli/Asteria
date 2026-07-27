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

使用：

``` ts
requestAnimationFrame()
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

## 5. Renderer 实现

支持：

-   PixiRenderer
-   ThreeRenderer
-   Live2DRenderer
