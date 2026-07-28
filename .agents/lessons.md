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

生成式 Sprite Sheet 应先固定角色主设定和状态关键姿势，再逐状态生成小帧表；直接一次生成完整动画更容易发生身份、比例和道具漂移。

纯色键控背景仍可能包含轻微色差或渐变。使用边界采样、软遮罩和去溢色后，再将整张规则网格缩放为固定帧，可保留一致锚点并减少小尺寸边缘杂色。

动画中的关键文字不应依赖图片模型拼写。构建阶段用确定性位图字形写入最终图集，既能保证内容准确，也不需要把角色专属文字规则耦合进通用 Renderer。

固定帧画布尺寸不等于固定角色位置。生成式 Sprite Sheet 中，同一角色在不同网格
单元的内容坐标可能明显漂移；需要使用身体根部等语义锚点，而不是透明包围盒中心
对齐，因为问号、尾巴、烟尘和大型道具都会污染包围盒。

60Hz Ticker 只保证更新频率，不会为低帧率位图自动产生动作。对于小尺寸桌宠，
使用少量稳定关键姿势、语义锚点和 Renderer 插值，比批量生成 60 张不一致的 AI
位图更稳定，也能控制包体与显存。

语义锚点不能使用整帧最低非透明像素。少量透明残留、问号或毛线团都可能把主体
脚底误判二十多个像素；应先提取高透明度最大连通主体，再在主体中央支撑区域定位。
校验器还必须独立实现同一不变量，否则生产算法和验证算法会一起通过错误结果。

只有局部部件运动时，整张角色帧之间的淡化会让本应静止的身体闪动。将活动部件
拆层并围绕稳定枢轴变换，可以同时得到更大动作幅度和完全稳定的主体。

垂直轴回旋、四肢遮挡交换和触地压缩属于拓扑变化，无法由透明叠加或简单仿射
变换真实补齐。应补充少量高价值真实姿势，再用 60Hz Renderer 处理相邻采样。

## 开发诊断

多 Renderer Process 之间不能共享进程内 Event Bus 或 Runtime。调试窗口必须通过 Main 中转事件和只读遥测，不能创建第二套 Runtime 或复制状态规则。

Runtime 的瞬时状态回落发生在内部调度器中，调试层不应轮询或复制时间规则；由 Runtime 主动发布只读快照更可靠。

electron-vite 5 的实验性 `isolatedEntries` 在非 TTY 构建环境中可能调用不存在的 `process.stdout.clearLine`。单个 Preload Bundle 配合窗口启动参数进行能力隔离，可以同时保持沙箱单文件要求和 CI 构建稳定性。

Renderer 只需要事件常量时不应从包含 Zod Schema 的共享根 Barrel 导入。为纯常量提供窄 Subpath，可避免把边界校验依赖打入高频桌宠 Renderer。

TypeScript 的 `import type` 虽然会在编译后擦除，但应用层仍应从纯契约 Subpath 导入类型。将事件与调试数据的常量/接口放在无运行时校验依赖的模块中，再由 Main 使用 Schema 模块完成边界校验，可同时保持依赖方向清晰和 Renderer Tree Shaking 稳定。
