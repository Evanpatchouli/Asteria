# MVP Phase 1：周期 4

状态：已完成

完成内容：

- 建立 `apps/desktop` Electron Main、Preload、Renderer 三入口
- 使用 electron-vite 管理开发、构建和生产预览
- 实现透明、无边框、始终置顶的桌面窗口
- 实现标准 Electron 生命周期和外部导航拦截
- 启用 `contextIsolation`、Renderer sandbox，并禁用 Node Integration
- 实现复用共享 IPC 契约的类型化 Preload 订阅 API
- 实现 Main Process Agent Event 校验后转发的唯一 IPC 入口
- 为 IPC 契约增加 `@asteria/shared/ipc` 窄 Subpath Export
- 实现 React + TypeScript 透明占位 Renderer
- 区分开发与生产 Renderer CSP，生产环境不开放 WebSocket
- 添加窗口安全选项和 Preload 契约测试
- 添加自动退出式 Electron 启动冒烟验证
- 同步 Electron 进程模型、工程结构和本地开发文档

不包含：

- PixiJS
- Pet Runtime 接线
- Claude Code Hook
- 点击穿透、窗口拖动、位置保存
- 系统托盘
- 安装包与自动更新

验收结果：

- `pnpm format:check`：通过
- `pnpm lint`：通过
- `pnpm typecheck`：通过
- `pnpm test`：通过，40 项测试
- `pnpm build`：通过
- `pnpm smoke:desktop`：通过
- Electron 冒烟确认 Renderer 加载、窗口置顶和 Preload API 注入
