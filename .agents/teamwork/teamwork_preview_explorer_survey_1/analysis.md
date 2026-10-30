# Phase 0 Survey: Codebase & File Architecture Report
**Project:** SlideVault (Apple VisionOS × Obsidian Aurora UI Suite 2026)  
**Investigator:** `teamwork_preview_explorer_survey_1`  
**Timestamp:** 2026-10-24T14:24:00Z  
**Root Working Directory:** `c:\Users\admin\Downloads\dự án pp`  
**Integrity Mode:** Development  

---

## Executive Summary
This survey establishes an exhaustive, byte-verified architectural catalog of the SlideVault web application. Across the repository, **23 HTML pages** (19 root-level pages and 4 submodule pages in `3dtouch/`) were identified, analyzed, and mapped. 

Key architectural findings:
1. **Invariance Rule (R4) Verification:** `index.html` and `trangchudong.html` have been proven **100% byte-for-byte identical**. Both share the exact SHA-256 hash `B2FB0551120D44F05588F1BA581002C98C1C178366F323D977BE1FF80EDB7722` and file length `98,755 bytes`. Binary difference comparison (`fc.exe /b`) yielded 0 discrepancies.
2. **Layout Architecture:** 11 core SaaS application pages share a unified VisionOS Shell architecture (`saas-layout-wrapper`, `#saasAppSidebar`, `header.saas-topbar`, `nav.mobile-glass-nav`, and `[data-sidebar-backdrop]`).
3. **Thanh Số 3 (dynamicMobileIsland) Status:** The legacy markup `<aside id="dynamicMobileIsland">` has been removed from all 11 core application pages. However, residual CSS and JS listeners remain in `tệp hệ thống/glass-theme.js` and `glass-theme.css`, and a floating camera launcher pill (`#floatingQuickCamAi`) remains anchored at `bottom-24` on 3 pages (`index.html`, `trangchudong.html`, `AI.html`).
4. **Modal Suppression Gap Identified:** While `.mobile-dynamic-island` had CSS suppression rules for `body.modal-open` and `body:has(.modal:not(.hidden))`, the active bottom navigation bar (`.mobile-glass-nav`) is **not** currently suppressed during modal display, leading to potential touch collision and occlusion of bottom CTA buttons ("Tải xuống", "Thanh toán QR") on mobile screens.
5. **Redundant 3-Dots Eradication:** A full regex audit confirmed 0 occurrences of `more-vertical`, `more-horizontal`, or `ellipsis` iconography across all HTML files.

---

## 1. Inventory of All HTML Pages

The project contains a total of **23 HTML pages** organized into 5 functional categories:

