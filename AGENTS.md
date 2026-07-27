# AI Agent Desktop Companion - Development Guide

## Project Overview

This project is an AI Agent Desktop Companion Runtime.

The goal is to build a desktop AI pet system based on:

- Electron
- React
- TypeScript
- PixiJS
- Event Driven Architecture


The project is NOT a simple desktop widget.

It is designed as:

AI Agent Runtime + Virtual Character Renderer + Plugin System


---

# Core Principles


## 1. Architecture First

Before implementing any feature:

- Read related documents under /docs
- Follow existing architecture decisions
- Avoid introducing unnecessary dependencies


---

## 2. Follow Documentation


Important documents:


Architecture:

- docs/architecture.md
- docs/architecture/*


API:

- docs/api/*


Design:

- docs/design/*


Implementation:

- docs/implementation/*


Development:

- docs/development/*


ADR:

- docs/adr/*


When conflicts happen:

ADR > Architecture > Design > Implementation


---

# Tech Stack


## Desktop

Electron


## Frontend

React
TypeScript
Vite


## Rendering

PixiJS


## Package Manager

pnpm workspace


---

# Coding Rules


## TypeScript

Prefer:

- strict typing
- explicit interfaces
- avoid any


## Architecture

Do not:

- Put business logic in React components
- Couple Agent logic with Renderer
- Hardcode animations


Correct:


Agent Event

↓

Event Bus

↓

Runtime

↓

Renderer


---

# Current Development Phase


Current phase:

MVP


Goal:


Electron Window

↓

PixiJS Renderer

↓

Pet Runtime

↓

Event Bus

↓

Claude Code Integration



---

# Current Restrictions


Do NOT implement yet:


- Live2D
- VRM
- Voice interaction
- Memory system
- Marketplace
- Cloud sync


Focus only on MVP.


---

# Development Workflow


Before coding:

1. Inspect existing code
2. Read related docs
3. Explain implementation plan
4. Wait for confirmation if architecture changes are required


After coding:

Provide:

- Changed files
- Reason
- Test result
- Remaining issues


---

# Testing Requirement


Every major feature should include:

- Unit test if applicable
- Manual verification steps


Future goal:

Use Codex to validate:
- Build
- Runtime behavior
- UI behavior
- Performance