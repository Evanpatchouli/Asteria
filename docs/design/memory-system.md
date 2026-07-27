# Memory System Design

版本：v0.1

## 1. 目标

为 AI Companion 提供长期记忆能力。

记录：

-   用户习惯
-   项目上下文
-   历史交互

## 2. 架构

    Agent

    ↓

    Memory Manager

    ↓

    Storage

    ↓

    Recall

## 3. Memory 类型

### Short Term Memory

当前任务上下文。

### Long Term Memory

长期偏好。

### Project Memory

项目相关信息。

## 4. 存储

第一阶段：

SQLite

未来：

-   Vector Database
-   Cloud Sync

## 5. 检索流程

Query

↓

Memory Search

↓

Context Injection

↓

Agent
