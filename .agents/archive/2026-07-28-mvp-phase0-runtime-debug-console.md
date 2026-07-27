# MVP Phase 0：Runtime 事件闭环与开发调试面板

状态：已完成，等待用户人工验收

## 目标

完成“模拟 Agent Event → Event Bus → Pet Runtime → PixiJS 动画”的真实闭环，并提供仅开发环境可用的独立调试面板。

## 已确认范围

- 桌宠 Renderer 是唯一的 Event Bus、Pet Runtime 和 PixiJS 组合根
- 托盘仅在 `pnpm dev` 环境显示“调试面板”
- Debug Preload 通过 Main 发送标准模拟 Agent Event
- Main 执行运行时校验并复用正式 `agent:event` 通道
- 面板展示 Runtime 生命周期、Pet State、Action、最后事件和处理数量
- 面板展示最多 200 条内存结构化日志，并支持清空
- 提供六种标准 Agent Event 测试按钮
- 提供中文和英文界面，默认跟随系统语言并保存用户选择
- 调试窗口不使用原生标题栏，由 Renderer 绘制拖动区、最小化和关闭控件

## 不包含

- FPS、内存和 GPU 指标
- 日志文件、搜索、筛选和导出
- DevTools 控制
- Claude Code Hook
- 第二套 Pet Runtime 或直接 PixiJS 控制

## 已确认视觉规格

- 参考稿：
  - 英文：`C:/Users/evanpatchouli/.codex/generated_images/019fa42f-624a-70c0-a4b1-bda9f15f6260/call_9TTaBNnHXHWdagz3wgvuHGh1.png`
  - 中文：`C:/Users/evanpatchouli/.codex/generated_images/019fa42f-624a-70c0-a4b1-bda9f15f6260/call_ZAzfObHxdAEDSVYxRN1VG1ZK.png`
- 画布：`1120 × 720`，普通原生窗口
- 布局：标题栏、运行时概览、事件模拟器、事件日志
- 色彩：石墨黑背景、冷灰分隔线、薄荷绿强调、语义红色错误
- 字体：系统无衬线 UI + 系统等宽协议值和日志
- 容器：开放分区与表格，不使用嵌套卡片、渐变或厚重阴影
- 语言：中文 / EN 文本切换；协议值保持英文
- 动效：仅按钮和状态的短过渡，并遵守 `prefers-reduced-motion`

## 计划

- [x] 生成并确认调试面板视觉规格
- [x] 组合 Event Bus、Pet Runtime 与 Pixi Renderer
- [x] 增加 Runtime 只读观察能力
- [x] 实现开发环境 Debug IPC、遥测 Hub 和窗口生命周期
- [x] 实现窗口专属 Debug Preload API 与 React 调试面板
- [x] 同步架构、API、开发说明和阶段记录
- [x] 执行静态工程检查
- [x] 实现无边框自定义标题栏与窄窗口控制 IPC
- [x] 修复 Renderer 崩溃连接状态与调试页加载失败重试
- [x] 交付用户功能测试清单并归档

## 自定义标题栏实施方案

- `debug-window.ts`：设置 `frame: false`，保留无边框窗口的安全配置
- Shared / Main / Preload：仅增加固定的“最小化”和“关闭”Debug API；Main 校验调用者必须是当前 Debug Window 主 Frame
- Debug React / CSS：Header 作为 `app-region: drag`，语言切换和窗口按钮显式使用 `app-region: no-drag`
- `main.ts`：Renderer 崩溃时把遥测连接状态设为断开
- 调试窗口加载失败：销毁失败实例并清空引用，使托盘入口可重新创建窗口
- 同步 Debug API、进程模型、调试指南与阶段记录

## 风险

- 无边框窗口失去系统标题栏行为，必须确保最小化、关闭、拖动和键盘焦点均有明确入口
- `app-region: drag` 会吞掉普通指针事件，所有交互控件必须标记为 `no-drag`
- 窗口控制不能暴露通用 Electron 能力或任意 IPC Channel

## 测试边界

功能测试由用户负责。Codex 不运行启动冒烟或功能测试，仅执行静态工程检查并交付包含预期结果的人工测试清单。
