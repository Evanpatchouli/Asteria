# PixiJS Renderer MVP

## 目标

在 Electron Renderer 中建立独立于 React 的 PixiJS 8 渲染基础设施，并与 Pet Runtime 的最小 Renderer Port 保持兼容。

## 模块边界

```text
Desktop Renderer composition
        ↓
PetRendererPort
        ↓
@asteria/renderer
        ↓
PixiJS Application + private Ticker
```

- `packages/renderer` 管理 Canvas、场景、Sprite、Ticker 和 GPU 资源。
- React 只保留 UI 层，不持有 Sprite 或逐帧状态。
- Renderer 不接收 Agent Event，也不解释 Pet State。

## 实现要点

- 使用 `pixi.js@8.19.0`。
- `Application.init()` 异步初始化透明 WebGL Canvas。
- 使用应用私有 Ticker，并限制最高 `60 FPS`。
- 使用 Graphics 在初始化阶段生成临时纹理，再创建占位 Sprite。
- `PixiPetRenderer` 实现 `initialize`、`play`、`stop` 和 `destroy`。
- 初始化期间销毁时，初始化完成后立即释放资源，不恢复 ready 状态。
- 初始化任一步骤失败时统一清理，并在重试时创建新的 Application。
- 销毁时释放 Ticker、场景、纹理、Canvas 和 GPU Context。
- `pagehide` 和 Vite HMR dispose 均触发幂等清理。
- Desktop `predev`、`presmoke` 在干净检出后预构建 workspace 运行时依赖。

## 当前限制

- 只启动默认 `idle` 占位动作。
- 未接入 Pet Runtime、Event Bus 或 Agent Event。
- 未实现正式资源加载器、Sprite Sheet、FPS 面板或降级 Renderer。

## 验证

功能测试由用户负责。Codex 仅执行格式、Lint、类型、构建、差异和 BOM 静态检查，并交付包含预期结果的人工测试清单。
