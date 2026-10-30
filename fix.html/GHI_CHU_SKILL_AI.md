# 📚 Ghi chú học tập: Thư mục `skill AI/`

> Tổng hợp ngày 04/10/2026 — 17 dự án đã được khảo sát trong `skill AI/`.
> Mục đích: hiểu rõ từng dự án, giá trị sử dụng, và cách áp dụng cho workspace này
> (3dtouch + fix.html/SlideCraft AI).

---

## 1. Bảng tổng quan 17 dự án

| # | Dự án | Loại | Một dòng mô tả |
|---|-------|------|----------------|
| 1 | `awesome-llm-apps-main` | Bộ sưu tập | 100+ AI agent, agent skills, RAG app (Apache-2.0) |
| 2 | `code-review-graph-staging` | Công cụ (Python) | Knowledge graph cho code review qua MCP, tiết kiệm ~65x token |
| 3 | `cursor-designer-main` | Rules | Bộ Cursor rules về design-first (UX/UI/IA/A11y) |
| 4 | `awesome-design-md-main` | Bộ sưu tập | 73 file DESIGN.md trích từ website thật cho AI agent |
| 5 | `mediapipe-master` | Thư viện | ML on-device của Google (vision/text/audio) 🔥 liên quan 3dtouch |
| 6 | `langchain-master` | Framework | Nền tảng xây agent/ứng dụng LLM (LangGraph, LangSmith) |
| 7 | `ui-main` | Thư viện UI | shadcn/ui — component đẹp, copy-paste, React |
| 8 | `cursor-rules-and-prompts-main` | Rules+Prompts | Rules & prompts biến Cursor thành "senior dev" |
| 9 | `impeccable-main` | Skill (design) | 1 skill, 24 lệnh, 61 rule phát hiện "AI slop" UI |
| 10 | `playwright-main` | Công cụ (JS) | Tự động hóa & test web (Chromium/Firefox/WebKit) + MCP |
| 11 | `storybook-next` | Công cụ UI | Xưởng phát triển & test component UI |
| 12 | `SwiftUI-Agent-Skill-main` | Skill | Skill chuyên gia SwiftUI cho AI coding tools |
| 13 | `taste-skill-main` | Skill (design) | "Anti-Slop Frontend Framework" cho frontend cao cấp |
| 14 | `twenty-main` | Ứng dụng | CRM mã nguồn mở #1, định nghĩa model bằng code |
| 15 | `ui-ux-pro-max-skill-main` | Skill (design) | 192 reasoning rules + 79 UI style (có README tiếng Việt) |
| 16 | `HTMLHint-main` | Công cụ (JS) | Static analysis cho HTML (thư mục lồng cấp 2) |
| 17 | `liquid-high-fidelity` | Demo HTML | Trang demo "Liquid High-Fidelity" (Tailwind + oklch + view-transition) |

---

## 2. Nhóm AI Agent & "Agent Skills"

### 2.1 `awesome-llm-apps-main` (repo Shubhamsaboo/awesome-llm-apps)

**Là gì:** Bộ sưu tập 100+ AI agent & RAG app mã nguồn mở, chạy được ngay với API key.

**Cấu trúc các nhóm chính:**
- `agent_skills/` — Skills dạng `SKILL.md` (8 skill: project-graveyard, first-reader,
  scope-creep-detector, commit-archaeologist, dependency-doctor, thinking-out-loud,
  advisor-orchestrator-worker, self-improving-agent-skills)
- `starter_ai_agents/` — agent 1 file, dễ chạy nhất
- `advanced_ai_agents/` — single-agent + multi-agent + agent_teams (production-style)
- `always_on_agents/` — agent chạy nền theo lịch/sự kiện (HN briefing, release radar)
- `generative_ui_agents/` — agent sinh UI (dashboard canvas, deep research…)
- `voice_ai_agents/` — agent thoại (insurance claim team…)
- `mcp_ai_agents/` — agent dùng Model Context Protocol
- `rag_tutorials/` — ~30 bài RAG (CRAG, GraphRAG, Local RAG, Vision RAG…)
- `ai_agent_framework_crash_course/` — khóa học ADK & OpenAI Agents SDK
- `advanced_llm_apps/` — memory apps, chat-with-X, tối ưu token, fine-tuning

