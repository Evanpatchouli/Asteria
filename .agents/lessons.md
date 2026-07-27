# 技术经验

## Windows 工具链

上级目录的 `package.json` 可能通过 `packageManager` 影响 Corepack 对包管理器的选择。仓库根目录必须声明自己的 `packageManager`，验证时可使用 `corepack pnpm` 确保选择项目指定版本。

## ESLint Flat Config

`typescript-eslint` 的类型感知配置必须限制到 TypeScript 文件。若直接把 `recommendedTypeChecked` 应用于所有文件，ESLint 会尝试对自身 JavaScript 配置执行需要 TypeScript 类型信息的规则。

## TypeScript 项目拆分

测试文件需要进入类型检查项目，但不应进入发布产物。使用 `tsconfig.json` 覆盖源码和测试，再用独立 `tsconfig.build.json` 排除测试，比让 ESLint 使用默认项目更稳定。
