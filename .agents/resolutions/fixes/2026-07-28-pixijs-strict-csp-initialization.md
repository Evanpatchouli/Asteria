# PixiJS 严格 CSP 初始化失败

## 问题

Electron 原生窗口已成功创建并位于屏幕可见区域，但透明窗口没有显示占位角色。Renderer DOM 中的 `#pet-surface` 为空，PixiJS Canvas 未挂载。

## 根因

应用 CSP 使用 `script-src 'self'`，禁止动态求值。PixiJS 8 默认 Renderer 会在初始化时检查 `unsafe-eval` 能力，检查失败后中止 `Application.init()`。

透明窗口本身没有背景或失败占位内容，因此渲染初始化失败在视觉上表现为“窗口没有出现”。

## 解决方案

- 保持现有严格 CSP，不加入 `'unsafe-eval'`。
- 在 `PixiPetRenderer` 模块中加载 `pixi.js/unsafe-eval`。
- 该 PixiJS 官方模块会安装不依赖动态求值的静态同步实现，并跳过默认能力检查。
- 将兼容模块封装在 Renderer 包内部，避免 Desktop 组合入口承担 PixiJS 实现细节。

## 验证

功能测试由用户负责。Codex 仅执行格式、Lint、类型、构建、差异和 BOM 静态检查，并交付包含预期结果的人工测试清单。
