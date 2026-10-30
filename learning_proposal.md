# Learning Proposal: Mobile Navigation Dock & Touch Scroll Engine Standards

## 1. Executive Summary & Context
In recent mobile viewport (< 1024px) testing, user feedback identified an issue where the mobile bottom slidebar (`.mobile-glass-nav` / `.saas-bottom-dock`) failed to hide ("không thấy mất slidebar điện thoại") and desktop-specific spatial controls occluded the bottom interactive zone. Investigation revealed conflicting CSS rules between `shadcn.css` and `glass-theme.css`, overly rigid scroll thresholds in `glass-theme.js`, and missing responsive utility classes on launcher buttons.

This proposal formalizes 6 core engineering rules for mobile dock architectures, touch scroll physics, and multi-file CSS synchronization.

---

## 2. Identified Anti-Patterns & Root Causes

### Anti-Pattern 1: Lock-in Rules with `!important` Counteracting Dynamic State Classes
- **Root Cause**: `shadcn.css` contained a legacy rule forcing `.mobile-glass-nav.nav-hidden { transform: translateX(-50%) translateY(0) !important; opacity: 1 !important; }`.
- **Impact**: Any script or system attempting to hide the mobile navigation via `.nav-hidden` was forcefully overridden, preventing the bar from ever sliding off-screen.
- **Rule**: Never override state-hiding classes (`.nav-hidden`, `.dock-compact`, etc.) to visible values with `!important`. State classes must have absolute priority in collapsing elements off-screen.

### Anti-Pattern 2: Multi-CSS State Modifier Desynchronization
- **Root Cause**: `glass-theme.css` defined modern VisionOS slide-down transforms for `.dock-compact`, `.nav-compact`, `.nav-shrunk`, and `.nav-scrolling-down`, but `shadcn.css` only specified base positioning (`translateY(0) !important`), creating CSS specificity races.
- **Rule**: When multiple CSS frameworks/layers co-exist, all state modifiers (`.dock-compact`, `.nav-compact`, `.nav-shrunk`, `.nav-scrolling-down`, `.nav-hidden`, `body.sidebar-drawer-open`, `body.modal-open`, `:has(dialog[open])`) must be consistently defined across both style sheets.

### Anti-Pattern 3: Inadequate Touch Scroll Delta Sensitivity
- **Root Cause**: `glass-theme.js` enforced a strict downward scroll threshold `diff > 8 && currentScrollY > 35`. During natural mobile thumb drags, touchmove/scroll delta per frame is typically between 2px and 5px.
- **Impact**: Users dragging smoothly never exceeded the 8px threshold, causing the engine to fall into the `else` branch and continuously schedule un-hiding timers.
- **Rule**: Mobile scroll thresholds must incorporate a responsive deadband (e.g. `diff > 4`) that filters micro-jitter while promptly triggering immersive auto-hiding during natural scrolling.

### Anti-Pattern 4: Single-Property Scroll Offset Querying
- **Root Cause**: `currentScrollY` evaluated only `window.scrollY || document.documentElement.scrollTop || 0`, ignoring `document.body.scrollTop`.
- **Impact**: In certain mobile WebKit engines (iOS Safari and Android WebViews), `window.scrollY` and `document.documentElement.scrollTop` evaluate to 0 while `document.body.scrollTop` tracks scrolling, effectively deadlocking the auto-hide engine.
- **Rule**: Always query `(window.scrollY || document.documentElement.scrollTop || (document.body ? document.body.scrollTop : 0) || 0)`.

### Anti-Pattern 5: Relying Exclusively on CSS Media Queries for Desktop Floating Controls
- **Root Cause**: `#floatingQuickCamAi` in `index.html` was declared with `flex items-center` without `hidden lg:flex`. Even though CSS hid it on `< 1024px`, initial paint / FOUC or style calculation delays caused bottom area visual overlap.
- **Rule**: Desktop-exclusive floating controls must have `hidden lg:flex` (or `hidden lg:block`) baked directly into the static HTML markup.

### Anti-Pattern 6: Entrypoint Invariance Drift
- **Root Cause**: Changes applied to `index.html` were not simultaneously verified byte-for-byte against `trangchudong.html`.
- **Rule**: `index.html` and `trangchudong.html` must maintain strict cryptographic SHA-256 parity and identical byte length.

---

## 3. Proposed Skill / Rule Updates

### Proposed Addition to `.agents/AGENTS.md` (or relevant skill guide):
```markdown
### Mobile Floating Dock & Scroll Engine Rules
1. **Responsive Suppression**: Desktop-only triggers (3D touch, webcam HUD, laser) must include `hidden lg:flex` in markup.
2. **Unified State Mapping**: Both `shadcn.css` and `glass-theme.css` must define identical transform behavior for:
   `.mobile-glass-nav.nav-hidden`, `.dock-compact`, `.nav-compact`, `.nav-shrunk`, `.nav-scrolling-down`, `body.sidebar-drawer-open`, `body.modal-open`, `body:has(dialog[open])`.
3. **Touch Scroll Delta**: Scroll auto-hide triggers must use `diff > 4` with `document.body.scrollTop` fallback.
4. **Parity Check**: Any commit touching `index.html` must verify SHA-256 match with `trangchudong.html`.
```

---

## 4. Verification Check
- All 160 E2E tests in `tests/e2e/runner.js`: **PASSED (160/160, 100%)**
- All 21 Adversarial Stress tests in `tests/stress_challenger_gen3.js`: **PASSED (21/21, 100%)**
- Cryptographic SHA-256 Parity: **`9CBBA4B92563DCF0FA79B8B492CB2F1AF2B5DD63554DDC11BE9B5F8AF53AA10E` (0 byte difference, 100% identical)**
