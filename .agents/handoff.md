# 阶段交接

## 当前状态

MVP Phase 1 周期 6 实现已完成，透明 Electron 窗口已接入独立的 PixiJS Renderer、占位 Sprite 和私有动画循环。已修复严格 CSP 导致 PixiJS 初始化失败的问题，功能测试由用户执行，当前等待人工验收反馈。

已完成：

- 独立的 `@asteria/renderer` workspace 包
- `pixi.js@8.19.0` 透明 WebGL Canvas
- `PixiPetRenderer` 异步初始化、动作控制和幂等销毁
- 与 Pet Runtime `PetRendererPort` 的类型适配
- 私有 Ticker 和最高 `60 FPS` 限制
- 程序化占位 Sprite 与五种占位动作
- React 与逐帧 Sprite 更新解耦
- 页面卸载时完整释放 PixiJS 和 GPU 资源
- 初始化失败统一清理，重试时不复用旧 Application
- Vite HMR 和页面卸载均销毁 Renderer
- Desktop 开发与冒烟命令会预构建 workspace 运行时依赖
- PixiJS 使用官方静态同步实现适配严格 CSP，无需允许 `'unsafe-eval'`
- 托盘提供“窗口居中”，可在主显示器工作区中心找回并显示窗口

## 下一周期建议

人工验收周期 6 后，进入 Pet Runtime 组合与事件闭环：

- 在 Desktop Renderer 中组合 `PetRuntime`、`PixiPetRenderer` 和调度器
- 使用统一动作映射启动 Runtime
- 将 Preload 提供的 Agent Event 送入 Event Bus
- 由 Event Bus 驱动 Pet Runtime 状态切换
- 完成“手动 Agent Event → 状态 → 占位动画”的 Phase 0 闭环

仍不应同时接入 Claude Code Hook。

## 已知事项

- 功能测试和启动冒烟未由 Codex 执行，需依据交付测试清单人工验收。
- 当前角色是程序化占位 Sprite，不代表正式视觉资源。
- 当前仅自动播放 `idle`；其余占位动作将在 Pet Runtime 接线后使用。
- WebGL 初始化失败时只记录 Renderer 控制台错误，尚未提供 Canvas 降级实现。
- PixiJS 完整入口使生产 Renderer 主 Chunk 约为 `1.26 MB`，后续引入正式资源前应评估按需扩展导入。
- 开发命令启动后修改 `packages/renderer` 源码，需要重新启动开发命令以刷新预构建产物。
- Windows 关机或注销不保证触发 `before-quit`，强制结束前最后约 `250ms` 的拖动位置可能来不及保存。
- 窗口允许按用户意图部分离屏，但恢复时横纵各至少保留 `64px` 可见区域。
- Wayland 无法保证全局窗口定位和鼠标穿透行为，当前按 Windows MVP 验收。
- CSS `app-region: drag` 区域不接收普通指针交互，未来宠物点击区域需要显式设置 `app-region: no-drag`。
- 系统托盘的设置入口尚未实现，将与设置中心一并处理。
