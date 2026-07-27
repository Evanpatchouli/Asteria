# Coding Guidelines

版本：v0.1

## 1. 基本原则

遵循：

-   模块化
-   低耦合
-   事件驱动
-   插件优先

## 2. 动画原则

禁止：

React State 驱动高频动画。

推荐：

    requestAnimationFrame
            ↓
    Renderer Runtime
            ↓
    GPU

## 3. 类型规范

所有公共 API 必须提供 TypeScript 类型。

## 4. Commit

推荐：

-   feat
-   fix
-   refactor
-   docs
-   chore
