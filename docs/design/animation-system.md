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
-   每帧语义根部锚点

非跳跃动画的语义根部必须来自高透明度最大主体连通区域。装饰、道具、尾巴和
残留像素不能参与根部定位；资源校验器应使用独立实现检查投影后的根部漂移不
超过 `1px`。

## 6. 平滑播放

Sprite 动画将资源帧视为关键姿势，不要求为显示器的每次刷新保存一张独立位图。
Renderer 使用 PixiJS 私有 Ticker 在最高 `60Hz` 下推进时间轴，并在相邻关键
姿势之间平滑过渡。

这能避免把相同图片机械复制成 60 帧，同时控制图集大小和 GPU 显存。关键姿势
跨度仍应保持合理；过大的姿势差异会形成短暂重影，应优先在资源侧补充关键姿势，
而不是让 React 参与逐帧动画。

局部循环动作应优先固定主体并单独变换活动部件。例如 Lumi 空闲摇尾由恒定身体
图层和独立尾巴图层构建。涉及朝向、肢体遮挡或触地关系变化的动作不能只依赖
透明插值；Lumi 成功动画使用 `10 FPS` 的 24 个时间槽，并补充七张真实运动
姿势，再由 Renderer 以最高 `60Hz` 显示相邻过渡。
