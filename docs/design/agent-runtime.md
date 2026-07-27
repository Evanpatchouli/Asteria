# Agent Runtime Design

版本：v0.1

## 1. 定位

Agent Runtime 是系统核心。

负责：

-   Agent 接入
-   事件转换
-   状态管理
-   行为调度

## 2. 架构

    Agent Adapter

    ↓

    Event Bus

    ↓

    Runtime Core

    ↓

    Pet

## 3. 核心模块

-   Event Bus
-   State Machine
-   Action Scheduler
-   Memory Manager
-   Plugin Manager

## 4. 扩展原则

核心不依赖具体 Agent。

支持：

-   Claude
-   Codex
-   MCP
-   Game Agent
