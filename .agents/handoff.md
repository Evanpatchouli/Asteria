# 阶段交接

## 当前状态

MVP Phase 1 周期 2 已完成，共享协议和 Event Bus 可以作为 Pet Runtime 的稳定依赖。

## 下一周期建议

实现 `packages/pet-runtime` 的最小状态机：

- Agent Event 到 Pet State 的映射
- 状态优先级和有效转换
- `agent.success` 到 `happy` 的映射
- 一次性状态回落策略
- Renderer Port，不依赖 PixiJS
- Vitest 单元测试

下一周期不应同时实现 Electron 或 PixiJS。

## 已知事项

- 裸 `pnpm` 由 `C:\Users\31250\.vite-plus\bin\pnpm.exe` 提供；仓库已通过 `packageManager` 固定 pnpm 10.33.4。
- 原有 Markdown 未统一经过 Prettier，已从自动格式检查中排除，避免无关重写。
- `pnpm test` 会先构建 workspace，确保测试不依赖残留 `dist`。
