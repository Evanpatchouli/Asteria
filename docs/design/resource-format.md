# Pet Resource Format

版本：v0.1

## 1. 设计目标

角色资源独立于 Runtime。

支持：

-   替换角色
-   下载角色包
-   多渲染引擎

## 2. 目录结构

    pets/
    └── lumi/
        ├── pet.json
        ├── animations/
        │   ├── idle.json
        │   ├── idle.png
        │   └── ...
        └── ...

仓库中 `pets/lumi/reference` 与 `pets/lumi/source` 保存视觉基准和构建源文件；
`pets/public/lumi` 是 Electron Renderer 实际发布的只读运行时资源包。

## 3. pet.json

Manifest 协议当前版本为 `1.1`。`idle`、`thinking`、`coding`、`tooling`、
`happy` 与 `error` 均为必需状态；`waiting` 与 `sleep` 为可选状态。

```json
{
  "id": "lumi",
  "name": "Lumi",
  "version": "1.0.0",
  "protocolVersion": "1.1",
  "renderer": "pixijs",
  "states": {
    "idle": "idle",
    "thinking": "thinking",
    "coding": "coding",
    "tooling": "tooling",
    "happy": "celebrate",
    "error": "error"
  },
  "animations": {
    "idle": {
      "source": "animations/idle.json",
      "loop": true,
      "frameRate": 8
    },
    "thinking": {
      "source": "animations/thinking.json",
      "loop": true,
      "frameRate": 8
    },
    "coding": {
      "source": "animations/coding.json",
      "loop": true,
      "frameRate": 12
    },
    "tooling": {
      "source": "animations/tooling.json",
      "loop": true,
      "frameRate": 10
    },
    "celebrate": {
      "source": "animations/celebrate.json",
      "loop": false,
      "frameRate": 12
    },
    "error": {
      "source": "animations/error.json",
      "loop": true,
      "frameRate": 8
    }
  }
}
```

`states` 中引用的每个动作名称都必须存在于 `animations`。协议 `1.0` 不包含
`tooling`，因此不能作为 `1.1` Manifest 加载；本阶段不提供隐式迁移或兼容垫片。

## 4. 动画资源

支持：

-   Sprite
-   Spine
-   Live2D
-   VRM

Phase 1 仅实现 PixiJS Sprite 动画；其他格式保留为后续扩展方向。

每个 `source` 指向标准 PixiJS Spritesheet JSON。JSON 的 `animations` 必须包含
与 Manifest 动作名同名且非空的帧序列；纹理图片路径由图集 `meta.image`
相对于该 JSON 解析。Lumi 使用固定 `256×256` 未裁切帧，避免动作切换时锚点
漂移。

`idle` 图集通过重复静止帧让眨眼和甩尾保持偶发；`celebrate` 重复落地帧以覆盖
Runtime 的 `2.4s` 成功状态；`error` 在错误状态持续循环。`yeah!` 与 `ERROR`
由 `tools/build_lumi_pet.py` 以仓库内位图字形确定性写入最终图集，不依赖生成
模型拼写。

## 5. 资源加载流程

ResourceLoader

↓

Parse Manifest

↓

Load Asset

↓

Register Renderer

加载失败视为初始化失败：不会退回占位角色，也不会悄悄忽略损坏动作。