| # | File Path | File Size | Line Count | SHA-256 Hash | Page Title & Primary Architectural Purpose |
|---|---|---|---|---|---|
| **Category 1: Core SaaS Application Suite (11 Pages)** |
| 1 | `index.html` | 98,755 B | 1,621 | `B2FB0551120D44F05588F1BA581002C98C1C178366F323D977BE1FF80EDB7722` | **SlideVault Master Stage** (Hero Cinema Stage, Bento Grid, VIP Templates; Invariance twin with trangchudong) |
| 2 | `trangchudong.html` | 98,755 B | 1,621 | `B2FB0551120D44F05588F1BA581002C98C1C178366F323D977BE1FF80EDB7722` | **SlideVault Dynamic Homepage** (Source of truth for main landing experience) |
| 3 | `vault.html` | 120,114 B | 1,916 | `D9D386DFDF1CC748DF2B871B661775B4B9A19470390BFA9F9443D76D27381CEC` | **Vault Của Tôi** (Slide library management, atomic storage, 16:9 canvas workflow, offline PPTX export) |
| 4 | `thuvienmau.html` | 64,533 B | 1,029 | `FF2655A1FEA4460108CA1DC5BE959ED5F3C6CFCDC48FF70FC01F4F421568F36A` | **Thư Viện Mẫu Slide** (50+ curated templates, filter pills, interactive preview modals) |
| 5 | `AI.html` | 237,307 B | 3,948 | `AA5AD000F0F2BA8D4089F61101748EC20391A90BEC1D034C287E99C610060969` | **Canva Magic AI Studio** (Keynote AI presentation architect, multi-turn LLM chat, slide deck generation) |
| 6 | `phoimau.html` | 57,198 B | 993 | `3DCD23AE0EC8BE66BC39CBF5258BCE2AC9F552F59A473824448A37FADD694BA5` | **Phối Màu 1-Click AI** (Color harmony generator, palette previewer, contrast ratio inspector) |
| 7 | `vebieudonhanh.html` | 74,553 B | 1,343 | `917B670E20E6330F15215083FA4E4BACE9AC47E813E6A2B04934FF635785A995` | **Vẽ Biểu Đồ Nhanh** (KPI, bar, line, radar, donut chart generation for slides) |
| 8 | `vanban.html` | 60,746 B | 937 | `34C305055643E7733DB07A4A92AE00F0B71B392375AB4E0F3130F035097E4CE1` | **Văn Bản Sang Slide AI** (Markdown/document structural summarization and slide outline extractor) |
| 9 | `trinhchieuchiase.html` | 52,169 B | 907 | `AC346CBAF2E2B1F3AD3CA6DBBB457931A91D336C22ACB0022A31CBACE4045DED` | **Trình Chiếu & Chia Sẻ** (AI presentation rehearsal coach, teleprompter, live spectator link) |
| 10 | `setting.html` | 92,193 B | 1,551 | `B4233A9359FDCD3611BDEE993145F3DBED983A1ADC9A7DECE9BA8695373EC3B7` | **Cài Đặt Hệ Thống** (API keys management, AI models selection, theme & typography customization) |
| 11 | `security.html` | 125,068 B | 2,041 | `4C2914D774AB90845DC414A4D235A12C4B4AD8D8743F6EF4F9C3264F53B65A28` | **SlideVault Security Center** (Defense shield status, real-time intrusion monitoring, audit logs) |
| **Category 2: Authentication & Account Portals (3 Pages)** |
| 12 | `dangnhap.html` | 51,184 B | 884 | `02940536B1287D740B13A8C0F0CAAA16139CE3B6860812ECC381D3A4EDA7DA1F` | **Đăng Nhập Tài Khoản** (Standalone login card, Supabase Auth integration, OAuth providers) |
| 13 | `dangki.html` | 75,906 B | 1,291 | `9DADDD03913165604CC2D43F198AC7986A10F37C72EDAA64DE6B70BC0F87C59F` | **Đăng Ký Tài Khoản VIP** (VIP tier signup, tiered benefits showcase, Supabase user onboarding) |
| 14 | `khoiphuctaikhoan.html` | 48,459 B | 848 | `8758E22FCD68E368616CC8E55F0972FE16FF3B40FB95747B1C254DCB36AD8268` | **Khôi Phục Tài Khoản** (Password reset, OTP verification, security question recovery flow) |
| **Category 3: Dedicated Mobile & Remote Control Experiences (3 Pages)** |
| 15 | `phone.html` | 63,724 B | 1,411 | `8053172CC4BB494A372ED3184F1502F8441BEED60620DEBA242EEA888DE7EE4A` | **SlideVault Vision Remote VIP** (Mobile controller: 3D Touch Trackpad HUD, Virtual Laser, Air Mouse, PeerJS LAN P2P) |
| 16 | `phoneindex.html` | 16,352 B | 316 | `E862FE0CDBFC10FB9C3F281FB1D0DA349A51518035B34E95444551E4D6E89E6B` | **Liquid High-Fidelity Mobile Architecture** (Mobile-first test harness and performance sandbox) |
| 17 | `mobile-connect.html` | 10,398 B | 196 | `9D61CE6F529A31D8787A362E79B809CF959A4BF43D3140B12643EC222947CC1F` | **Cổng Kết Nối Thử Nghiệm Điện Thoại** (QR code presentation pairing portal, test links) |
| **Category 4: Administrative & Fallback System Pages (2 Pages)** |
| 18 | `service-admin.html` | 52,480 B | 884 | `CA6DF91BACF984C78907BF04CA23B82BD51BAF8B0454C9230EB588308B9DBB41` | **Admin Control Center** (Database health metrics, user quota inspection, API traffic) |
| 19 | `404.html` | 9,334 B | 158 | `7E5AC9C90DE89C5131BD3D33E89CE7F8669D512ADCB15803F99B3F7C6584D243` | **404 Không Tìm Thấy Trang** (Liquid glass styled 404 error page with navigation shortcuts) |
| **Category 5: 3D Touch Submodule (`3dtouch/`, 4 Pages)** |
| 20 | `3dtouch/dieukhien.html` | 76,465 B | 1,328 | `207E4CEC5FDE5598FA665148FDAD6895D86826460CC07EA818000B27625B9456` | **SlideVault Motion** (TensorFlow.js + MediaPipe HandPose webcam-based touchless gesture controller) |
| 21 | `3dtouch/phone.html` | 19,039 B | 363 | `2C0AF50EE335B0BB19651D938D040F9401346ACAE6030A238AC22EDE565881BB` | **Touch Remote Controller** (Lightweight remote client for mobile browser touch interaction) |
| 22 | `3dtouch/share.html` | 25,196 B | 497 | `D4A5E186A9253F3D91FB474B845AE57C339C03981EAA7849DB58D07E2263A403` | **AirShare** (Gesture-driven peer-to-peer file transfer and presentation broadcast) |
| 23 | `3dtouch/tutorial.html` | 21,823 B | 419 | `DE236EC9B0830E28202C4A1200DF7C290C6F7F708E303150D3A0A1E6544B085A` | **Hướng Dẫn Sử Dụng 3D Touch** (Interactive interactive visual walkthrough of 3D spatial gestures) |

