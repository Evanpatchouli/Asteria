# 托盘窗口居中操作

## 目标

为隐藏、离屏或透明窗口提供明确的找回入口，同时保留默认定位和用户位置持久化行为。

## 模块边界

```text
Desktop Tray
    ↓
WindowController
    ↓
Window position calculation + WindowStateStore
```

- 托盘只发出用户操作，不计算屏幕坐标。
- `WindowController` 负责选择主显示器、移动和显示原生窗口，并持久化状态。
- `window-position` 提供不依赖 Electron 的纯坐标计算。

## 行为

- 托盘菜单增加“窗口居中”。
- 操作将窗口移动到主显示器工作区正中心。
- 隐藏窗口使用 `showInactive()` 显示，不抢占当前应用焦点。
- 居中坐标立即写入现有窗口状态。
- 鼠标穿透状态保持不变。
- 默认右下角和已有位置恢复规则保持不变。

## 验证

功能测试由用户负责。Codex 仅执行格式、Lint、类型、构建、差异和 BOM 静态检查，并交付包含预期结果的人工测试清单。
