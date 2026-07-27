# 阶段交接

## 当前状态

MVP Phase 1 周期 3 已完成，共享协议、Event Bus 和 Pet Runtime 已具备稳定的独立构建与测试能力。

## 下一周期建议

实现 `apps/desktop` 的 Electron 基础工程：

- Main、Preload、Renderer 三入口
- 透明、无边框、置顶窗口
- `contextIsolation: true`
- `nodeIntegration: false`
- 类型化的最小 Preload API
- Vite 开发与构建流程
- Electron 启动冒烟验证

下一周期不应同时集成 PixiJS 或 Claude Code Hook。

## 已知事项

- 裸 `pnpm` 由 `C:\Users\31250\.vite-plus\bin\pnpm.exe` 提供；仓库已通过 `packageManager` 固定 pnpm 10.33.4。
- 原有 Markdown 未统一经过 Prettier，已从自动格式检查中排除，避免无关重写。
- `pnpm test` 会先构建 workspace，确保测试不依赖残留 `dist`。
