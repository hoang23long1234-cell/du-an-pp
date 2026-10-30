# Phạm vi học và cách kiểm chứng

Ngày: 30/10/2026. Danh mục là kết quả kiểm kê tự động; phần học sâu là các nguồn được đọc để hiểu quy trình, so sánh ngoại lệ và liên hệ với PP. Không suy rộng từ một file skill sang toàn bộ repository. Các tài liệu và phiên bản dưới đây là bản cục bộ tại thời điểm đọc.

`read-log.json` ghi lại các lượt công cụ được yêu cầu hiển thị nội dung, có cả lượt lặp. Các lượt đầu có đầu ra quá dài đã được đọc bổ sung ở những phần cần dùng; nhật ký không tự xác nhận sự hiểu biết. Danh sách dưới đây giúp tìm đúng nguồn để kiểm tra lại.

## Nguồn hồ sơ và tài liệu bổ trợ

| Source | Reading scope |
|---|---|
| `skill AI/SkillSpector-main/skills/skill-inspector/SKILL.md` | Selected skill dossier, full body |
| `skill AI/SwiftUI-Agent-Skill-main/skills/swiftui-expert-skill/SKILL.md` | Selected skill dossier, full body |
| `skill AI/awesome-llm-apps-main/agent_skills/scope-creep-detector/SKILL.md` | Selected skill dossier, full body |
| `skill AI/code-review-graph-staging/skills/refactor-safely/SKILL.md` | Selected skill dossier, full body |
| `skill AI/code-review-graph-staging/skills/review-changes/SKILL.md` | Selected skill dossier, full body |
| `skill AI/context7-master/skills/context7-mcp/SKILL.md` | Selected skill dossier, full body |
| `skill AI/gsap-skills-main/skills/gsap-performance/SKILL.md` | Selected skill dossier, full body |
| `skill AI/impeccable-main/.agents/skills/impeccable/SKILL.md` | Selected skill dossier, full body |
| `skill AI/impeccable-main/.agents/skills/impeccable/reference/craft-floor.md` | Supporting document/source, full body |
| `skill AI/impeccable-main/.agents/skills/impeccable/reference/operate.md` | Supporting document/source, full body |
| `skill AI/skills-main/skills/frontend-design/SKILL.md` | Selected skill dossier, full body |
| `skill AI/skills-main/skills/mcp-builder/SKILL.md` | Selected skill dossier, full body |
| `skill AI/skills-main/skills/pptx/SKILL.md` | Selected skill dossier, full body |
| `skill AI/skills-main/skills/webapp-testing/SKILL.md` | Selected skill dossier, full body |
| `skill AI/superpowers-main/skills/systematic-debugging/SKILL.md` | Selected skill dossier, full body |
| `skill AI/superpowers-main/skills/test-driven-development/SKILL.md` | Selected skill dossier, full body |
| `skill AI/superpowers-main/skills/verification-before-completion/SKILL.md` | Selected skill dossier, full body |
| `skill AI/taste-skill-main/skills/redesign-skill/SKILL.md` | Selected skill dossier, full body |
| `skill AI/ui-main/skills/shadcn/SKILL.md` | Selected skill dossier, full body |
| `skill AI/ui-ux-pro-max-skill-main/.claude/skills/design-system/SKILL.md` | Selected skill dossier, full body |
| `skill AI/ui-ux-pro-max-skill-main/.claude/skills/slides/SKILL.md` | Selected skill dossier, full body |
| `skill AI/ui-ux-pro-max-skill-main/.claude/skills/ui-ux-pro-max/SKILL.md` | Selected skill dossier, full body |
| `skill AI/ui-ux-pro-max-skill-main/.claude/skills/ui-ux-pro-max/scripts/search.py` | Supporting document/source, full body |

## Additional targeted sources

| Source | Reading scope |
|---|---|
| `skill AI/playwright-main/docs/src/best-practices-js.md` | Sections: user-visible behavior, isolation, locators, web-first assertions |
| `skill AI/playwright-main/docs/src/api/params.md` | Entries discouraging networkidle for testing |
| `skill AI/playwright-main/docs/src/api/class-page.md` | waitForTimeout guidance |
| `skill AI/mediapipe-master/mediapipe/tasks/web/vision/hand_landmarker/hand_landmarker.ts` | detect/detectForVideo API and implementation, lines 225-270 |
| `skill AI/mediapipe-master/mediapipe/tasks/web/vision/core/vision_task_runner.ts` | Image/video mode checks; timestamp and close references |
| `skill AI/awesome-llm-apps-main/rag_tutorials/qwen_local_rag/README.md` | Document processing, retrieval and optional web fallback |
| `skill AI/awesome-llm-apps-main/rag_tutorials/qwen_local_rag/qwen_local_rag_agent.py` | Imports and first 240 lines: state, embedding and document processing |
| `skill AI/awesome-llm-apps-main/rag_tutorials/rag_failure_diagnostics_clinic/README.md` | Purpose and P01-P12 failure-pattern table |
| `skill AI/private-gpt-main/private_gpt/components/workflows/retrieval/retrieval.py` | First 180 lines: events, retrieval, empty result, progress and postprocessing boundary |
| `skill AI/cursor-designer-main/.cursor/rules/core/design-core.mdc` | Core UX/UI/IA principles |
| `skill AI/cursor-designer-main/.cursor/rules/frontend/ux-flows-and-feedback.mdc` | Feedback, errors and progressive disclosure |
| `skill AI/storybook-next/code/lib/codex-plugin/plugins/storybook/skills/stories/SKILL.md` | Whole short dossier; prerequisites are Storybook-specific |
| `skill AI/storybook-next/.agents/skills/principle-encode-lessons-in-structure/SKILL.md` | Whole short dossier; structural prevention of recurring errors |
| `skill AI/taste-skill-main/skills/taste-skill/SKILL.md` | First 100 lines and targeted headings; scope/presets, not all 1206 lines |
| `skill AI/ui-ux-pro-max-skill-main/.claude/skills/slides/references/layout-patterns.md` | First 85 lines: HTML slide layout patterns |
| `skill AI/gsap-skills-main/skills/gsap-core/SKILL.md` | Selected lifecycle and responsive/reduced-motion section |
| `skill AI/liquid-high-fidelity/liquid-high-fidelity-html/index.html` | Theme tokens, view transitions and selected CSS |
| `skill AI/cursor-rules-and-prompts-main/LICENSE` | Opening license restrictions; no installation or reuse performed |
| `skill AI/skills-main/skills/pptx/LICENSE.txt` | Opening terms; file-specific terms differ from repository-wide claims |

## Verification record

- Top-level repositories: 34.
- SKILL.md files catalogued: 299.
- Byte-distinct SHA-256 contents: 266.
- Paths flagged as test/fixture/example: 38 (path heuristic; categories overlap).
- Main selected skill dossiers fully requested/read: 20; additional full supporting sources: 3.
- Four local UI search invocations, including --help, recorded in practical-checks.json.
- Not run: full repository test suites, all browser/native/cloud apps, model benchmarks, camera device tests, or a repository-wide security scanner.
- Before implementation, re-open current project code and confirm official documentation for the installed version.