> **Note on `fix.html`:** The path `c:\Users\admin\Downloads\dự án pp\fix.html` is **not** an HTML file. It is a maintenance/scripting directory containing 78 test scripts, audit utilities, and JSON stores.

---

## 2. Shared Stylesheets, Scripts, Inline Blocks & Assets Mapping

### A. Shared Stylesheets
The codebase avoids remote CSS dependencies where possible, relying on a unified local styling layer:

| Stylesheet Reference | Inclusions | Role & Version Details |
|---|---|---|
| `tệp hệ thống/glass-theme.css` | 21 pages | **Primary Design System.** Houses VisionOS Liquid Glass styling, glass surface tokens, backdrop-filter rules, and dual-bar scroll animations. Uses cache-busting query `?v=visionos-v75` on 11 core SaaS pages, and `?v=visionos-linear-v70` on secondary pages. |
| `tệp hệ thống/tailwind-shadcn/shadcn.css` | 14 pages | **Component Primitives.** Provides shadcn/ui-inspired CSS variables for dark/light themes, border radiuses, button states, and badge styles. |
| `font/fonts.css` | 17 pages | **Local Font Manifest.** Loads `Be Vietnam Pro`, `Space Grotesk`, `Inter`, and `Montserrat` directly from the local `font/` directory with zero CDN latency. |
| `3dtouch/mobile-optimization.css` | 14 pages | **Mobile Touch Physics.** Injected on mobile & SaaS pages (`?v=mobile-4` and `?v=mobile-5` on `phone.html`) to configure viewport sizing, tap-highlight suppression, and touch manipulation properties. |
| `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css` | 6 pages | Legacy icon font included on `dangki.html`, `dangnhap.html`, `khoiphuctaikhoan.html`, `phone.html`, `security.html`, and `service-admin.html`. |
| `https://fonts.googleapis.com/...` | 3 pages | Fallback web fonts loaded in `404.html`, `AI.html`, and `security.html`. |

### B. Shared JavaScript Libraries & Utilities

