# 默认桌宠 Lumi 六状态动画

状态：实现完成，等待用户人工验收

## 已完成

- 确认原创 Lumi 主设定和六状态关键姿势。
- 生成空闲、思考、编码、工具调用、成功和错误六套透明动画源图。
- 新增 `tooling` Runtime 状态与 `agent.tool_call` 映射。
- Manifest 协议升级到 `1.1`，要求完整 `tooling` 动作。
- `happy` 与 `error` 使用独立可配置瞬态时长，桌面端均配置为 `2.4s`。
- 新增可重复执行的 Lumi 图集构建脚本。
- 新增 Manifest 与 PixiJS Sprite Sheet 资源加载器。
- 用 PixiJS `AnimatedSprite` 替换程序化占位 Sprite。
- 将角色帧默认视口占比调整为 `36%`，使 Lumi 接近常见桌宠显示尺寸。
- Electron Renderer 发布构建自动包含 `pets/public/lumi`。
- 同步 API、架构、资源格式、任务、决策、经验和交接文档。

## 静态验证

- Lumi 资源结构与透明边界校验通过。
- `pnpm typecheck` 通过。
- `pnpm lint` 通过。
- `pnpm format:check` 通过。
- `pnpm build` 通过。
- `git diff --check` 通过。

未运行应用、冒烟测试或功能测试；按用户要求由用户执行人工验收。