**💡 Khái niệm "Agent Skill" (quan trọng nhất):**
- 1 skill = 1 thư mục chứa `SKILL.md` (+ scripts/, references/)
- `SKILL.md` có YAML frontmatter: `name`, `description`, `license`, `metadata`
- Cài bằng 1 lệnh: `npx skills add <url>` → agent tự đặt vào đúng thư mục
  (Claude Code: `~/.claude/skills/`, Cursor: `~/.cursor/skills/`, project: `.agents/skills/`)
- Tiêu chí "chất": có script thật, tài liệu có nguồn, chạy local mặc định, được test
- ⚠️ Skill chạy với quyền của agent → phải đọc SKILL.md + scripts trước khi cài

### 2.2 `code-review-graph-staging` (tirth8205/code-review-graph)

**Là gì:** Knowledge graph cục bộ cho code, phục vụ AI review qua MCP.
- Dùng **Tree-sitter** phân tích cấu trúc → cập nhật tăng dần → trả context gọn qua MCP
- Kết quả: review dùng ít token hơn **~65x** so với đọc cả codebase (143k → 2.2k token)
- Hỗ trợ 16+ AI tools: Codex, Claude Code, Cursor, Windsurf, Copilot, Gemini CLI…
- Cài: `pip install code-review-graph` → `code-review-graph install` → `build`
- Có pre-commit hook, watch mode, uninstall sạch sẽ, GitHub Action
- Lệnh chính: `/code-review-graph:build-graph`, `:review-delta`, `:review-pr`

### 2.3 `SwiftUI-Agent-Skill-main` (AvdLee)

- Skill "SwiftUI Expert" dạy AI: state management, view composition, performance, SDK 27
- Đóng gói theo chuẩn **Agent Plugin** (`plugin.json` + `skills/`), hỗ trợ Claude Code,
  Cursor, Codex, ChatGPT/Codex Plugins Directory
- Cài: `npx skills@latest add https://github.com/avdlee/swiftui-agent-skill --skill swiftui-expert-skill`

### 2.4 `ui-ux-pro-max-skill-main`

- Skill "design intelligence" cho UI/UX đa nền tảng: **192 reasoning rules**, **79 UI style**
- ⭐ Có **README tiếng Việt** (README.vi.md) — dễ đọc cho team
- Có CLI npm: `ui-ux-pro-max-cli`; website uupm.cc

### 2.5 `taste-skill-main`

- "Anti-Slop Frontend Framework for AI Agents" — chống giao diện AI na ná nhau
- Hướng tới frontend "premium", có sponsor Kimi/Moonshot; website tasteskill.dev

### 2.6 `impeccable-main`

- 1 skill + **24 lệnh** (`/impeccable craft|init|polish|audit|critique…`)
- **61 detector rule** chạy không cần LLM/API key (CLI + browser extension)
- Ghi `PRODUCT.md` (sự thật sản phẩm) + `DESIGN.md` (hệ thống hình ảnh) cho agent
- Cài: `npx impeccable install` rồi `/impeccable init`

---

## 3. Nhóm Thư viện & Công cụ kỹ thuật

### 3.1 `mediapipe-master` (Google) 🔥 LIÊN QUAN TRỰC TIẾP 3dtouch

- **ML on-device cho mọi người**: mobile (Android/iOS), web, desktop, edge, IoT
- Thành phần: MediaPipe Tasks (API đa nền tảng), Models (pre-trained),
  Model Maker (tùy biến), Studio (visualize/benchmark trên browser)
- Repo build bằng **Bazel** (WORKSPACE, BUILD.bazel, MODULE.bazel), có Dockerfiles,
  `Package.swift` (Swift), `package.json`/`tsconfig.json` (JS), `setup.py` (Python)
- Docs chính thức chuyển về **developers.google.com/mediapipe** (từ 4/2023)
- ⚠️ **Điểm vàng cho dự án**: `3dtouch/3dlite.tsx` đang dùng `@mediapipe/pose` (legacy JS).
  Hướng nâng cấp hiện đại: **MediaPipe Tasks Vision (@mediapipe/tasks-vision)** —
  Pose Landmarker / Hand Landmarker, chạy WebAssembly, hiệu năng & độ chính xác cao hơn,
  phù hợp xử lý realtime trên điện thoại làm camera trong hệ thống trình diễn

### 3.2 `langchain-master`

- **"The agent engineering platform"** — framework xây agent & app LLM
- Điểm chính: `init_chat_model("openai:gpt-5.5")` thống nhất mọi model; hệ sinh thái
  **LangGraph** (orchestration workflow) + **LangSmith** (dev/debug/deploy)
