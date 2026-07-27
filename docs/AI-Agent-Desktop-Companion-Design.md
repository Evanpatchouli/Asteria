# AI Agent Desktop Companion 设计方案

> 一个基于 Electron 的 AI Agent 桌面生命体运行时

版本：v0.1  
状态：Draft  
作者：


---

# 1. 项目定位

## 1.1 项目目标

本项目不是传统意义上的桌宠，而是：

> AI Agent Desktop Companion Runtime

即：

**AI Agent 的桌面可视化生命体载体。**

目标：

- 将 AI Agent 的运行状态可视化
- 提供拟人化交互体验
- 支持多 Agent 接入
- 支持自定义角色
- 支持插件生态


---

## 1.2 应用场景

### AI Coding Companion

支持：

- Claude Code
- Codex
- Cursor Agent
- MCP Agent


示例：

```
AI 正在思考

↓

宠物进入 Thinking 状态


AI 正在修改代码

↓

宠物进入 Coding 状态


任务完成

↓

宠物庆祝
```


---

### 游戏助手

例如：

NovaStrike 插件：

```
CS2 GSI

↓

Game Event

↓

Pet Event

↓

宠物反馈
```


事件：

- 回合开始
- 击杀
- 死亡
- 下包
- 胜利


---

# 2. 总体架构


```
                AI Sources

       Claude Code     Codex
            |            |
            +------------+

                  |
                  v

          Agent Event Bus

                  |
                  v

          Pet Runtime Core

        +---------+---------+

        |                   |

  State Machine       Plugin System


                  |

                  v

          Renderer Runtime


        +-------------------+

        |                   |

      PixiJS            Three.js

       2D                  3D

        |                   |

     Spine              VRM

     Live2D
```


---

# 3. 技术选型


## 3.1 Desktop Framework


选择：

```
Electron
```


原因：

- Windows 支持成熟
- Chromium 渲染稳定
- WebGL 支持完善
- Node.js 生态丰富
- AI SDK 集成简单


---

## 3.2 Frontend


技术：

```
React 19
TypeScript
Vite
```


用途：

负责：

- 设置界面
- 插件管理
- 配置页面
- 调试面板


注意：

React 不负责高频动画。


---

## 3.3 Rendering


## 2D Renderer

选择：

```
PixiJS 8
```


用途：

- 像素宠物
- Spine
- 粒子效果
- 高 FPS 动画


目标：

60 FPS


---

## 3D Renderer

选择：

```
Three.js
```


用途：

- VRM
- 3D 角色
- Shader
- 摄像头追踪


---

## 角色系统


支持：

- Live2D Cubism
- Spine
- VRM


---

# 4. 项目结构


```
ai-pet/

├── apps/
│
│   └── desktop/
│       |
│       ├── electron-main
│       |
│       └── renderer
│

├── packages/

│   ├── agent-core
│   |
│   ├── event-bus
│   |
│   ├── pet-runtime
│   |
│   ├── pet-renderer
│   |
│   ├── plugin-sdk
│   |
│   └── shared


├── pets/

│   └── neko/


└── plugins/

    ├── claude
    |
    ├── codex
    |
    └── cs2
```


---

# 5. 核心模块设计


# 5.1 Agent Event Bus


所有外部 Agent 统一转换为事件。


接口：

```ts
interface AgentEvent {

  type:
    | "agent.idle"
    | "agent.thinking"
    | "agent.streaming"
    | "agent.tool_call"
    | "agent.success"
    | "agent.error"


  payload?: unknown

}
```


示例：

Claude Code：

```
读取文件
```

转换：

```json
{
"type":"agent.tool_call",

"payload":{
 "tool":"read_file"
}
}
```


---

# 5.2 Pet State Machine


设计：

```
Event

↓

State Machine

↓

Action

↓

Animation
```


状态：

```ts
enum PetState {

 Idle,

 Thinking,

 Coding,

 Happy,

 Error,

 Sleep

}
```


---

状态转换：

```
Thinking

    |
    |
 success

    v

Happy
```


---

# 5.3 Action System


不要：

```ts
if(state==="coding")
```

而使用：

```ts
interface PetAction {

 name:string;

 duration:number;

 play():void;

}
```


动作：

```
typing

thinking

celebrate

sleep

error
```


---

# 6. 角色资源系统


目录：

```
pets/

└── neko/

    ├── pet.json

    ├── animations/

    │   ├── idle

    │   ├── coding

    │   └── happy


    ├── textures/

    └── sounds/
```


pet.json:

```json
{
"name":"Neko",

"renderer":"pixijs",

"states":{

"idle":"idle",

"coding":"coding",

"happy":"happy"

}

}
```


---

# 7. Plugin 系统


插件负责：

- 接入外部系统
- 产生 Agent Event


结构：

```
plugins/

├── claude

├── codex

├── cs2

└── custom
```


---

## Claude Plugin


```
Claude Code Hook

↓

Agent Event

↓

Pet Runtime

↓

Animation
```


---

## CS2 Plugin


```
Game Event

↓

Pet Event

↓

动作
```


例如：

```
击杀

↓

庆祝动画
```


---

# 8. Electron 架构


```
Electron Main

    |

    | IPC

    |

Renderer


    |

Pet Runtime


    |

PixiJS
```


Main 负责：

- 窗口
- 系统权限
- 文件
- 生命周期


Renderer：

- 动画
- 渲染
- UI


---

# 9. 性能设计


目标：

|指标|目标|
|-|-|
|FPS|60|
|CPU|<3%|
|内存|<300MB|
|启动时间|<2s|


原则：

## React 不参与动画循环


错误：

```
React State

↓

Render

↓

Animation
```


正确：

```
requestAnimationFrame

↓

Pixi Runtime

↓

Render
```


---

# 10. MVP 开发计划


## Phase 1

目标：

完成 AI Coding 桌宠。


功能：

- Electron 窗口
- 透明背景
- 置顶
- PixiJS Renderer
- Event Bus
- Claude Code Hook


效果：

```
Claude 开始编码

↓

宠物进入 Coding 状态
```


---

## Phase 2


增加：

- 插件系统
- 多角色
- 设置中心
- 自动更新


---

## Phase 3


高级能力：

- Live2D
- VRM
- 语音交互
- 情绪模型
- 长期记忆


---

# 11. 未来演进


最终目标：

```
AI Agent Runtime


        +

Virtual Character


        +

Plugin Ecosystem
```


支持：

```
Claude Pet

Codex Pet

Game Coach Pet

DevOps Pet

Personal Assistant Pet
```


---

# 12. 第一版推荐技术栈


```
Electron

React

TypeScript

Vite

PixiJS 8

Three.js

Zustand

Zod

WebSocket

MCP SDK

pnpm workspace

Vitest

Playwright

electron-builder
```


---

# 总结


本项目核心不是桌宠，而是：

> 一个 AI Agent 的可视化运行环境。


Electron 负责桌面能力。

PixiJS / Three.js 负责生命表现。

Event Bus 负责连接 AI。

Plugin System 负责未来扩展。


最终目标：

打造一个属于自己的 AI Agent Desktop Companion 平台。