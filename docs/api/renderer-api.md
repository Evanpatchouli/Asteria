# Renderer API

版本：v0.1

## 1. 目标

Renderer 层与 Pet Runtime 解耦。

Runtime 不关心具体实现：

-   PixiJS
-   Three.js
-   Live2D

## 2. Renderer Interface

``` ts
interface PetRenderer {
  initialize(): Promise<void>;
  play(animation: string): void;
  stop(animation: string): void;
  setExpression(expression: string): void;
  destroy(): void;
}
```

Pet Runtime 使用更窄的接口，避免依赖当前阶段不需要的表现能力：

``` ts
interface PetRendererPort {
  initialize(): Promise<void>;
  play(action: string): void;
  stop(action: string): void;
  destroy(): void;
}
```

表达式等扩展能力不进入 Phase 1 Runtime Port。

## 3. 生命周期

    create
     ↓
    initialize
     ↓
    load resource
     ↓
    render loop
     ↓
    destroy

## 4. 支持实现

-   PixiRenderer
-   ThreeRenderer
-   Live2DRenderer

## 5. 性能目标

-   60 FPS
-   GPU 加速
-   避免 React 驱动动画
