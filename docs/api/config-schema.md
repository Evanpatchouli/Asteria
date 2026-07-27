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