| Script Reference | Inclusions | Functional Architecture |
|---|---|---|
| `tệp hệ thống/anti-crash-client.js` | **23 pages (100%)** | **Universal Error Boundary & Resilience Client.** Intercepts unhandled promise rejections, window runtime errors, displays self-healing toast notices, and guarantees Zero-Crash operations. |
| `tệp hệ thống/glass-theme.js` | 21 pages | **Master UI Orchestrator.** Handles theme toggling (Dark/Light), Sidebar drawer open/close/collapse, Scroll-driven dual-bar scaling, Command Palette (`⌘K`), and Cart modal toggling. Versioned with `?v=visionos-v75` on core pages. |
| `tệp hệ thống/tailwind-shadcn/tailwind.min.js` | 18 pages | Client-side Tailwind CSS JIT compilation runtime. |
| `tệp hệ thống/tailwind-shadcn/lucide.min.js` | 18 pages | Offline Lucide icon pack renderer via `lucide.createIcons()`. |
| `tệp hệ thống/tailwind-shadcn/shadcn.js` | 14 pages | Interactive behaviors for dialogs, tabs, dropdowns, and toast containers. |
| `tệp hệ thống/tailwind-shadcn/tailwind.config.js` | 14 pages | Custom design token configuration (colors: emerald, champagne rose, indigo, obsidian background, custom shadows). |
| `tệp hệ thống/supabase.min.js` & `auth-state.js` | 12 pages | Offline Supabase JS Client v2 and session state persistence engine for user profiles, VIP permissions, and authentication sync. |
| `3dtouch/touch-control.js` | 13 pages | Spatial gesture engine (`?v=spatial-ultra-v70`) handling virtual force touches and 3D gestures. |
| `fix.html/security_shield.js` | 10 pages | DOM Sanitization, XSS mitigation, and safe HTML injection interceptor. |
| `pptxgen.bundle.js` / `fix.html/pptxgen.bundle.js` | 4 pages | Client-side native Microsoft PowerPoint (.pptx) binary generator. |
| `3dtouch/vision-engine.js` | 4 pages | Computer vision engine for hand tracking on `phone.html`, `AI.html`, `3dtouch/share.html`, and `3dtouch/tutorial.html`. |
| `https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js` | 2 pages | WebRTC P2P networking for LAN/WAN remote presentation control on `phone.html` and `3dtouch/phone.html`. |

### C. Inline Style & Script Footprint Analysis

| Page | Inline `<style>` Blocks | Total Inline Style Size | Inline `<script>` Blocks | Total Inline Script Size | Primary Inline Functionality |
|---|---|---|---|---|---|
| `AI.html` | 1 block | 9,375 B | 3 blocks | 134,619 B | AI Chat prompt handling, slide parser, live markdown rendering, streaming LLM simulation |
| `security.html` | 1 block | 7,950 B | 5 blocks | 38,090 B | Real-time security telemetry graphs, incident log generator, shield health simulator |
| `vault.html` | 1 block | 5,098 B | 3 blocks | 33,816 B | Presentation pipeline modal, deck search/filter, batch PPTX export, local storage sync |
| `index.html` / `trangchudong.html` | 1 block | 612 B | 2 blocks | 40,347 B | Bento grid interactions, category filtering, cart management, demo slide downloading |
| `phone.html` | 1 block | 9,468 B | 2 blocks | 32,959 B | Vision Remote HUD, 3D trackpad coordinates, laser pointer, gyro orientation listener |
| `vebieudonhanh.html` | 1 block | 452 B | 2 blocks | 24,486 B | SVG Chart generator, data table input sync, color scheme applicator |
| `dangki.html` | 2 blocks | 10,072 B | 5 blocks | 27,738 B | Password strength evaluator, VIP tier selector, registration form validator |
| `dangnhap.html` | 1 block | 5,325 B | 4 blocks | 21,242 B | Login authentication callbacks, remember-me persistence, OAuth fallback |
| `service-admin.html` | 4 blocks | 15,385 B | 2 blocks | 18,810 B | Admin monitoring tables, server status toggles, user quota controls |
| `setting.html` | 1 block | 1,683 B | 3 blocks | 17,831 B | Settings state persistence, API key testing, theme customizer |
| `khoiphuctaikhoan.html` | 2 blocks | 9,996 B | 4 blocks | 15,993 B | Recovery token verification, email verification stepper |
| `vanban.html` | 1 block | 452 B | 3 blocks | 12,162 B | Text parser, outline hierarchy indent analyzer, slide preview |
| `trinhchieuchiase.html` | 1 block | 452 B | 2 blocks | 6,832 B | Fullscreen presenter mode, teleprompter scroll, presenter timer |
| `phoimau.html` | 1 block | 452 B | 3 blocks | 6,726 B | 1-Click color scheme generator, hex color copier, palette cards |
| `thuvienmau.html` | 1 block | 452 B | 3 blocks | 4,216 B | Template category switcher, template modal preview trigger |
| `3dtouch/dieukhien.html` | 1 block | 11,394 B | 1 block | 46,421 B | TensorFlow HandPose detection loops, landmark coordinate calculations |
| `3dtouch/share.html` | 1 block | 7,486 B | 1 block | 11,507 B | AirShare gesture broadcasting, file drop handling |
| `3dtouch/tutorial.html` | 1 block | 5,315 B | 1 block | 6,135 B | Step-by-step 3D Touch gesture animation tutorials |
| `3dtouch/phone.html` | 1 block | 12,546 B | 1 block | 1,189 B | Mini remote trackpad touch dispatcher |
| `phoneindex.html` | 2 blocks | 7,748 B | 2 blocks | 2,721 B | Minimal mobile layout test hooks |
| `mobile-connect.html` | 1 block | 505 B | 1 block | 1,222 B | Mobile pairing QR display and IP helper |
| `404.html` | 1 block | 570 B | 1 block | 923 B | Countdown redirect and back-to-home handler |

