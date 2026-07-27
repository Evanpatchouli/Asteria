# 架构决策记录

## 2026-07-27：MVP Phase 1 共享契约

- 内部 Agent 事件统一使用 `agent.*` 命名空间。
- `AgentEvent.protocolVersion` 使用语义化字符串，当前值为 `1.0`。
- `agent.success` 是输入事件，宠物内部成功表现状态使用 `happy`。
- IPC Channel 使用 `module:action` 命名，本阶段定义为 `agent:event`。
- 插件和外部适配器只能产生 Agent Event，不直接访问 Pet Runtime。
- Phase 1 只支持 `pixijs` 宠物资源，其他渲染引擎待后续 ADR 扩展。

## 2026-07-27：Pet Runtime 状态语义

- 状态优先级为 `error > happy > coding > thinking > waiting > idle/sleep`。
- 低优先级事件不能打断高优先级状态。
- `agent.idle` 是显式复位事件，可强制回到 `idle`。
- `happy` 和 `error` 是瞬时状态，通过环境注入的调度器回落到 `idle`。
- Runtime 只消费动作名称和最小 Renderer Port，不依赖具体渲染引擎或资源路径。

## 2026-07-27：Electron 基础工程

- Electron 应用使用 `apps/desktop/src/{main,preload,renderer}` 三入口。
- 使用 electron-vite 统一 Main、Preload 和 Renderer 的开发与构建流程。
- electron-vite 5 的 Peer 范围止于 Vite 7，因此 Desktop 包固定使用 Vite 7，不依赖根测试工具传递安装的 Vite。
- Renderer 保持 `contextIsolation: true`、`nodeIntegration: false` 和 `sandbox: true`。
- 沙箱 Preload 完整打包为单个 CommonJS 产物，不通过禁用沙箱规避 ESM 限制。
- `@asteria/shared/ipc` 作为 Preload 的窄共享契约入口，避免把事件校验 Schema 打入 Preload 启动包。
- 外部 Agent Event 由 Main Process 使用 `forwardAgentEvent` 完成运行时校验后再发送，Preload 只接收已验证事件。
- 生产 Renderer CSP 不开放 WebSocket；开发 CSP 仅允许 localhost 和 127.0.0.1 的 Vite HMR WebSocket。

## 2026-07-28：桌面窗口交互

- 首次启动位置为主显示器工作区右下角，右侧和底部各保留 `24px`。
- 合法保存位置优先恢复；位置完全离开当前显示器时回退主屏右下角。
- 用户主动放置的部分离屏位置不做整窗夹紧；横纵各至少 `64px` 可见时精确恢复，不足时只移动到最低可见范围。
- 窗口位置、鼠标穿透、显示和隐藏由 Main Process 的 Window Controller 管理。
- Renderer 只通过 CSS `app-region: drag` 声明拖动区域，不自行计算原生窗口坐标。
- 系统托盘是隐藏窗口和鼠标穿透状态的永久恢复入口。
- 窗口状态使用 Main 私有版本化 JSON 文件，不进入共享 IPC 契约或 Renderer `localStorage`。
- 应用使用 Electron 单实例锁，避免重复窗口、托盘和跨进程状态文件写入竞争；第二实例只唤醒现有窗口。

## 2026-07-28：PixiJS Renderer MVP

- PixiJS 实现位于独立的 `packages/renderer`，Desktop Renderer 只负责组合启动。
- `PixiPetRenderer` 实现 Pet Runtime 已定义的窄 `PetRendererPort`，不接收 Agent Event 或宠物状态。
- PixiJS Application 使用透明 WebGL Canvas、私有 Ticker 和最高 `60 FPS` 限制。
- React 不持有 Sprite 或逐帧动画状态。
- 本周期使用程序化纹理生成占位 Sprite，正式资源加载器留到后续周期。
- Renderer 销毁必须同时释放 Ticker、场景、纹理、Canvas 和 GPU Context。
- 初始化失败时释放当前 Application；后续重试创建新实例，不复用可能被污染的 PixiJS Application。
- Desktop 开发和冒烟命令在启动前按 workspace 拓扑构建运行时依赖。
