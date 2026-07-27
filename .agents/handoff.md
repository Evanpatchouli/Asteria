# 阶段交接

## 当前状态

MVP Phase 1 周期 4 已完成，`apps/desktop` 已具备 Electron Main、Preload、Renderer 三入口和稳定的开发、构建、测试及启动冒烟流程。

已完成：

- 透明、无边框、始终置顶的 360 × 360 桌面窗口
- 标准 Electron 应用生命周期
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- 复用共享 IPC 契约的类型化 Preload API
- React + TypeScript 透明占位 Renderer
- electron-vite 开发与生产构建
- 窗口配置与 Preload 契约测试
- 自动退出式 Electron 启动冒烟

## 下一周期建议

实现窗口基础交互：

- 可拖动区域
- 窗口位置保存与屏幕边界恢复
- 可配置的点击穿透
- 显示、隐藏与退出入口

建议窗口交互稳定后再进入 PixiJS Renderer 周期，不应同时接入 Claude Code Hook。

## 已知事项

- 裸 `pnpm` 由 `C:\Users\31250\.vite-plus\bin\pnpm.exe` 提供；仓库已通过 `packageManager` 固定 pnpm 10.33.4。
- 原有 Markdown 未统一经过 Prettier，已从自动格式检查中排除，避免无关重写。
- `pnpm test` 会先构建 workspace，确保测试不依赖残留 `dist`。
- Electron 43 在首次执行 CLI 时按需下载二进制，首次 `pnpm dev` 或 `pnpm smoke:desktop` 会明显更慢。
- 沙箱 Preload 使用单文件 CommonJS 产物；不要改回 `.mjs` 或通过关闭 sandbox 规避限制。
- 当前 Renderer 仅为基础占位 UI，未集成 PixiJS、Pet Runtime 或 Agent Event 生产者。
