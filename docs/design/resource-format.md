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
    └── neko/
        ├── pet.json
        ├── animations/
        ├── textures/
        ├── sounds/
        └── models/

## 3. pet.json

``` json
{
  "name": "neko",
  "renderer": "pixijs",
  "version": "1.0.0"
}
```

## 4. 动画资源

支持：

-   Sprite
-   Spine
-   Live2D
-   VRM

## 5. 资源加载流程

ResourceLoader

↓

Parse Manifest

↓

Load Asset

↓

Register Renderer
