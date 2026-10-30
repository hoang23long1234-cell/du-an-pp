# Orchestrator Execution Plan

## Objective
Execute complete overhaul of SlideVault mobile and tablet UX across R1, R2, R3, R4, maintaining 100% SHA-256 byte parity between index.html and trangchudong.html.

## Phase 0: Survey (Parallel Investigation)
- [ ] Dispatch Explorer 1: Codebase structure, inventory of HTML files (trangchudong.html, index.html, vault.html, thuvienmau.html, AI.html, setting.html, security.html, phone.html, etc.), shared CSS/JS assets.
- [ ] Dispatch Explorer 2: Existing bottom docks, dynamicMobileIsland (thanh số 3), phone.html integration, modal structures (slide preview, cart, QR checkout) and how modal suppression should be wired.
- [ ] Dispatch Explorer 3: Scroll-driven engine mechanics, Topbar/Dock visibility logic, Sidebar drawer implementation, inertia scroll (-webkit-overflow-scrolling, overscroll-behavior-y), and 3-dots buttons.
- [ ] Aggregate findings into `PROJECT.md` (Feature Inventory, Architecture, Interface Contracts, Code Layout).

## Phase 1: Test Infrastructure Track (E2E Testing Track)
- [ ] Set up `TEST_INFRA.md` and opaque-box test runner covering Tiers 1-4.
- [ ] Publish `TEST_READY.md`.

## Phase 2: Implementation Track (Milestones)
- Milestone 1: Bottom UI & Modal Suppression (R1)
- Milestone 2: Scroll-Driven Engine with Apple VisionOS Spring Animation (R2)
- Milestone 3: Sidebar Drawer 60fps Inertial Scroll & 3-dots Cleanup (R3)
- Milestone 4: Invariance & Multi-device Viewport Compatibility (R4)
- Final Milestone: Pass 100% E2E tests + Phase 2 Adversarial Coverage Hardening (Tier 5)

## Phase 3: Forensic Audit & Sentinel Delivery
- Clean Forensic Audit across all modified files.
- Delivery report to Sentinel.
