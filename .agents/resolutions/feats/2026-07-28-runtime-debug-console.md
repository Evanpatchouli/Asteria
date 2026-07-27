# Runtime 事件闭环与开发调试面板

## 背景

PixiJS 占位桌宠已经可以启动，但尚未把 Agent Event、Event Bus、Pet Runtime 与 Renderer 连接成可观察、可人工验证的真实闭环。

## 方案

- Desktop Renderer 作为唯一组合根，持有 Event Bus、Pet Runtime 和 PixiJS Renderer。
- Pet Runtime 提供只读快照和订阅接口，状态仍只能通过标准 Agent Event 驱动。
- Main Process 在开发环境注册独立 Debug IPC 和最多 `200` 条的内存遥测 Hub。
- 系统托盘仅在开发环境提供“调试面板”，模拟事件经 Main 构造、校验后复用正式 `agent:event` 通道。
- Desktop 与 Debug Window 共用沙箱 Preload Bundle，通过窗口启动参数隔离能力。
- 调试面板提供中英文切换、Runtime 数据、六种标准事件按钮和结构化日志。
- 调试面板使用无边框自定义标题栏，固定的最小化与关闭命令由 Main 校验当前窗口主 Frame 后执行。
- Renderer 崩溃会断开调试连接状态；调试页面加载失败时销毁失败实例，允许托盘重新创建。
- 生产构建不包含 Debug Renderer HTML，也不注册 Debug IPC；Desktop 的遥测 API 在生产环境为空操作。
- 共享契约拆为纯常量/类型 Subpath 和 Zod 边界校验模块，防止校验实现进入常驻 Renderer。

## 验证

- `pnpm typecheck`
- `pnpm build`
- `pnpm lint`
- `pnpm format:check`
- 生产 Renderer Bundle 中未发现 Zod 或 Debug Schema 符号
- 功能与视觉测试按约定由用户执行

## 边界

- 日志仅驻留 Main Process 内存，应用退出后清空。
- 本周期不包含日志筛选、导出、FPS、Memory、GPU、DevTools 或 Claude Code Hook。
- 当前角色仍是程序化占位 Sprite。
