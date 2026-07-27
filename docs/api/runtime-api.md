# Runtime API

版本：v0.1

## 1. 目标

定义 Pet Runtime 对外核心接口。

## 2. Runtime Interface

``` ts
interface PetRuntime {

  dispatch(event: AgentEvent): void;

  changeState(state: PetState): void;

  playAction(action: string): void;

  setEmotion(emotion: Emotion): void;

}
```

## 3. 主要职责

Runtime 负责：

-   事件处理
-   状态转换
-   动作调度
-   Renderer 调用

## 4. 不负责

Runtime 不负责：

-   具体动画实现
-   窗口管理
-   Agent 接入细节
