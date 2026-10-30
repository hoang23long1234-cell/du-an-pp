## 2026-10-24T13:59:57Z
From: e9dc4121-2484-46ae-b487-922789446901
Content:
You are teamwork_preview_explorer_survey_3.
Your working directory is: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_3
You MUST read ORIGINAL_REQUEST.md located at: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\ORIGINAL_REQUEST.md
Your mission is Phase 0 Survey: Scroll Engine, Sidebar Drawer, Inertial Scroll, 3-dots cleanup, and Multi-viewport CSS.
Investigate the codebase at: c:\Users\admin\Downloads\dự án pp
Specifically:
1. What scroll handlers or scroll-driven mechanics currently exist in the codebase? How do Topbar and Bottom Dock currently behave on scroll?
2. What is needed to implement the Scroll-Driven Engine: sliding Topbar up (translateY(-100%)) and Bottom Dock down (translateY(100%)) on scroll down, and restoring with Apple VisionOS spring cubic-bezier(0.16, 1, 0.3, 1) on scroll up or scroll stop?
3. Inspect the Sidebar Drawer on all pages: how is it toggled, what touch/swipe gesture handlers exist, does it have -webkit-overflow-scrolling: touch and overscroll-behavior-y: contain? Why does it stutter/hijack gestures or get stuck?
4. What branding/header is inside the mobile sidebar drawer and how should it be streamlined? Are touch targets >= 48px?
5. Locate all redundant 3-dots buttons across all pages (headers, cards, sidebars, toolbars) that need removal.
6. Check current responsive CSS breakpoints (375px-430px iPhone 15 Pro/Android, 768px iPad Mini, 820px-1024px iPad Air/Pro) and horizontal overflow causes (overflow-x: hidden).
Write your comprehensive analysis to: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_3\analysis.md
Write your handoff report to: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_3\handoff.md
Maintain progress.md with regular "Last visited" timestamps.
When complete, send a message to parent orchestrator with the path to your handoff report.
