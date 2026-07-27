# Lumi 六状态 Sprite 动画

## 问题

默认桌宠仍是程序化占位图，缺少已确认的原创角色形象、工具调用独立表现和可由
Manifest 驱动的正式动画资源。

## 方案

- 先确认 Lumi 主设定稿和六状态关键姿势，再分别生成 3×2 六帧源图。
- 使用纯洋红键控背景、边界采样软遮罩和去溢色生成透明源图。
- 通过 `tools/build_lumi_pet.py` 生成固定 `256×256` 帧的 PixiJS 图集。
- 空闲序列重复静止帧，让眨眼和甩尾保持偶发。
- 成功序列重复落地帧以覆盖 `2.4s` 瞬态状态；错误状态持续循环击钟。
- 使用确定性位图字形把 `yeah!` 和 `ERROR` 写入最终图集。
- Renderer 加载并校验 Manifest 1.1、图集 JSON 和纹理，再用私有 Ticker 驱动
  `AnimatedSprite`。
- `agent.tool_call` 映射到独立 `tooling`，与 `coding` 同优先级。

## 关键路径

- 视觉基准：`pets/lumi/reference`
- 可再构建源图：`pets/lumi/source`
- 发布资源：`pets/public/lumi`
- 资产构建：`tools/build_lumi_pet.py`
- 资源加载：`packages/renderer/src/pixi-pet-package-loader.ts`
- 动画渲染：`packages/renderer/src/pixi-pet-renderer.ts`

## 验证

- 六个图集均包含 6 个固定帧和非空动画序列。
- 图集尺寸均为 `768×512`，四角完全透明。
- Manifest、图集和纹理均被生产构建复制到 Electron Renderer 输出目录。
- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` 与 `pnpm build` 通过。
- 功能与视觉测试由用户依据人工清单执行。
