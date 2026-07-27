# AI Agent Desktop Companion - Development Guide

> Repository instructions for AI coding agents

Version: v1.0

# 1. Project Overview

This project is an AI Agent Desktop Companion Runtime.

The goal is to build a desktop AI companion system based on:

* Electron
* React
* TypeScript
* PixiJS
* Event Driven Architecture

This project is NOT a simple desktop widget.

The final vision is:

```
AI Agent Runtime

+

Virtual Character Renderer

+

Plugin System
```

The system should allow AI Agents to become visible, interactive characters.

---

# 2. Core Development Principles

## 2.1 Architecture First

Before implementing any feature:

1. Read related documentation
2. Understand existing architecture
3. Confirm module boundaries
4. Propose implementation plan

Do not start coding based only on the task description.

---

## 2.2 Documentation Driven Development

Project documentation is the source of truth.

Documentation priority:

```
ADR

 >

Architecture

 >

API

 >

Design

 >

Implementation

 >

Task
```

When documents conflict:

1. Follow ADR decisions
2. Follow architecture rules
3. Follow API contracts
4. Update documents if architecture changes are required

---

# 3. Required Documents

Before coding, read:

## Project Overview

```
docs/AI-Agent-Desktop-Companion-Design.md
docs/roadmap.md
```

## Architecture

```
docs/architecture.md

docs/architecture/*
```

## API Contracts

```
docs/api/*
```

## Core Design

```
docs/design/*
```

## Implementation Guidance

```
docs/implementation/*
```

## Development Workflow

```
docs/development/codex-workflow.md

docs/development/ai-assisted-development.md
```

## Technical Decisions

```
docs/adr/*
```

---

# 4. Technology Stack

## Desktop Runtime

Electron

## Frontend

* React
* TypeScript
* Vite

## Rendering

PixiJS

Future:

* Three.js
* Live2D
* VRM

## Package Management

pnpm workspace

---

# 5. Architecture Rules

The core architecture:

```
Agent

↓

Adapter

↓

Event Bus

↓

Pet Runtime

↓

Renderer

↓

Character
```

Maintain strict separation between layers.

---

# 6. Module Responsibilities

## Agent Layer

Responsible for:

* External AI integration
* Event generation
* Agent adapters

Examples:

* Claude Code
* Codex
* MCP
* Game Plugin

Do not place Agent-specific logic into Runtime.

---

## Event Bus

Responsible for:

* Event communication
* Event routing
* Decoupling modules

All cross-module communication should prefer events.

---

## Pet Runtime

Responsible for:

* State management
* Action scheduling
* Emotion handling
* Behavior decisions

Runtime does NOT:

* Render graphics
* Manage windows
* Connect directly to agents

---

## Renderer

Responsible for:

* Animation
* Character rendering
* Visual effects

Renderer does NOT:

* Process business logic
* Handle Agent events directly

---

# 7. Coding Rules

## TypeScript

Prefer:

* strict typing
* explicit interfaces
* meaningful types
* immutable data where possible

Avoid:

* any
* implicit behavior
* unnecessary abstractions

---

## React

React should handle:

* UI
* Settings
* Debug panels

React should NOT handle:

* Animation loop
* Sprite state
* Frame updates

Wrong:

```
React State

↓

Every frame update

↓

Animation
```

Correct:

```
Runtime

↓

Renderer

↓

GPU
```

---

## Dependencies

Do not introduce new dependencies unless:

1. Existing libraries cannot solve the problem
2. The dependency is actively maintained
3. The impact is understood

Before adding dependencies, explain:

* Why needed
* Alternatives considered
* Impact

---

# 8. Current Development Phase

Current phase:

```
MVP
```

Current goal:

```
Electron Window

↓

PixiJS Renderer

↓

Pet Runtime

↓

Event Bus

↓

Claude Code Integration
```

---

# 9. Current Restrictions

Do NOT implement yet:

* Live2D
* VRM
* Voice interaction
* Advanced memory system
* Marketplace
* Cloud synchronization
* Multi-platform runtime

Focus on MVP completion first.

---

# 10. Development Workflow

Every task follows:

```
Requirement

↓

Read Documents

↓

Analyze Existing Code

↓

Implementation Plan

↓

Implementation

↓

Test

↓

Review

↓

Documentation Update
```

---

# 11. Before Coding

Before modifying code:

Provide:

1. Understanding of the requirement
2. Related documents
3. Proposed solution
4. Files to modify
5. Potential risks

If architecture changes are required:

Stop and request confirmation.

---

# 12. During Coding

Requirements:

* Make small incremental changes
* Keep module boundaries
* Avoid unrelated refactoring
* Follow existing naming conventions

Do not:

* Rewrite large areas without approval
* Change architecture silently
* Add unnecessary features

---

# 13. After Coding

Always provide:

```
Changed Files:

- file1
- file2


Implementation Summary:

...


Test Result:

...


Potential Risks:

...
```

---

# 14. Testing Requirements

Every major feature should include:

## Unit Test

For:

* Event Bus
* State Machine
* Runtime Logic

Recommended:

Vitest

---

## Integration Test

For:

* Plugin loading
* IPC communication
* Event flow

---

## E2E Test

Future:

Playwright

Validate:

* Application startup
* Window behavior
* UI behavior
* Runtime behavior

---

# 15. Performance Requirements

The application targets:

```
60 FPS animation

Low CPU usage

GPU accelerated rendering

Stable long-running runtime
```

Avoid:

* unnecessary React rendering
* blocking main process
* expensive per-frame calculations

---

# 16. Git Rules

Commit format:

```
type(scope): message
```

Types:

```
feat

fix

refactor

docs

test

chore
```

Example:

```
feat(renderer): add pixi renderer

fix(runtime): fix state transition
```

---

# 17. AI Collaboration Rules

AI tools are development assistants.

Human decides:

* Architecture
* Product direction
* Technology choices

AI assists with:

* Implementation
* Testing
* Refactoring
* Documentation

Follow:

```
Human

↓

Architecture Decision

↓

Codex Implementation

↓

Automated Verification

↓

Human Review
```

---

# 18. Final Goal

Build:

```
AI Agent Runtime

+

Virtual Character Platform

+

Plugin Ecosystem
```

The project should remain:

* Modular
* Extensible
* Maintainable
* AI-friendly
