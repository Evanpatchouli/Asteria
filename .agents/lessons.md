# 技术经验

## Windows 工具链

上级目录的 `package.json` 可能通过 `packageManager` 影响 Corepack 对包管理器的选择。仓库根目录必须声明自己的 `packageManager`，验证时可使用 `corepack pnpm` 确保选择项目指定版本。

## ESLint Flat Config

`typescript-eslint` 的类型感知配置必须限制到 TypeScript 文件。若直接把 `recommendedTypeChecked` 应用于所有文件，ESLint 会尝试对自身 JavaScript 配置执行需要 TypeScript 类型信息的规则。

## TypeScript 项目拆分

测试文件需要进入类型检查项目，但不应进入发布产物。使用 `tsconfig.json` 覆盖源码和测试，再用独立 `tsconfig.build.json` 排除测试，比让 ESLint 使用默认项目更稳定。

## Workspace 可重复验证

workspace 包的 `types` 入口应指向源码，避免全新克隆在首次构建前无法执行类型检查。运行时测试若通过包导出读取 `dist`，测试脚本应先构建 workspace，不能依赖本地残留产物。

## 异步初始化生命周期

可销毁对象在异步初始化失败时，错误恢复逻辑必须先检查对象是否已销毁。否则初始化 Promise 的后续 `catch` 可能把已销毁实例错误恢复为可初始化状态。

## Electron 沙箱 Preload

Electron 的沙箱 Preload 不能使用 `.mjs` ESM 入口，只能使用受限的 CommonJS `require`。构建时应完整打包 Preload 依赖并输出单个 CommonJS 文件，不能通过关闭 `sandbox` 解决加载失败。

共享包的根 Barrel 可能把与 IPC 无关的运行时 Schema 一并打入 Preload。为启动敏感入口提供窄 Subpath Export，可以显著减少 Preload 体积并保持安全边界清晰。

Electron 43 的 npm 包会在首次执行 CLI 时按需下载二进制；首次启动冒烟可能明显慢于后续运行。

## 桌面窗口状态

保存的窗口坐标必须结合当前所有显示器 `workArea` 重新解析。仅校验坐标是数字无法处理外接屏移除、任务栏位置变化或分辨率调整。

恢复窗口时强制整窗可见会破坏用户主动贴边、部分离屏的布局意图。更合适的边界策略是保留原始坐标，只在可操作区域不足时修正到最低可见范围。

鼠标穿透不能只提供窗口内恢复控件；启用整窗口穿透后，必须存在系统托盘等窗口之外的关闭入口。

异步状态写入需要串行化并使用临时文件原子替换，否则快速拖动时可能发生旧坐标覆盖新坐标或留下截断 JSON。

进程内写入队列不能解决多个应用实例竞争同一状态文件。持久化原生窗口状态时，应同时使用 Electron 单实例锁约束写入者数量。

## PixiJS Renderer 生命周期

PixiJS 8 的 `Application` 必须异步初始化。Renderer 在初始化过程中被销毁时，初始化完成回调必须先检查销毁状态，并立即释放刚创建的 GPU 资源，不能让实例恢复为 ready。

异步初始化的清理边界不能只覆盖 `Application.init()` 本身。初始化成功后的纹理生成、场景挂载或 DOM 挂载仍可能失败，整个初始化事务都必须进入统一清理路径；重试时应创建新的 Application，不能复用已部分初始化的实例。

严格 CSP 禁止 `unsafe-eval` 时，PixiJS 8 默认 Renderer 会在初始化阶段主动失败。应加载 `pixi.js/unsafe-eval` 提供的静态同步实现，不能为了通过能力检查而放宽 Electron Renderer 的 `script-src`。

逐帧动画应由 PixiJS 私有 Ticker 驱动。React 只承担低频 UI，不能持有 Sprite 变换或每帧更新状态。

程序化 Graphics 可以在初始化阶段生成临时 Texture，再通过 Sprite 验证完整渲染链路；正式角色资源和 Resource Loader 不应因此提前进入基础 Renderer 周期。

workspace 包的运行时导出指向 `dist` 时，应用的开发和冒烟命令必须预构建依赖；仅保证根构建拓扑正确不足以支持干净检出后的首次开发启动。
