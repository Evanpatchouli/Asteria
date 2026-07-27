# Config Schema

版本：v0.1

## 1. 目标

定义应用配置结构。

## 2. 配置示例

``` json
{
  "pet": "neko",
  "startup": true,
  "sound": true,
  "position": {
    "x": 100,
    "y": 200
  }
}
```

## 3. 配置分类

包含：

-   应用配置
-   宠物配置
-   Renderer 配置
-   插件配置

## 4. 版本迁移

配置需要支持：

-   version 字段
-   migration
-   默认值补全

## 5. 窗口状态

窗口原生状态保存在 Main Process 私有文件中，不通过 Renderer `localStorage` 管理：

``` json
{
  "version": 1,
  "position": {
    "x": 100,
    "y": 200
  },
  "clickThrough": false
}
```

文件位置：

    userData/asteria-data/window-state.json

文件缺失、损坏或版本不支持时回退到默认状态，不阻止应用启动。
