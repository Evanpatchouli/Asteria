# Animation System

版本：v0.1

## 1. 目标

定义动画组织方式。

## 2. 动画类型

### Loop Animation

循环动画。

例如：

-   idle
-   typing

### One Shot Animation

一次性动画。

例如：

-   celebrate
-   error

### Transition Animation

状态切换动画。

例如：

-   sit_down
-   stand_up

## 3. 动画流程

    State

    ↓

    Action

    ↓

    Animation

    ↓

    Renderer

## 4. 动画优先级

优先级：

1.  Error
2.  Success
3.  User Interaction
4.  Coding
5.  Idle

## 5. 动画资源要求

动画需要：

-   唯一名称
-   状态标签
-   持续时间
-   是否循环
