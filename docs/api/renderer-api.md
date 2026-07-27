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

当前 `@asteria/renderer` 包提供 `PixiPetRenderer`，结构上实现
`PetRendererPort`。Phase 1 占位动作映射为：

``` ts
const PLACEHOLDER_STATE_ACTIONS = {
  idle: "idle",
  thinking: "thinking",
  coding: "typing",
  happy: "celebrate",
  error: "error"
};
```

未识别的动作使用默认呼吸表现，不在 Renderer 内解释 Agent Event 或宠物状态。

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

`initialize()` 可重复调用并共享同一个异步初始化结果。初始化完成前调用
`destroy()` 时，初始化结束后立即释放资源，不恢复为可用状态。

`play()` 和 `stop()` 只能在初始化完成后调用；`destroy()` 幂等。

## 4. 支持实现

-   `PixiPetRenderer`：Phase 1 已实现
-   `ThreeRenderer`：未来
-   `Live2DRenderer`：未来

## 5. 性能目标

-   60 FPS
-   GPU 加速
-   避免 React 驱动动画

当前 PixiJS 实现使用：

-   透明 WebGL Canvas
-   应用私有 Ticker，最高 `60 FPS`
-   独立于 React 的逐帧更新
-   销毁时释放 Ticker、场景、纹理、Canvas 和 GPU Context
