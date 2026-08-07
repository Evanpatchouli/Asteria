# 阶段交接

## 当前状态

MVP Phase 0 技术闭环与 Lumi 正式 Sprite 动画已实现：开发调试面板发送的模拟 Agent Event 会通过 Main 校验、正式 IPC、Event Bus 和 Pet Runtime 驱动六状态 PixiJS 动画。Lumi 动画已于 2026-08-07 通过用户人工验收，Phase 0 可以结束并进入 Phase 1。

已完成：

- 独立的 `@asteria/renderer` workspace 包
- `pixi.js@8.19.0` 透明 WebGL Canvas
- `PixiPetRenderer` 异步初始化、动作控制和幂等销毁
- 与 Pet Runtime `PetRendererPort` 的类型适配
- 私有 Ticker 和最高 `60 FPS` 限制
- Lumi 原创角色主设定与六状态关键姿势
- 六套透明 Sprite Sheet：空闲、思考、编码、工具调用、成功、错误
- Manifest 1.1 Resource Loader 与 PixiJS `AnimatedSprite`
- 确定性写入 `yeah!` 和 `ERROR`
- Lumi 角色帧默认占窗口短边 `36%`，窗口透明活动区域保持不变
- Lumi 每帧使用语义根部锚点，空闲和思考不再发生跨行全局跳动
- Renderer 在私有 `60Hz` Ticker 中平滑过渡相邻关键姿势
- 成功动画按 `0.8 / 0.8 / 0.4 / 0.4s` 分配跑动、回旋跳、落地与 `yeah!`
- 空闲身体像素保持恒定，尾巴以 `±28°` 快速往返三次
- 思考锚点按最大主体连通区域计算，投影后根部漂移小于 `1px`
- 成功动画扩展为 `10 FPS`、24 个时间槽，并加入七张真实运动过渡姿势
- React 与逐帧 Sprite 更新解耦
- 页面卸载时完整释放 PixiJS 和 GPU 资源
- 初始化失败统一清理，重试时不复用旧 Application
- Vite HMR 和页面卸载均销毁 Renderer
- Desktop 开发与冒烟命令会预构建 workspace 运行时依赖
- PixiJS 使用官方静态同步实现适配严格 CSP，无需允许 `'unsafe-eval'`
- 托盘提供“窗口居中”，可在主显示器工作区中心找回并显示窗口
- Desktop Renderer 组合 Event Bus、Pet Runtime 和 PixiJS
- Pet Runtime 提供生命周期与状态的只读快照订阅
- `pnpm dev` 托盘提供独立调试面板，生产环境不注册调试能力
- 六种标准 Agent Event 测试按钮走真实事件链路
- Main Telemetry Hub 保留最多 `200` 条结构化内存日志
- 调试面板展示 Runtime、Pet State、Action、最后事件和处理数量
- 调试面板支持中文 / EN，并记住用户选择
- 调试面板使用无边框自定义标题栏，提供安全隔离的最小化和关闭控件
- Renderer 崩溃会把调试连接状态置为断开，调试页面加载失败后可通过托盘重试

## 下一周期建议

进入 Phase 1 的 Claude Code Adapter 接入：

- 定义 Claude Code Hook 输入边界
- 在 Main Process 实现内置 Claude Adapter
- 转换并校验为标准 Agent Event
- 复用当前已验证的 Event Bus、Pet Runtime 和 Renderer 闭环

仍不应同时实现动态插件加载器。

## 已知事项

- Lumi 动画已通过用户人工验收；启动冒烟仍未由 Codex 执行。
- Lumi 循环动作仍属于 MVP Sprite 动画，不是逐帧手绘长动画。
- 成功动画已补充真实朝向和触地姿势；相邻姿势仍可能出现轻微双 Sprite 重影，
  后续应继续补充高价值关键姿势，而不是复制相同帧。
- 工具调用与编码同优先级，可以根据最新事件相互切换。
- `happy` 和 `error` 在 `2.4s` 后回落到空闲，修改资源节奏时需同步 Runtime 时长。
- WebGL 初始化失败时只记录 Renderer 控制台错误，尚未提供 Canvas 降级实现。
- PixiJS 完整入口使生产 Renderer 主 Chunk 约为 `1.35 MB`，后续引入正式资源前应评估按需扩展导入。
- 开发命令启动后修改 `packages/renderer` 源码，需要重新启动开发命令以刷新预构建产物。
- Windows 关机或注销不保证触发 `before-quit`，强制结束前最后约 `250ms` 的拖动位置可能来不及保存。
- 窗口允许按用户意图部分离屏，但恢复时横纵各至少保留 `64px` 可见区域。
- Wayland 无法保证全局窗口定位和鼠标穿透行为，当前按 Windows MVP 验收。
- CSS `app-region: drag` 区域不接收普通指针交互，未来宠物点击区域需要显式设置 `app-region: no-drag`。
- 系统托盘的设置入口尚未实现，将与设置中心一并处理。
- 调试日志只保存在内存中，应用退出后清空，不提供筛选、导出、FPS、Memory 或 GPU 指标。
