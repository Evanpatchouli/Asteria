# AI Agent Desktop Companion Plugin SDK


版本：

v0.1


# 1. 插件定位


Plugin 用于连接外部系统。


例如：

```
Claude Code

      |

Claude Plugin


Codex

      |

Codex Plugin


CS2

      |

Game Plugin
```


---

# 2. 插件目录


```
plugins/

└── claude/


    ├── plugin.json

    ├── index.ts

    └── adapter.ts
```


---

# 3. Manifest


plugin.json:


```json
{
"name":"claude-plugin",

"version":"1.0.0",

"type":"agent",

"permissions":[

 "network",

 "filesystem"

]

}
```


---

# 4. Plugin Interface


```ts
interface PetPlugin {


name:string;


version:string;



install(context:PluginContext):void;



activate():void;



deactivate():void;


}
```


---

# 5. Plugin Context


```ts
interface PluginContext {


eventBus:EventBus;



logger:Logger;



storage:Storage;



petRuntime:PetRuntime;


}
```


---

# 6. 发布事件


插件：

```ts
context.eventBus.emit({

type:"agent.coding",

source:"claude",

payload:{}

})
```


---

# 7. 监听事件


```ts
context.eventBus.on(

"pet.action",

event=>{

}

)
```


---

# 8. Claude Plugin


流程：


```
Claude Code Hook


      |

Claude Adapter


      |

AgentEvent


      |

Pet Runtime


      |

Animation
```


事件：

```
thinking

tool_call

coding

success

error
```


---

# 9. Codex Plugin


流程：


```
Codex CLI

 |

Adapter

 |

Agent Event

 |

Pet
```


---

# 10. Game Plugin


示例：

CS2:


```
Game State Integration


        |

Game Plugin


        |

Event Bus


        |

Pet
```


事件：


```ts
{

type:"game.kill"

payload:{
 weapon:"ak47"
}

}
```


---

# 11. Plugin 生命周期


```
install

 |

initialize

 |

activate

 |

running

 |

deactivate

 |

remove
```


---

# 12. Plugin SDK Roadmap


## v0.1

支持：

- Event Bus
- 生命周期
- 权限系统


## v0.2

增加：

- UI 插件
- 自定义动作
- 自定义资源


## v1.0

支持：

- Plugin Marketplace
- 云同步
- 第三方开发