# AI Agent Desktop Companion Architecture

> 系统架构设计文档

版本：v0.1


# 1. 系统概览


AI Agent Desktop Companion 由以下核心层组成：

```
+------------------------------------------------+
|                External Agents                 |
|                                                |
| Claude Code | Codex | MCP | Game | Custom      |
+------------------------------------------------+

                    |

                    v


+------------------------------------------------+
|              Agent Integration Layer            |
|                                                |
| Hook Adapter                                   |
| API Adapter                                    |
| WebSocket Adapter                              |
+------------------------------------------------+

                    |

                    v


+------------------------------------------------+
|                 Event Bus                       |
|                                                |
| AgentEvent                                     |
| Event Router                                   |
| Middleware                                     |
+------------------------------------------------+

                    |

                    v


+------------------------------------------------+
|              Pet Runtime Core                   |
|                                                |
| State Machine                                  |
| Action Scheduler                               |
| Emotion System                                 |
| Memory System                                  |
+------------------------------------------------+

                    |

                    v


+------------------------------------------------+
|              Rendering Runtime                 |
|                                                |
| PixiJS                                         |
| Three.js                                       |
| Live2D                                        |
+------------------------------------------------+

                    |

                    v


+------------------------------------------------+
|               Desktop Runtime                  |
|                                                |
| Electron Main                                  |
| Window Manager                                 |
| Native API                                     |
+------------------------------------------------+
```


---

# 2. Electron 架构


## 2.1 Main Process


职责：

- 创建窗口
- 管理生命周期
- 系统托盘
- 全局快捷键
- 文件访问
- Native API


目录：

```
electron-main/

├── window/

├── ipc/

├── tray/

├── updater/

└── native/
```


---

## 2.2 Renderer Process


职责：

- 宠物渲染
- 动画
- UI


目录：

```
renderer/

├── pet/

├── ui/

├── renderer/

└── stores/
```


---

# 3. IPC 设计


通信：

```
Main Process

      |
      |
 Electron IPC

      |

Renderer Process
```


## Main -> Renderer


例如：

Agent 状态变化：

```ts
ipcMain.emit(
 "agent:event",
 {
   type:"agent.thinking"
 }
)
```


Renderer：

```ts
ipcRenderer.on(
 "agent:event",
 event=>{
    petRuntime.handle(event)
 }
)
```


---

## Renderer -> Main


例如：

修改设置：

```ts
ipcRenderer.invoke(
 "settings:update",
 config
)
```


---

# 4. Event Bus


Event Bus 是整个系统核心。


## Event 生命周期


```
External Event

      |

Adapter

      |

AgentEvent

      |

Middleware

      |

State Machine

      |

Action

      |

Renderer
```


---

# 5. Agent Event Model


```ts
interface AgentEvent {

 id:string;


 source:
   | "claude"
   | "codex"
   | "game";


 type:
   | "idle"
   | "thinking"
   | "coding"
   | "tool_call"
   | "success"
   | "error";


 timestamp:number;


 payload?:unknown;

}
```


---

# 6. Pet Runtime


Pet Runtime 是角色逻辑核心。


结构：

```
PetRuntime


├── StateMachine

├── ActionManager

├── EmotionManager

├── ResourceLoader

└── RendererAdapter
```


---

# 7. State Machine


状态：

```ts
type PetState =

 | "idle"

 | "thinking"

 | "coding"

 | "waiting"

 | "happy"

 | "error"

 | "sleep";
```


状态转换：


```
idle

 |
coding event

 v

coding


 |
success

 v


happy
```


---

# 8. Animation Pipeline


```
State

 |

Action


 |

Animation


 |

Renderer


 |

GPU
```


动画循环：

```ts
requestAnimationFrame(()=>{

 update();

 render();

})
```


---

# 9. Resource Loading


资源：

```
Pet Package


├── metadata.json

├── textures

├── animations

├── sounds

└── scripts
```


支持：

- 热加载
- 资源替换
- 多角色


---

# 10. Storage


第一版：

SQLite


保存：

```
settings

pet_state

installed_plugins

statistics

memory
```


未来：

支持：

- 云同步
- Agent Memory


---

# 11. 安全设计


插件运行：

默认：

```
Sandbox
```


权限：

```json
{
 "filesystem":false,

 "network":true,

 "game":false
}
```


插件申请：

```
Permission Request

        |

User Confirm

        |

Enable
```


---

# 12. 后续扩展


支持：

- 多 Agent
- 多宠物
- 云端同步
- AI 长期记忆
- Marketplace