### D. Asset Directories
- `font/`: Contains local TrueType/WOFF2 font families (`Be_Vietnam_Pro`, `Space Grotesk`, `Inter`, `Montserrat`) and `fonts.css`.
- `hinh anh video/`: Contains media asset `video.mp4` (2.8 MB) used in hero background presentation previews.
- `qrcode_mobile.png`: Local QR code (2.7 KB) used in `mobile-connect.html` for pairing phones to the desktop presentation.
- `assets/css/`, `assets/js/`, `assets/img/`: Empty directories; all active assets have been centralized into `tệp hệ thống/` and `font/`.

---

## 3. Byte-Level Verification of `index.html` vs `trangchudong.html`

Requirement R4 dictates absolute source code invariance between `index.html` and `trangchudong.html`. 

### Verification Commands & Results:
1. **PowerShell `Get-FileHash -Algorithm SHA256`:**
   - `index.html`: `B2FB0551120D44F05588F1BA581002C98C1C178366F323D977BE1FF80EDB7722`
   - `trangchudong.html`: `B2FB0551120D44F05588F1BA581002C98C1C178366F323D977BE1FF80EDB7722`
2. **File Size Check:**
   - `index.html`: `98,755 bytes`
   - `trangchudong.html`: `98,755 bytes`
3. **Binary File Comparison (`fc.exe /b`):**
   ```
   Comparing files .\index.html and .\TRANGCHUDONG.HTML
   FC: no differences encountered
   ```
4. **Architectural Role & Synchronization Mechanism:**
   `trangchudong.html` represents the canonical master copy of the dynamic homepage. Whenever changes are made to `trangchudong.html`, `index.html` is overwritten with the exact byte content to guarantee that users landing on the root domain (`/index.html` or `/`) experience identical layout, functionality, and performance without redirects.

**Conclusion:** The Invariance Rule is **100% satisfied**. There are **zero differences** between the two files.

---

## 4. Layout Architecture & Component Relationships

The SlideVault project employs a shared component layout across its 11 core SaaS pages:

```
+-----------------------------------------------------------------------------------------+
| [data-sidebar-backdrop] (Fixed Backdrop Overlay for Mobile Drawer)                     |
+-----------------------------------------------------------------------------------------+
| .saas-layout-wrapper                                                                    |
| +-------------------------+ +---------------------------------------------------------+ |
| | aside#saasAppSidebar    | | .saas-main-stage                                        | |
| | (.saas-sidebar)         | | +-----------------------------------------------------+ | |
| | - .sidebar-brand-header | | | header.saas-topbar                                  | | |
| | - [data-sidebar-close]  | | | - [data-sidebar-toggle] (Mobile Menu Button)         | | |
| | - [data-sidebar-collapse] | - Brand Breadcrumb (SlideVault / Page Name)           | | |
| | - nav.sidebar-nav-scroll| | | - Minimalist Search Input (#templateSearchInput)    | | |
| |   * Không Gian          | | | - 3D Touch Switch (#open-hand-control)              | | |
| |   * Công Cụ AI          | | | - Language Selector (VI / EN)                       | | |
| |   * Cài Đặt             | | | - Cart Button ([data-cart-toggle])                  | | |
| | - .sidebar-footer-profile | - User Avatar / Auth Action                           | | |
| |   * User Avatar/Name    | | +-----------------------------------------------------+ | |
| |   * [data-theme-toggle] | |                                                         | |
| |   * Auth Action Button  | | <main> / Page Content Area:                             | |
| |                         | | - Hero Stage / Bento Grid / Studio / Gallery            | |
| |                         | | - Category Filters ("Tất cả", "Gần đây", ...)           | |
| |                         | | - Interactive Cards & Modals                            | |
| +-------------------------+ +---------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
| Floating Fixed Elements:                                                                |
| - nav.mobile-glass-nav (Universal Bottom Dock: Home, Vault, Mẫu, AI Studio, Menu)      |
| - #floatingQuickCamAi (Floating 3D Touch Camera Pill, present on index/trangchu/AI)    |
| - #cartModal (Cart Drawer / Modal)                                                      |
| - #previewModal (Slide Preview Modal)                                                   |
| - #commandPaletteDialog (Spotlight ⌘K Palette)                                          |
+-----------------------------------------------------------------------------------------+
```

