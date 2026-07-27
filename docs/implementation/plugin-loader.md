# Plugin Loader

版本：v0.1

## 1. 目标

动态加载插件。

## 2. 加载流程

    Scan Plugin Directory

    ↓

    Read Manifest

    ↓

    Validate Permission

    ↓

    Load Plugin

    ↓

    Activate

## 3. Manifest

``` json
{
  "name": "claude-plugin",
  "version": "1.0.0"
}
```

## 4. 安全

插件：

-   沙箱运行
-   权限控制
-   错误隔离
