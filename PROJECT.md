# Project: SlideVault Mobile & Tablet UI Overhaul

## Architecture
SlideVault is a client-side presentation management and AI studio web application designed with an Apple VisionOS Liquid Glass design system. The application comprises 23 HTML pages (19 at root, 4 under 3dtouch/) sharing a centralized styling and behavior layer:
- `tệp hệ thống/glass-theme.css`: Core design system, VisionOS glass panels, responsive breakpoints, drawer transitions, and scroll/dock animations.
- `tệp hệ thống/glass-theme.js`: Client-side controllers for mobile navigation, scroll-driven compacting, drawer gestures, modal observers, and UI interactions.
- `phone.html`: Dedicated SlideVault Vision Remote application encapsulating 3D Touchpad, Gyro Air Mouse, Virtual Laser, MediaPipe Hand Tracking, and remote presentation controls.
- `trangchudong.html` & `index.html`: Core homepage with strict byte-for-byte SHA-256 invariance parity.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Remove/Suppress Thanh Số 3 & Floating Buttons | Clean up legacy dynamicMobileIsland JS/CSS, hide `#floatingQuickCamAi` on mobile (<1024px) on `index.html`, `trangchudong.html`, `AI.html`. | M1 | R1, Survey 1 & 2 |
| 2 | Spatial Feature Isolation to phone.html | Ensure 3D Spatial Touch, Chuột bay Air Mouse, and Laser ảo are strictly scoped to `phone.html` and do not inject overlays into main content pages. | M1 | R1, Survey 2 |
| 3 | Dual-Layer Modal Suppression | CSS `:has()` + JS MutationObserver to unconditionally hide `.mobile-glass-nav` and floating pills whenever any modal (`dialog[open]`, `.modal-open`, etc.) is opened, guaranteeing CTA buttons ("Tải Slide Ngay", "Thêm Vào Giỏ", "Xác Nhận Đã Chuyển Khoản") are 100% visible and clickable. | M1 | R1, Survey 1 & 2 |
| 4 | Bottom Content Clearance & Mobile Dialog Sizing | Add safe area bottom padding to content scroll containers; cap mobile dialogs with `max-height: 85dvh; overflow-y: auto; padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 24px)`. | M1 | R1, Survey 2 |
| 5 | Scroll-Driven Hiding & Restoration Engine | Hide Topbar up (`translateY(-100% - 24px)`) and Bottom Dock down (`translateY(100% + 40px)`) on downward scroll; restore on scroll up. | M2 | R2, Survey 3 |
| 6 | Scroll Stop & Touch End Auto-Restoration | Implement `scrollRestorationTimer` (~1000ms) on scroll stop/touch end in `glass-theme.js` to automatically slide navigation back into standard view. | M2 | R2, Survey 3 |
| 7 | Apple VisionOS Spring Motion Symmetry | Replace jumping `@keyframes` with smooth symmetrical `transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)` for both compact and expand states. | M2 | R2, Survey 3 |
| 8 | 60fps Native Inertial Sidebar Scroll | Eliminate nested scroll container conflict (`.saas-sidebar` set to `overflow: hidden`, inner `nav.sidebar-nav-scroll` set to `-webkit-overflow-scrolling: touch; overscroll-behavior-y: contain;`). | M3 | R3, Survey 3 |
| 9 | Gesture Hijacking Elimination & Swipe-to-Close | Remove `if (isInsideSidebar && isDrawerOpen) return;` block to allow swiping left from inside drawer to close; refine edge detection to avoid hijacking page vertical scroll. | M3 | R3, Survey 3 |
| 10 | Mobile Sidebar Header Streamlining & Touch Targets | Streamline brand header on mobile; enlarge close button `[data-sidebar-close]` from 28px to >= 48px × 48px touch target. | M3 | R3, Survey 3 |
| 11 | Complete 3-Dots Button Eradication | Verify and maintain 0 redundant 3-dots menus across all HTML files and retain CSS suppression rules. | M3 | R3, Survey 1 & 3 |
| 12 | Horizontal Overflow Elimination | Fix `AI.html` topbar overflow on 375px-430px viewports (add `hidden sm:inline` to Camera AI label); ensure `overflow-x: hidden` across all pages. | M4 | R4, Survey 3 |
| 13 | Multi-device Viewport Compatibility | Polish responsive layouts across iPhone 15 Pro (393px), Android (375px-430px), iPad Mini (768px), and iPad Air/Pro (820px-1024px). | M4 | R4, Survey 1, 2, 3 |
| 14 | Invariance Parity (SHA-256 Byte-for-Byte) | Synchronize `trangchudong.html` to `index.html` ensuring identical SHA-256 hash and byte-for-byte binary match. | M4 | R4, Survey 1 & 3 |
| 15 | E2E Opaque-Box Test Suite & Acceptance Gate | Comprehensive opaque-box test suite covering Tiers 1-4, followed by Tier 5 adversarial hardening. | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Bottom UI & Modal Suppression | Features 1, 2, 3, 4 | none | DONE (Verified: Dual-layer CSS :has() + JS observer, 0 bottom occlusion) |
| M2 | Scroll-Driven Engine & VisionOS Spring | Features 5, 6, 7 | M1 | DONE (Verified: 1000ms idle restoration, symmetrical 0.42s VisionOS cubic-bezier) |
| M3 | Sidebar Drawer 60fps & Touch Targets | Features 8, 9, 10, 11 | M1 | DONE (Verified: 60fps inertial scroll, swipe left close, >=48px targets, 0 3-dots) |
| M4 | Multi-Device Compatibility & Invariance | Features 12, 13, 14 | M2, M3 | DONE (Verified: SHA-256 byte parity, 375px-1024px zero overflow) |
| M5 | Final Acceptance & Adversarial Hardening | Feature 15 (100% E2E test pass + Tier 5 coverage) | M4 | DONE (Verified: 160/160 E2E tests + 21/21 stress tests pass, Gate PASS) |