- Có bản JS/TS: `langchainjs`; cài Python: `uv add langchain`
- 💡 Tham khảo khi mở rộng SlideCraft AI (fix.html) từ 1 API call Groq →
  agent nhiều bước có tool, memory (kết hợp các RAG tutorial trong awesome-llm-apps)

### 3.3 `playwright-main`

- Framework **tự động hóa & test web** — 1 API chạy Chromium/Firefox/WebKit
- 5 cách dùng: Playwright Test (e2e), **CLI cho coding agents**, **MCP cho AI agents**,
  Library (script), VS Code Extension
- Cài nhanh: `npm init playwright@latest` hoặc `npx @playwright/mcp@latest`
- Ứng dụng: test UI 3dtouch/fix.html, tự động kiểm tra luồng trình diễn

### 3.4 `storybook-next`

- **Xưởng phát triển & kiểm thử UI component** ("Build bulletproof UI components faster")
- Phát triển từng component độc lập, viết story, test trực quan trước khi ghép vào app
- Kết hợp shadcn/ui + Playwright thành bộ combo UI → test hoàn chỉnh

### 3.5 `twenty-main`

- **CRM mã nguồn mở #1** — "CRM bạn build, ship và version như phần còn lại của stack"
- Định nghĩa objects/fields/views **bằng code** (`twenty-sdk/define`),
  scaffold bằng `npx create-twenty-app`
- Có cloud (twenty.com) + self-host; tham khảo kiến trúc monorepo & code-gen

### 3.6 `HTMLHint-main`

- **Static analysis cho HTML** (linter) — npm `htmlhint`, yêu cầu Node.js 22+
- ⚠️ Lưu ý: thư mục bị lồng 2 cấp: `HTMLHint-main/HTMLHint-main/` mới là repo thật
  (src/, test/, website/, dist/, có cả `AGENTS.md` làm ví dụ chuẩn cho agent)
- Ứng dụng: lint các file HTML trong `fix.html/` và demo liquid-high-fidelity

---

## 4. Nhóm Design, UI & Rules (Cursor)

### 4.1 `cursor-designer-main`

- Bộ **Cursor rules "design-first"** do Spencer Goldade tuyển chọn
- Phủ: UX, UI, Information Architecture, Accessibility, design QA
- 3 profile: **core** (luôn bật), **lean** (frontend cơ bản), **full**
- Cấu trúc: `.cursor/rules/core/` (design-core, behavior-constraints),
  `.cursor/rules/frontend/` (layout, forms, a11y, flows…)
- Nguyên tắc: chỉ cần vài rule core để bắt đầu, mở rộng dần

### 4.2 `cursor-rules-and-prompts-main`

- Bộ **RULES + PROMPTS** cho Cursor: biến AI thành "thành viên team biết chuẩn codebase"
- Mục tiêu: không phải nhắc lại "dùng `@/` thay vì relative path", "đừng viết inline style"…
- Project-agnostic, dễ tùy biến, tổ chức tốt, có prompts kèm theo
- Lưu ý: license Proprietary (đọc LICENSE trước khi dùng thương mại)

### 4.3 `awesome-design-md-main` (VoltAgent)

- **73 file `DESIGN.md`** trích xuất từ website thật (đã phân tích tokens, patterns, rules)
- Theo concept **DESIGN.md của Google Stitch**: file markdown thuần, agent đọc để sinh UI
  đồng nhất — không cần Figma export/JSON schema
- Phân vai: `AGENTS.md` = cách build project; `DESIGN.md` = project trông/cảm thế nào
- Cách dùng: copy 1 file DESIGN.md vào root project → "build me a page that looks like this"

### 4.4 `ui-main` (= shadcn/ui)

- Bộ component React đẹp, **copy-paste vào project** (không phải dependency truyền thống)
- Triết lý: "Open Source. Open Code. Use this to build your own component library"
- Docs: ui.shadcn.com/docs — License MIT
- Phù hợp khi cần nâng cấp UI cho app React/Next.js nhanh mà vẫn sở hữu code

### 4.5 `liquid-high-fidelity` (demo)

- Demo 1 trang: **"Liquid High-Fidelity Architecture"** (`index.html` + `video.mp4`)
- Kỹ thuật đáng học:
  - Tailwind qua CDN + CSS variables dùng **oklch()** (màu hiện đại, dải rộng hơn)
  - **View Transitions API**: `::view-transition-old/new` + animation blur/saturate
  - Dark/Light theme qua `[data-theme]`, font Inter
  - "Atmospheric portal" — video nền mix-blend, hiệu ứng thuỷ tinh lỏng
