# AI Agent Desktop Companion MVP Tasks

> MVP 开发任务拆分

版本：v0.1


---

# MVP 目标


完成：

> 一个可以感知 Claude Code 状态，并产生动画反馈的桌面 AI 宠物。


---

# Milestone 1：项目初始化


## TASK-001 初始化 Monorepo


状态：

TODO


创建：

```
ai-pet/

├── apps/

├── packages/

├── pets/

└── plugins/
```


技术：

- pnpm workspace
- TypeScript
- ESLint
- Prettier


---

## TASK-002 Electron 基础工程

状态：

DONE


完成：

- Electron 主进程
- Renderer
- Vite
- 开发环境


验收：

```
pnpm dev
```

启动桌宠窗口。


---

# Milestone 2：桌面能力


## TASK-010 透明窗口

状态：

DONE


实现：

- 无边框
- 透明背景
- Always On Top


验收：

桌面显示悬浮宠物。


---

## TASK-011 窗口交互

状态：

DONE


支持：

- 拖动
- 位置保存
- 鼠标事件


---

## TASK-012 系统托盘

状态：

PARTIAL


支持：

- 显示
- 隐藏
- 退出程序

暂未实现：

- 设置入口


---

# Milestone 3：Renderer


## TASK-020 集成 PixiJS


实现：

```
Pixi Application

        ↓

Sprite

        ↓

Animation
```


---

## TASK-021 动画循环


要求：

60 FPS


实现：

```ts
requestAnimationFrame()
```


---

## TASK-022 Renderer API


定义：

```ts
interface PetRenderer {

  play(animation:string):void;

  stop():void;

  setExpression(name:string):void;

}
```


---

# Milestone 4：Pet Runtime


## TASK-030 状态机


状态：

```ts
type PetState =
 | "idle"
 | "thinking"
 | "coding"
 | "success"
 | "error";
```


---

## TASK-031 Action System


流程：

```
State

 ↓

Action

 ↓

Animation
```


动作：

- typing
- thinking
- celebrate
- sleep


---

## TASK-032 Resource Loader


支持：

```
pets/

└── default/

    ├── pet.json

    ├── animations/

    └── textures/
```


---

# Milestone 5：Agent Integration


## TASK-040 Event Bus


实现：

```ts
emit(event)

subscribe(handler)
```


---

## TASK-041 Claude Plugin


支持：

事件：

- thinking
- coding
- tool_call
- success
- error


---

## TASK-042 Agent Adapter


统一：

```
Claude Event

Codex Event

Game Event


        ↓


Agent Event
```


---

# Milestone 6：UI


## TASK-050 设置页面


功能：

- 角色选择
- 音量设置
- 开机启动


---

## TASK-051 调试面板


显示：

```
Current State

Last Event

FPS

Memory Usage
```


---

# Milestone 7：发布


## TASK-060 打包


使用：

```
electron-builder
```


输出：

```
AI-Pet.exe
```


---

## TASK-061 自动更新


支持：

- 版本检测
- 下载
- 安装


---

# MVP 验收标准


## 功能

- [ ] 桌面显示宠物
- [ ] 透明窗口
- [ ] 可拖动
- [ ] 60 FPS 动画
- [ ] Event Bus
- [ ] Claude Code 联动
- [ ] 状态动画切换


---

## 性能目标


|指标|目标|
|-|-|
|FPS|60|
|CPU|<5%|
|内存|<300MB|
|启动时间|<3秒|


---

# 后续规划


## P1

- Live2D
- Codex Plugin
- 多宠物


## P2

- VRM
- 语音交互
- Memory System


## P3

- Marketplace
- 云同步
- 第三方插件生态
