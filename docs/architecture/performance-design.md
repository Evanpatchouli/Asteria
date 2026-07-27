# Performance Design

版本：v0.1

## 1. 性能目标

目标：

  指标       目标
  ---------- ---------
  FPS        60
  CPU        低占用
  Memory     \<300MB
  启动时间   \<3秒

## 2. 优化原则

### 动画独立

动画循环：

    requestAnimationFrame

    ↓

    Renderer

    ↓

    GPU

### 避免 React 重渲染

错误：

    State Update

    ↓

    React Render

    ↓

    Animation

正确：

    Runtime State

    ↓

    Renderer Runtime

    ↓

    Animation

## 3. 资源优化

包括：

-   纹理压缩
-   延迟加载
-   动画缓存

## 4. 性能监控

记录：

-   FPS
-   CPU
-   Memory
-   Event 延迟
