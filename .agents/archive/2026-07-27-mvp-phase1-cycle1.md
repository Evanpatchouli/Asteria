# MVP Phase 1：周期 1

状态：已完成

完成内容：

- 初始化 pnpm workspace 和严格 TypeScript 工具链
- 建立共享 Agent Event、IPC 与 Pet Manifest 契约
- 为共享契约添加单元测试
- 统一事件协议、插件边界和项目结构文档
- 新增 ADR-004，明确 MVP Runtime 边界

不包含：

- Electron 应用
- PixiJS Renderer
- Pet Runtime
- Claude Code Hook 接入

验收结果：

- `pnpm format:check`：通过
- `pnpm lint`：通过
- `pnpm typecheck`：通过
- `pnpm test`：通过，6 项测试
- `pnpm build`：通过
