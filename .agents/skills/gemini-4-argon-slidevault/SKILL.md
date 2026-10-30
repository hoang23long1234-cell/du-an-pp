---
name: gemini-4-argon-slidevault
description: "Links and orchestrates SlideVault Web with Google Antigravity using Gemini 4 Argon (`gemini-4-argon`). Enables autonomous presentation engineering, slide deck synthesis, 3D VisionOS spatial touch control, and real-time Web Bridge communication."
---

# Gemini 4 Argon & SlideVault Antigravity Integration Skill

This skill links the SlideVault Web Application with the Google Antigravity Agent Runtime via the unified `gemini-4-argon` flagship model.

## Overview

- **Core Model**: `gemini-4-argon` (1,000,000 token context window, 1,000,000 token decode limit, frontier reasoning).
- **Web App**: SlideVault AI Presentation Platform (`http://localhost:3000` / `https://host-textiles-mechanical-render.trycloudflare.com`).
- **Antigravity Web Bridge**: `http://localhost:3000/api/antigravity/bridge`.

## Capabilities

1. **Autonomous Slide Deck Generation**:
   - Send requests to `/api/ai/chat` or `/api/ai/chat_raw` with `{ provider: 'gemini-4-argon', model: 'gemini-4-argon' }`.
   - Generates 3 to 20 McKinsey/BCG & High-Ed Academic slides with vector KPI charts and speaker notes.
2. **Real-time Bridge Sync**:
   - Healthcheck: `GET /healthz`
   - Model & Bridge status: `GET /api/antigravity/bridge`
3. **PptxGen Native Vector Export**:
   - Native export to `.pptx` PowerPoint without raster degradation.

## Usage in Antigravity

When working with SlideVault inside Antigravity:
1. Ensure the server daemon is running (`node fix.html/server.js`).
2. Verify bridge connectivity via `http://localhost:3000/api/antigravity/bridge`.
3. In `AI.html` or `index.html`, select `Gemini 4 Argon (Antigravity Linked)` as the default AI engine.