## Interface Contracts
### Modal Controller ↔ Bottom Dock & Overlays
- When any modal opens (native `<dialog open>`, `.modal-open`, or class-based modal), `body` receives `.modal-open` class.
- CSS `:has(dialog[open])`, `body.modal-open`, and `body.sidebar-drawer-open` apply:
  - `.mobile-glass-nav`: `transform: translate3d(-50%, 40px, 0) scale(0.9) !important; opacity: 0 !important; pointer-events: none !important; visibility: hidden !important;`
  - `#floatingQuickCamAi`: `display: none !important;`
  - `#sv-spatial-hud`, `#sv-touchpad-controller`: `display: none !important;`

### Scroll Engine ↔ Topbar & Bottom Dock
- Downward scroll threshold: `diff > 6 && currentScrollY > 40` adds `.topbar-compact` and `.dock-compact`.
- Upward scroll threshold: `diff < -6 || currentScrollY <= 20` removes `.topbar-compact` and `.dock-compact`.
- Scroll stop / touch end: `scrollRestorationTimer` (1000ms idle) removes `.topbar-compact` and `.dock-compact`.
- Transitions: Symmetrical `transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)`.

### Sidebar Drawer ↔ Touch Event Pipeline
- Swipe gesture: Start within drawer -> swipe left with horizontal displacement > 50px and velocity triggers smooth close.
- Scrolling inside drawer: Event flows strictly to `nav.sidebar-nav-scroll` with native `-webkit-overflow-scrolling: touch`.
- Close button: `min-width: 48px; min-height: 48px; display: flex; align-items: center; justify-content: center;`.

### Invariance Rule Contract
- Any change to `trangchudong.html` MUST immediately be mirrored to `index.html`.
- `Get-FileHash index.html, trangchudong.html` must return identical SHA-256 hashes.
- `fc.exe /b index.html trangchudong.html` must return 0 byte differences.

## Code Layout
- `tệp hệ thống/glass-theme.css`: Shared styling, CSS variables, modal suppression rules, scroll animations, responsive breakpoints.
- `tệp hệ thống/glass-theme.js`: Shared JS for scroll engine, sidebar drawer, modal observer.
- `trangchudong.html` & `index.html`: Main homepages (byte-identical pair).
- `AI.html`: AI studio page (chat input area, topbar responsive fix).
- `vault.html`, `thuvienmau.html`, `setting.html`, `security.html`, `phone.html`: Specific feature pages.
- `tests/e2e/`: Automated E2E test suite.
