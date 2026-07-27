# Local Development

版本：v0.1

## 1. 环境要求

推荐：

-   Node.js 24+
-   pnpm 10+
-   Git
-   Electron

## 2. 初始化

``` bash
pnpm install
pnpm dev
```

`pnpm dev` 会构建 Main 和 Preload、启动 Renderer Vite Dev Server，并启动 Electron。

生产构建预览：

``` bash
pnpm build
pnpm --filter @asteria/desktop start
```

自动退出式启动冒烟：

``` bash
pnpm smoke:desktop
```

冒烟验证会确认 Renderer 成功加载、窗口保持置顶，并且类型化 Preload API 已注入。

## 3. 开发结构

    apps/
      desktop/
        src/
          main/
          preload/
          renderer/

    packages/
    pets/
    plugins/

## 4. 调试

检查：

-   Electron Main 日志
-   Renderer Console
-   FPS
-   Event Bus
