# AI Agent Desktop Companion Roadmap

> 项目路线规划

版本：v0.1  
状态：Draft


---

# 1. 产品演进路线

项目目标：

从一个 AI 桌宠，逐步演进为：

> AI Agent Desktop Companion Platform


整体演进：

```
AI Coding Companion

        ↓

AI Agent Desktop Pet

        ↓

AI Character Runtime

        ↓

AI Companion Platform
```


---

# 2. Phase 0：技术验证阶段

## 目标

验证核心技术路线：

- Electron 桌面能力
- 高性能动画渲染
- Agent 事件驱动
- 宠物状态切换


## 周期

3～5 天


## 功能范围


### Electron 桌面窗口

实现：

- 无边框窗口
- 透明背景
- Always On Top
- 拖动
- 点击穿透


目标：

桌面显示一个可交互角色。


---

### PixiJS Renderer

实现：

- Canvas 初始化
- Sprite 渲染
- Animation Loop
- FPS 统计


目标：

稳定 60 FPS。


---

### Event Bus

定义基础事件：

```ts
agent.idle

agent.thinking

agent.coding

agent.success

agent.error
```


---

## 阶段成果

实现：

```
手动发送事件

        ↓

宠物切换动画
```


---

# 3. Phase 1：MVP - AI Coding Pet


## 目标

完成第一个真正可用版本：

> 能感知 AI Coding Agent 状态的桌面宠物。


## 周期

2～4 周


---

# 功能列表


## 3.1 Agent Core


实现：

- Event Bus
- State Machine
- Action System


架构：

```
Event

 ↓

State

 ↓

Action

 ↓

Animation
```


---

## 3.2 Claude Code 接入


流程：

```
Claude Code Hook

        ↓

Claude Adapter

        ↓

Agent Event

        ↓

Pet Runtime

        ↓

Animation
```


支持事件：


|事件|宠物行为|
|-|-|
|thinking|思考|
|tool_call|工作|
|success|庆祝|
|error|异常反馈|


---

## 3.3 宠物系统


支持：

- 默认角色
- 动画切换
- 状态展示


目录：

```
pets/

└── default/
```


---

## 3.4 设置中心


支持：

- 角色选择
- 音效开关
- 开机启动
- 窗口位置保存


---

# 4. Phase 2：平台化


## 目标

从桌宠升级为：

> AI Agent Runtime


周期：

1～2 月


---

## 插件系统


支持：

```
plugins/

├── claude

├── codex

├── cs2

└── custom
```


---

## 多角色系统


支持：

- 角色导入
- 角色切换
- 动画包管理


---

## 资源系统


支持：

```
角色

动画

音效

主题

插件
```


---

# 5. Phase 3：高级 AI 能力


周期：

3～6 月


---

## 情绪系统


根据：

- Agent 状态
- 用户行为
- 使用时间


生成：

```
happy

excited

tired

sleepy

```


---

## 长期记忆系统


记录：

- 用户习惯
- 项目上下文
- 常用操作


---

## 语音交互


支持：

```
Voice Input

      ↓

AI

      ↓

Pet Response
```


---

# 6. Phase 4：生态化


最终目标：

```
AI Character Runtime
```


支持：

- Windows
- macOS
- Linux
- Mobile Companion


---

# 7. 技术演进原则


## 避免


不要：

- React State 驱动动画
- Agent 与角色强耦合
- 插件直接修改核心


---

## 保持


核心原则：

```
Event Driven

Plugin First

Renderer Independent
```


---

# 8. 版本规划


|版本|目标|
|-|-|
|0.1|技术验证|
|0.2|AI Coding Pet MVP|
|0.5|插件系统|
|0.8|角色生态|
|1.0|AI Companion Platform|