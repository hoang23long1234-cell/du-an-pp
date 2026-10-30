## 2026-10-24T14:41:36Z
You are teamwork_preview_worker_m1_1.
Your working directory is: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_worker_m1_1
You MUST read ORIGINAL_REQUEST.md located at: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\ORIGINAL_REQUEST.md
Also read:
- PROJECT.md: c:\Users\admin\Downloads\dự án pp\PROJECT.md
- Explorer 1 Handoff: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_1\handoff.md
- Explorer 2 Handoff & Analysis: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_2\handoff.md and analysis.md
- Explorer 3 Handoff & Analysis: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_3\handoff.md and analysis.md

Your exclusive write ownership is:
- `tệp hệ thống/glass-theme.css`
- `tệp hệ thống/glass-theme.js`
- `trangchudong.html`
- `index.html`
- `AI.html`
DO NOT touch any other files outside your exclusive ownership.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission: Implement the complete SlideVault Mobile & Tablet UI Overhaul across R1, R2, R3, R4 based on the comprehensive findings and code blueprints in Explorer 2 and Explorer 3 reports:
1. R1 (Bottom UI & Modal Suppression):
   - In `glass-theme.css`: Add comprehensive modal suppression rules so opening ANY modal/dialog (`body:has(dialog[open])`, `body.modal-open`, `body.sidebar-drawer-open`, etc.) immediately and unconditionally hides `.mobile-glass-nav`, `#floatingQuickCamAi`, and spatial overlays (`opacity: 0; pointer-events: none; visibility: hidden; transform: translate3d(-50%, 36px, 0) scale(0.9)`).
   - In `glass-theme.css`: Hide `#floatingQuickCamAi` on mobile viewports (`@media (max-width: 1023px)`). Add safe-area padding at bottom of scroll containers. Cap mobile dialogs with `max-height: 85dvh; overflow-y: auto; padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 24px) !important;` so CTA buttons ("Tải Slide Ngay", "Thêm Vào Giỏ", "Xác Nhận Đã Chuyển Khoản") are 100% visible and clickable.
   - In `glass-theme.js`: Clean up legacy `initDynamicMobileIsland` calls and `dynamicIsland` null queries. Enhance `initModalIsolationObserver` to hook `showModal`/`close` and observe class-based modals (like `#settingLogoutModal`) to guarantee `body.modal-open` is toggled. Ensure `#chatInputArea` on `AI.html` has clear viewport visibility.
2. R2 (Scroll-Driven Engine & Apple VisionOS Spring):
   - In `glass-theme.js`: Implement `scrollRestorationTimer` (~1000ms idle) on scroll stop/touch end so Topbar and Bottom Dock automatically slide back smoothly into standard position.
   - In `glass-theme.css`: Eliminate keyframes jump at `-2px`/`4px`. Standardize on symmetrical `transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)` for both compact and expand states.
3. R3 (Sidebar Drawer 60fps & Touch Targets & 3-Dots Cleanup):
   - In `glass-theme.css`: Fix nested scroll stutter — set outer `.saas-sidebar` to `overflow: hidden !important;`, and inner `nav.sidebar-nav-scroll` to `overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; overscroll-behavior-y: contain !important;`.
   - In `glass-theme.js`: Allow swiping left from inside the sidebar drawer to close it (remove the blocking `if (isInsideSidebar && isDrawerOpen) return;`). Refine left edge detection threshold to prevent gesture hijacking of vertical page scroll.
   - Enlarge `data-sidebar-close` button on `trangchudong.html` (and sync to `index.html`) so touch target is >= 48px × 48px (`min-w-[48px] min-h-[48px] flex items-center justify-center`). Ensure all menu items meet >= 48px touch target.
   - Verify 0 3-dots buttons exist.
4. R4 (Invariance Rule & Multi-Device Compatibility):
   - In `AI.html`: Add `hidden sm:inline` to the Camera AI 3D Touch label in the Topbar (lines 537-541) to eliminate horizontal overflow on 375px-430px viewports. Ensure `overflow-x: hidden`.
   - INVARIANCE REQUIREMENT: Copy the modified `trangchudong.html` byte-for-byte to `index.html`. Verify with `Get-FileHash -Algorithm SHA256 index.html, trangchudong.html` and `fc.exe /b index.html trangchudong.html` that both files have 100% identical SHA-256 hashes and 0 byte differences.
5. Verification:
   - Run tests and verification scripts to confirm syntax, hashes, and functionality.
   - Write your handoff report to: c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_worker_m1_1\handoff.md
   - When complete, send a message to parent orchestrator with the path to your handoff report.