- Dùng làm tham chiếu cho hiệu ứng "Liquid Glass" khi dựng UI trình diễn

---

## 5. Bài học & cách áp dụng cho workspace này

### 5.1 Ưu tiên ngay cho 3dtouch

1. **Nâng cấp MediaPipe**: chuyển `@mediapipe/pose` → `@mediapipe/tasks-vision`
   (PoseLandmarker/HandLandmarker) — độ chính xác và tốc độ tốt hơn cho
   theo dõi cử chỉ realtime qua điện thoại (đối chiếu code trong `3dtouch/`)
2. **Chẩn đoán & theo dõi mục tiêu**: giữ cấu trúc `SpatialCoreEngine`, `AI3dTouch`,
   `AI3dTargetTracker`; có thể tham khảo pattern "stale target" trong AI3d.ts

### 5.2 Quy trình làm việc với AI agent (học từ repo)

1. **Skill = thư mục + SKILL.md** — có thể đặt vào `.agents/skills/` của repo
   để cả team dùng; đọc kỹ SKILL.md + scripts trước khi cài (bảo mật)
2. **code-review-graph** — khi review code 3dtouch/fix.html, cài
   `pip install code-review-graph` → `install` → `build` để tiết kiệm ~65x token
3. **Cursor rules** — nếu chuyển sang Cursor: copy core rules từ
   `cursor-designer-main/.cursor/rules/core/` + `cursor-rules-and-prompts-main`

### 5.3 Nâng cấp UI/UX (khi cần đẹp & đồng nhất)

1. **DESIGN.md**: chọn 1 mẫu từ `awesome-design-md-main` làm chuẩn visual cho
   SlideCraft/3dtouch UI — đặt vào root project
2. **Skills design** (cài qua `npx skills add`):
   - `ui-ux-pro-max` (192 rules, có bản tiếng Việt) — tổng quát nhất
   - `taste-skill` — chống "AI slop", hướng premium
   - `impeccable` — 24 lệnh polish/audit + 61 detector rule
3. **shadcn/ui** cho component React; **Storybook** để phát triển độc lập;
   **Playwright** test e2e; **liquid-high-fidelity** làm tham chiếu hiệu ứng

### 5.4 AI nâng cao (dài hạn)

- `awesome-llm-apps-main/rag_tutorials/` — ~30 bài RAG: "chat với slide/tài liệu"
  cho SlideCraft (Local RAG, CRAG, GraphRAG…)
- `langchain-master` — nâng SlideCraft từ gọi Groq đơn lẻ → agent có tool/memory
- `always_on_agents/` — agent chạy nền (ví dụ: tự tổng hợp tin mỗi sáng vào slide)

### 5.5 Mẹo kỹ thuật đã học

- **Terminal trong phiên này**: shell integration hay không quan sát được kết quả →
  dùng cách `... | Out-File -FilePath <file> -Encoding utf8` rồi đọc file
- **Tên thư mục đặc biệt**: `HTMLHint-main/HTMLHint-main` (lồng cấp 2);
  `liquid-high-fidelity/liquid-high-fidelity-html/` (chỉ có index.html + video.mp4)
- **Awesome-llm-apps ở nhánh 2026**: skills dùng chuẩn `SKILL.md` (agentskills.io),
  cài 1 lệnh `npx skills add`, chấm điểm qua evals CI trước khi phát hành

---

*Ghi chú bởi Cline — trạng thái: đã khảo sát 17/17 dự án trong `skill AI/`.*
---

## Cập nhật học tập ngày 30/10/2026

Thư mục hiện có 34 bộ và 299 tệp `SKILL.md`, bao gồm bản trùng, chuyển hướng và fixture. Phần khảo sát 17 bộ phía trên được giữ như ghi chú lịch sử; các con số benchmark/phiên bản và kết quả cũ không được coi là đã kiểm chứng lại.

Xem [sổ học tập mới](../tasks/skill-ai-study/README.md), [bản đồ 34 bộ](../tasks/skill-ai-study/REPO_MAP.md) và [cách áp dụng vào PP](../tasks/skill-ai-study/AP_DUNG_CHO_PP.md). Lượt mới đọc sâu 20 hồ sơ skill được chọn, đối chiếu tài liệu/mã liên quan và ghi rõ giới hạn. Chưa đọc toàn bộ từng dòng nguồn hoặc chạy mọi ứng dụng trong kho.