### Detailed Component Breakdown:

#### 1. Floating Collapsible Sidebar (`#saasAppSidebar`)
- **Structure:** Encapsulated in `<aside class="saas-sidebar" data-sidebar id="saasAppSidebar">`.
- **Desktop Behavior (`>= 1024px`):** Anchored to the left with dynamic width (260px expanded, 72px collapsed via `.sidebar-collapsed`). Controlled via toggle button (`[data-sidebar-collapse-btn]`) or keyboard shortcut `Ctrl+B`.
- **Mobile Behavior (`< 1024px`):** Transforms into an off-canvas drawer (`transform: translateX(-100%)`). When opened (via `[data-sidebar-toggle]`), it slides smoothly into view (`transform: translateX(0)`), darkens the screen with `[data-sidebar-backdrop]`, and locks body scrolling (`overflow: hidden`).
- **Internal Navigation Tree:** Grouped into 3 sections:
  1. *Không Gian:* Trang chủ (`trangchudong.html`), Vault của tôi (`vault.html`), Thư viện mẫu (`thuvienmau.html`).
  2. *Công Cụ AI:* AI Studio Trực Tiếp (`AI.html`), Văn bản → Slide (`vanban.html`), Phối màu 1-Click (`phoimau.html`), Vẽ biểu đồ nhanh (`vebieudonhanh.html`), Trình chiếu & Chia sẻ (`trinhchieuchiase.html`).
  3. *Cài Đặt & Hệ Thống:* Cài đặt (`setting.html`), Bảo mật (`security.html`).
- **Touch & Scroll Physics:** Employs `-webkit-overflow-scrolling: touch` and `overscroll-behavior-y: contain` to prevent gesture hijacking when scrolling long lists of menu items.

#### 2. Luxury Floating Topbar (`header.saas-topbar`)
- **Structure:** Positioned as `sticky top-2 z-30` inside `.saas-main-stage`.
- **Styling:** Liquid frosted glass (`rgba(10, 16, 28, 0.78)` in dark mode, `backdrop-filter: blur(28px) saturate(200%)`, rounded pills `rounded-full` or `rounded-2xl`).
- **Components:**
  - Left: Hamburger toggle button `[data-sidebar-toggle]`, logo icon, breadcrumb link.
  - Center: Global search input (`#templateSearchInput`) with `⌘K` badge.
  - Right: 3D Touch spatial toggle (`#open-hand-control`), language selector (VI), cart drawer button (`[data-cart-toggle]`), and user profile/auth avatar.
- **Scroll-Driven Scaling:** Listens to window scroll events. On scroll down (`diff > 4 && currentScrollY > 35`), `.topbar-compact` is applied, translating the topbar off-screen (`translateY(calc(-100% - 24px))`) to maximize vertical canvas space. On scroll up or rest (`diff < -4 || currentScrollY <= 20`), the class is removed, springing back via `cubic-bezier(0.16, 1, 0.3, 1)`.

