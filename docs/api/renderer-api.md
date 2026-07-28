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

当前 `@asteria/renderer` 包提供：

-   `loadPixiPetPackage(manifestUrl)`：加载并校验 Manifest 1.1、图集 JSON 与纹理
-   `PixiPetRenderer`：消费已加载资源并实现 `PetRendererPort`

状态动作映射来自已校验 Manifest，并由 Desktop 组合根交给 Pet Runtime。
Renderer 不解释 Agent Event 或宠物状态；未在资源包注册的动作会明确失败。

`PixiPetRenderer` 使用内部双 Sprite 平滑动画器。资源中的帧率表示关键姿势时钟，
私有 Ticker 在最高 `60Hz` 下持续计算相邻姿势的过渡，因此不会把 React 或
Manifest 帧率等同于显示刷新率。过渡期间至少保留一个完全不透明的姿势，避免
普通线性淡化让浅色角色变灰。

## 3. 生命周期

    create
     ↓
    initialize
     ↓
    load and validate package
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
-   双 Sprite 关键姿势插值，由私有 Ticker 显式推进
-   每张纹理的 `defaultAnchor` 对齐角色语义根部
-   角色帧默认占视口短边 `36%`，保留桌宠所需的小尺寸和透明活动空间
-   独立于 React 的逐帧更新
-   销毁时释放 Ticker、场景、图集纹理、Canvas 和 GPU Context
