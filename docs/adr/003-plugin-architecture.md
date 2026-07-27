# ADR-003: Plugin Architecture

状态：Accepted

## Context

系统需要支持：

-   Claude
-   Codex
-   Game Plugin

## Decision

采用 Plugin First 架构。

## Rules

插件：

-   只能通过 Event Bus 通信
-   不直接修改 Runtime
-   使用权限模型

## Benefits

-   易扩展
-   降低耦合
-   支持第三方生态