#### 3. Universal Mobile Bottom Dock (`nav.mobile-glass-nav`)
- **Structure:** Injected at the root level before `</body>` across all 11 core SaaS pages:
  ```html
  <nav class="mobile-glass-nav visionos-liquid-glass" aria-label="Điều hướng chính di động">
    <a class="mobile-nav-item" href="trangchudong.html" data-mobile-nav="home">... Trang chủ</a>
    <a class="mobile-nav-item" href="vault.html" data-mobile-nav="vault">... Vault</a>
    <a class="mobile-nav-item" href="thuvienmau.html" data-mobile-nav="templates">... Mẫu</a>
    <a class="mobile-nav-item" href="AI.html" data-mobile-nav="ai">... AI Studio</a>
    <button type="button" class="mobile-nav-item" data-sidebar-toggle>... Menu</button>
  </nav>
  ```
- **Styling & Positioning:** Active on mobile (`@media (max-width: 767.98px)`):
  - `position: fixed !important; bottom: max(14px, calc(8px + env(safe-area-inset-bottom))) !important; left: 50% !important; transform: translateX(-50%); width: min(480px, calc(100vw - 24px)); border-radius: 9999px;`
  - High z-index (`z-index: 1050`).
- **Scroll Response:** Synchronized with the topbar. Scrolling down applies `.dock-compact .nav-compact .nav-shrunk .nav-scrolling-down` which translates the dock down (`translateY(calc(100% + 40px)) scale(0.92)`). Scrolling up removes these classes and triggers `svDockSpringExpand` animation.

#### 4. The "Thanh Số 3" & Floating Buttons State
- **`#dynamicMobileIsland` / `.mobile-dynamic-island`:**
  - Successfully deleted from the HTML code of all 11 core pages.
  - Still present in CSS declarations (`glass-theme.css`, lines 5070-5200) and JS controllers (`initDynamicMobileIsland()` in `glass-theme.js`).
- **`#floatingQuickCamAi`:**
  - A persistent pill button (`Camera AI 3D Touch`) remains hardcoded on 3 pages: `index.html` (line 611), `trangchudong.html` (line 611), and `AI.html` (line 3914).
  - Its position (`fixed bottom-24 right-6 z-40`) sits directly over the right side of mobile viewports, potentially blocking bottom CTAs.

#### 5. Modals & Modal Suppression Analysis
- **Core Modals:**
  - Slide Preview Modal: `#previewModal` in `thuvienmau.html`, `index.html`, `trangchudong.html`.
  - Cart & Checkout Drawer: `#cartModal` and QR payment dialogs.
  - AI Direct Edit Modal: `#directEditModal` in `AI.html`.
  - Command Palette: `#commandPaletteDialog`.
- **Identified Defect:**
  In `glass-theme.css` (lines 5115-5125), `body.modal-open` and `body:has(.modal:not(.hidden))` hide `.mobile-dynamic-island`, but **do not** target `.mobile-glass-nav`. Because `.mobile-glass-nav` has `z-index: 1050`, opening a modal on mobile can result in the bottom dock floating above modal footer action buttons ("Tải xuống .pptx" or "Tiến hành thanh toán"). Adding `.mobile-glass-nav` to the modal suppression selector in `glass-theme.css` and `glass-theme.js` will resolve this issue.

---

## 5. Architectural Recommendations for Phase 1

1. **Modal Suppression Enforcement (R1):**
   Update `tệp hệ thống/glass-theme.css` to include `.mobile-glass-nav` in the modal suppression rule:
   ```css
   body.sidebar-drawer-open .mobile-glass-nav,
   body.drawer-open .mobile-glass-nav,
   body.modal-open .mobile-glass-nav,
   body:has(dialog[open]) .mobile-glass-nav,
   body:has(.modal:not(.hidden)) .mobile-glass-nav {
     transform: translateX(-50%) translateY(calc(100% + 140px)) !important;
     opacity: 0 !important;
     pointer-events: none !important;
   }
   ```
2. **Floating Quick Cam AI Cleanup (R1):**
   Remove or hide `#floatingQuickCamAi` on mobile viewports on `index.html`, `trangchudong.html`, and `AI.html`, keeping 3D Touch and camera features strictly contained within `phone.html`.
3. **AI Chat Studio Bottom Clearance (R1):**
   Ensure `AI.html` `#chatInputArea` container maintains `padding-bottom: max(16px, env(safe-area-inset-bottom))` and automatically slides the bottom dock away whenever `#chatInputArea` is active.
4. **Maintenance of Invariance (R4):**
   Any markup changes applied to `trangchudong.html` must be immediately mirrored byte-for-byte to `index.html`.
