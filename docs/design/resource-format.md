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
相对于该 JSON 解析。Lumi 使用固定 `256×256` 未裁切帧，并为每帧提供
TexturePacker 兼容的 `anchor`：

```json
{
  "anchor": {
    "x": 0.47,
    "y": 0.68
  }
}
```

锚点表示角色或整个动作构图的底部支撑根部。构建器使用高透明度阈值提取最大
主体连通区域，并从主体中央支撑带计算根部；问号、毛线团、尾巴、火星和钟等
装饰不得参与定位。Renderer 将不同帧的锚点放在同一舞台坐标，从而避免源图
网格位置差异造成全局跳动。跳跃动作可通过大于 `1` 的归一化 `anchor.y`
表达画布外的舞台根部偏移。

Manifest 的 `frameRate` 是关键姿势时钟，不是显示器刷新率。Renderer 使用
私有 `60Hz` Ticker 在相邻关键姿势间插值。

-   `idle`：`20 FPS` 时间槽，固定趴姿 `2.15s`，随后以 `±28°` 快速
    往返摇尾三次，共 `0.35s`
-   `thinking`、`tooling`、`error`：`10 FPS` 关键姿势
-   `typing`：`12 FPS` 关键姿势
-   `celebrate`：`10 FPS`、24 个时间槽，共 `2.4s`
    -   原地助跑 `0.8s`
    -   起跳与回旋 `0.8s`
    -   无字落地 `0.4s`
    -   `yeah!` `0.4s`

`celebrate` 在原始关键姿势间加入跑步接触、跑步腾空、压缩蹬地、三个回旋
朝向和触地冲击七张真实姿势，并分别保存无字落地帧和带字落地帧。`yeah!` 与
`ERROR` 由 `tools/build_lumi_pet.py` 以仓库内位图字形确定性写入最终图集，
不依赖生成模型拼写。

## 5. 资源加载流程

ResourceLoader

↓

Parse Manifest

↓

Load Asset

↓

Register Renderer

加载失败视为初始化失败：不会退回占位角色，也不会悄悄忽略损坏动作。

`tools/validate_lumi_pet.py` 对生成包执行确定性检查，包括序列引用、独立计算
的主体语义锚点、空闲身体像素稳定性、透明安全边距、裁切、不同关键姿势数量，
以及成功动画总时长和阶段分配。
