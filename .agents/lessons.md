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
