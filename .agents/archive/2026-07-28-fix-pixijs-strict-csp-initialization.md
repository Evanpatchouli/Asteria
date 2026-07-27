# 修复 PixiJS 严格 CSP 初始化失败

状态：实现完成，等待用户人工验收

## 问题

Electron 原生窗口已创建且处于可见区域，但透明窗口中没有角色内容。Renderer Console 显示 PixiJS 因页面禁止 `unsafe-eval` 而在 `Application.init()` 阶段失败。

## 根因

PixiJS 8 默认 Renderer 会检查动态求值能力。项目的严格 CSP 使用 `script-src 'self'`，能力检查失败后 PixiJS 中止初始化，Canvas 因此没有挂载。

## 完成内容

- 保持 `script-src 'self'`，未加入 `'unsafe-eval'`
- 在 `PixiPetRenderer` 模块中加载 `pixi.js/unsafe-eval`
- 使用 PixiJS 官方静态同步实现替代依赖动态求值的默认实现
- 将 CSP 适配封装在 Renderer 包内部
- 新增问题根因和解决方案记录
- 同步技术经验与阶段交接

## 静态工程检查

- `pnpm format:check`：通过
- `pnpm lint`：通过
- `pnpm typecheck`：通过
- `pnpm build`：通过
- `git diff --check`：通过
- UTF-8 BOM 检查：通过

## 测试说明

- 用户明确负责功能测试。
- Codex 未运行启动冒烟或功能测试。
- 交付时提供包含预期结果的人工测试清单。
