# Báo Cáo Khảo Sát Kỹ Thuật Chi Tiết (Phase 0 Survey)
## Đề tài: Scroll Engine, Sidebar Drawer, Inertial Scroll, Dọn Dẹp 3-Dots & CSS Đa Khung Nhìn (Multi-Viewport)

**Tác nhân thực hiện**: `teamwork_preview_explorer_survey_3`  
**Dự án**: SlideVault Pro (c:\Users\admin\Downloads\dự án pp)  
**Thời gian hoàn thành**: 2026-10-24T14:40:00Z  
**Tính toàn vẹn mã nguồn**: Đồng bộ tuyệt đối giữa `trangchudong.html` và `index.html` (SHA-256: `B2FB0551120D44F05588F1BA581002C98C1C178366F323D977BE1FF80EDB7722`).

---

## 1. Cơ Chế Cuộn Hiện Tại & Hành Vi Của Topbar / Bottom Dock (Question 1)

### 1.1 Vị trí mã nguồn và cơ chế lắng nghe sự kiện
- **Tập tin trung tâm**: `tệp hệ thống/glass-theme.js` (dòng 1301 - 1361).
- **Trình lắng nghe sự kiện**:
  ```javascript
  // Dòng 1354-1360
  window.addEventListener('scroll', (e) => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => updateMobileNavScale(e));
      scrollTicking = true;
    }
  }, { passive: true, capture: true });
  ```
- **Hàm xử lý `updateMobileNavScale(e)`** (dòng 1311 - 1352):
  - Lấy vị trí cuộn: `const currentScrollY = target ? target.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0);`
  - Tính toán độ chênh lệch: `const diff = currentScrollY - lastScrollY;`
  - Các phần tử tác động:
    - Topbar: `.saas-topbar, header.saas-topbar`
    - Bottom Dock: `.mobile-glass-nav, .saas-bottom-dock, [data-mobile-nav]`
    - Dynamic Island: `.mobile-dynamic-island, #dynamicMobileIsland`

### 1.2 Trạng thái kích hoạt hiện tại
1. **Khi cuộn xuống (`diff > 4 && currentScrollY > 35`)**:
   - `topBar.classList.add('topbar-compact');`
   - `mobileNav.classList.remove('nav-expanded', 'nav-scrolling-up');`
   - `mobileNav.classList.add('dock-compact', 'nav-compact', 'nav-shrunk', 'nav-scrolling-down');`
   - `dynamicIsland.classList.add('island-compact');`
2. **Khi cuộn lên (`diff < -4 || currentScrollY <= 20`)**:
   - `topBar.classList.remove('topbar-compact');`
   - `mobileNav.classList.remove('dock-compact', 'nav-compact', 'nav-shrunk', 'nav-scrolling-down');`
   - `mobileNav.classList.add('nav-expanded', 'nav-scrolling-up');`
   - `dynamicIsland.classList.remove('island-compact');`

### 1.3 Quy tắc CSS điều khiển ẩn/hiện (`tệp hệ thống/glass-theme.css`)
- **Topbar Compact** (dòng 4987 - 4993):
  ```css
  .saas-topbar.topbar-compact,
  header.saas-topbar.topbar-compact {
    transform: translateY(calc(-100% - 24px)) !important;
    opacity: 0 !important;
    pointer-events: none !important;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease !important;
  }
  ```
- **Bottom Dock Compact** (dòng 5017 - 5026):
  ```css
  .mobile-glass-nav.dock-compact,
  .mobile-glass-nav.nav-compact,
  .mobile-glass-nav.nav-shrunk,
  .mobile-glass-nav.nav-scrolling-down,
  .saas-bottom-dock.dock-compact {
    transform: translateX(-50%) translateY(calc(100% + 40px)) scale(0.92) !important;
    opacity: 0 !important;
    pointer-events: none !important;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease !important;
  }
  ```
- **Hiệu ứng hồi phục khi cuộn lên (Spring Expansion)** (dòng 5049 - 5068):
  ```css
  .saas-topbar:not(.topbar-compact),
  header.saas-topbar:not(.topbar-compact) {
    animation: svTopbarSpringExpand 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .mobile-glass-nav:not(.dock-compact):not(.nav-shrunk),
  .saas-bottom-dock:not(.dock-compact) {
    animation: svDockSpringExpand 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes svTopbarSpringExpand {
    0% { transform: translateY(-2px) scale(0.985); }
    100% { transform: translateY(0) scale(1); }
  }
  @keyframes svDockSpringExpand {
    0% { transform: translateX(-50%) translateY(4px) scale(0.94); }
    100% { transform: translateX(-50%) translateY(0) scale(1); }
  }
  ```

### 1.4 Các khiếm khuyết phát hiện trong cơ chế hiện tại
1. **Hoàn toàn thiếu cơ chế phục hồi khi DỪNG CUỘN (Scroll Stop / Touch End)**:
   - Nếu người dùng vuốt xuống 100px rồi nhấc tay hoặc dừng lại để đọc nội dung, Topbar và Bottom Dock sẽ biến mất vĩnh viễn cho đến khi người dùng chủ động vuốt ngược lên ít nhất 4px.
   - Yêu cầu R2 nêu rõ: *"Khi người dùng cuộn nhẹ lên hoặc dừng chạm: Cả hai thanh lập tức trượt trở lại vị trí hiển thị tiêu chuẩn với hiệu ứng lò xo Apple VisionOS đàn hồi êm ái (cubic-bezier(0.16, 1, 0.3, 1))."*
2. **Lỗi giật hình/nhảy cóc (Teleportation Glitch) do CSS Keyframes**:
   - Khi xóa lớp `.topbar-compact` (đang ở vị trí `-100%`), animation `svTopbarSpringExpand` bắt đầu từ `translateY(-2px)`, chứ không phải `-100%`!
   - Tương tự, `svDockSpringExpand` bắt đầu từ `translateY(4px)`, chứ không phải `translateY(calc(100% + 40px))`!
   - Điều này làm thanh điều hướng bị "nhảy giật" lập tức về gần vị trí 0px rồi mới rung nhẹ, triệt tiêu độ mượt tự nhiên của chuyển động trượt vào.
3. **Hiện tượng Rung Lắc (Jitter) do ngưỡng cuộn quá nhạy (`diff > 4`, `diff < -4`)**:
   - Khi ngón tay chạm nhẹ hoặc giữ nguyên trên màn hình, các dao động micro-touch (±3px đến ±5px) khiến các lớp CSS bị gán và gỡ liên tục trong cùng 1 giây.

---

## 2. Yêu Cầu Để Triển Khai Scroll-Driven Engine Chuẩn Apple VisionOS (Question 2)

### 2.1 Cần bổ sung trong JavaScript (`tệp hệ thống/glass-theme.js`)
1. **Bộ đếm thời gian phục hồi khi dừng chạm (Scroll Stop / Idle Restoration)**:
   - Sử dụng một timer `scrollRestorationTimer` debounced (khoảng 800ms - 1200ms).
   - Mỗi lần có sự kiện cuộn xuống, kích hoạt lại timer. Khi người dùng dừng chạm hoặc dừng cuộn sau khoảng thời gian này, hàm tự động gỡ bỏ `.topbar-compact` và `.dock-compact` để trượt êm cả hai thanh trở lại.
   - Lắng nghe thêm sự kiện `scrollend` (hỗ trợ gốc trên Safari 17.4+ và Chrome) và `touchend` để phục hồi ngay khi người dùng nhấc ngón tay.
2. **Tăng ngưỡng kích hoạt (Deadzone Threshold)**:
   - Thay `diff > 4` bằng `diff > 8` và `diff < -4` bằng `diff < -6`.
   - Luôn hiển thị thanh điều hướng nếu `currentScrollY <= 24` (vùng đỉnh trang).
   - Kiểm tra ranh giới đáy trang: nếu `(docHeight - currentScrollY) < 80`, giữ nguyên thanh điều hướng hoặc cho phép phục hồi để không chặn footer.
3. **Tích hợp Modal Suppression**:
   - Khi có modal/dialog đang mở (`document.body.classList.contains('modal-open')` hoặc `document.querySelector('dialog[open], .modal:not(.hidden)')`), tạm ngừng hoàn toàn logic ẩn hiện theo cuộn.

### 2.2 Cần chuẩn hóa trong CSS (`tệp hệ thống/glass-theme.css`)
1. **Loại bỏ Keyframes gián đoạn**:
   - Xóa bỏ `@keyframes svTopbarSpringExpand` và `@keyframes svDockSpringExpand` làm nhảy tọa độ.
2. **Áp dụng CSS GPU Transition đối xứng hai chiều với đường cong VisionOS**:
   ```css
   /* Topbar Chuẩn */
   .saas-topbar,
   header.saas-topbar {
     transform: translateY(0) !important;
     opacity: 1 !important;
     pointer-events: auto !important;
     transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), 
                 opacity 0.28s ease !important;
     will-change: transform, opacity !important;
   }
   .saas-topbar.topbar-compact,
   header.saas-topbar.topbar-compact {
     transform: translateY(calc(-100% - 32px)) !important;
     opacity: 0 !important;
     pointer-events: none !important;
   }

   /* Bottom Dock Chuẩn */
   .mobile-glass-nav {
     transform: translateX(-50%) translateY(0) scale(1) !important;
     opacity: 1 !important;
     pointer-events: auto !important;
     transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), 
                 opacity 0.28s ease !important;
     will-change: transform, opacity !important;
   }
   .mobile-glass-nav.dock-compact {
     transform: translateX(-50%) translateY(calc(100% + 50px)) scale(0.92) !important;
     opacity: 0 !important;
     pointer-events: none !important;
   }
   ```
   *Lợi ích*: Khi lớp compact được gỡ bỏ, trình duyệt sẽ tự động nội suy chuyển động từ vị trí đang ẩn lên vị trí hiện thị đúng theo đường cong lò xo đàn hồi `cubic-bezier(0.16, 1, 0.3, 1)` mà không xảy ra giật hình.

---

## 3. Khảo Sát Chi Tiết Thanh Bên (Sidebar Drawer) Trên Toàn Bộ Các Trang (Question 3)

### 3.1 Cơ chế Đóng/Mở & Trình kích hoạt hiện tại
- **Các trang chứa thanh bên**: Toàn bộ 11 trang nội dung chính (`trangchudong.html`, `index.html`, `vault.html`, `thuvienmau.html`, `AI.html`, `setting.html`, `security.html`, `phoimau.html`, `trinhchieuchiase.html`, `vanban.html`, `vebieudonhanh.html`).
- **Nút mở (Drawer Open Triggers)**:
  - Nút hamburger trên Topbar: `<button type="button" data-sidebar-toggle ...>`
  - Nút Menu trên Bottom Dock: `<button type="button" class="mobile-nav-item" data-sidebar-toggle title="Mở danh mục menu">`
- **Nút đóng (Drawer Close Triggers)**:
  - Nút đóng bên trong đầu thanh bên: `<button type="button" data-sidebar-close class="lg:hidden ...">`
  - Lớp mờ nền (Backdrop): `<div data-sidebar-backdrop class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 hidden lg:hidden ...">`
  - Bấm vào bất kỳ liên kết nào (`.saas-sidebar a[href]`): tự động đóng drawer trên thiết bị di động (`glass-theme.js` dòng 969-974).
  - Phím `Escape` trên bàn phím cứng (`glass-theme.js` dòng 1293-1298).

### 3.2 Bộ xử lý cử chỉ vuốt chạm (Touch / Swipe Gesture Handlers)
Nằm trong `tệp hệ thống/glass-theme.js` (dòng 1362 - 1484):
- **Sự kiện `touchstart`**:
  - Ghi nhận `touchStartX = e.touches[0].clientX;` và `touchStartY = e.touches[0].clientY;`.
  - Phát hiện mép trái: `const isNearLeftEdge = touchStartX <= 30;`
  - Phát hiện chạm backdrop: `const isBackdrop = e.target && e.target.closest && e.target.closest('[data-sidebar-backdrop]');`
- **Sự kiện `touchmove`**:
  - Tính toán `deltaX` và `deltaY`. Nếu vuốt dọc nhiều hơn: `if (deltaY > Math.abs(deltaX) && Math.abs(deltaX) < 16) isSwiping = false;`.
  - Nếu đang kéo: Gán trực tiếp `activeSidebar.style.setProperty('transform', 'translateX(' + translateX + 'px)', 'important');` và `transition: none;`.
- **Sự kiện `touchend`**:
  - Gỡ bỏ thuộc tính inline: `activeSidebar.style.removeProperty('transform'); activeSidebar.style.removeProperty('transition');`
  - Nếu kéo sang phải > 25% chiều rộng: Mở snap open.
  - Nếu kéo sang trái < -20% chiều rộng: Đóng snap closed.

### 3.3 Đánh giá Momentum Scrolling & Overscroll Behavior
- **Trong `glass-theme.css` dòng 4932**:
  ```css
  .saas-sidebar nav,
  .saas-sidebar .sidebar-nav-scroll,
  aside.saas-sidebar nav {
    overflow-y: auto !important;
    overscroll-behavior-y: contain !important;
    -webkit-overflow-scrolling: touch !important;
  }
  ```
- **Nhưng tại dòng 4309**:
  ```css
  #saasAppSidebar,
  aside.saas-sidebar,
  .saas-sidebar {
    ...
    touch-action: pan-y !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    /* THIẾU: -webkit-overflow-scrolling: touch !important; */
  }
  ```

### 3.4 Nguyên Nhân Khiến Sidebar Bị Giật, Kẹt Vuốt Hoặc Cướp Cử Chỉ Ngang
Qua điều tra chi tiết dòng mã, xác định chính xác **4 nguyên nhân gốc rễ**:

1. **Lỗi lồng hai khung cuộn dọc (Double Nested Scroll Containers)**:
   - Khung ngoài `.saas-sidebar` được định nghĩa `overflow-y: auto !important;` (dòng 4341 và dòng 152).
   - Khung trong `nav.sidebar-nav-scroll` cũng được định nghĩa `overflow-y: auto !important;` (dòng 4935).
   - **Hậu quả**: Khi người dùng vuốt ngón tay bên trong Sidebar trên iOS/Android, hai vùng cuộn này tranh chấp cử chỉ với nhau. Nếu vuốt chạm vào phần đệm (padding) hoặc footer, khung ngoài cuộn; nếu vuốt vào danh sách menu, khung trong cuộn. Điều này tạo cảm giác bị kẹt cứng (stuck/jitter).
   - **Khắc phục**: Khung ngoài `.saas-sidebar` bắt buộc phải là `overflow: hidden !important;`, chỉ duy nhất phần tử con `nav.sidebar-nav-scroll` (`flex-1 min-h-0`) được phép có `overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain;`.

2. **Chặn hoàn toàn cử chỉ vuốt đóng từ bên trong Sidebar (Gesture Lockdown Bug)**:
   - Xem dòng 1384-1388 trong `glass-theme.js`:
     ```javascript
     // If touch starts inside open sidebar, NEVER hijack swipe: allow 100% native smooth vertical scrolling!
     if (isInsideSidebar && isDrawerOpen) {
       isSwiping = false;
       return;
     }
     ```
   - **Hậu quả**: Khi Sidebar đang mở, bất kỳ thao tác chạm nào bắt đầu từ bên trong Sidebar đều bị đặt `isSwiping = false` và `return` ngay lập tức. Người dùng **không thể vuốt sang trái để đóng thanh bên** như ứng dụng iOS thông thường! Họ chỉ có thể bấm nút X hoặc chạm ra ngoài màn hình.

3. **Cướp cử chỉ cuộn dọc ngoài trang chủ (Left Edge Hijacking)**:
   - Xem dòng 1390: `const isNearLeftEdge = touchStartX <= 30;`
   - **Hậu quả**: Khi Sidebar đang đóng, nếu người dùng đặt ngón tay cái gần cạnh trái màn hình (cách mép <= 30px - rất phổ biến khi cầm điện thoại bằng tay trái) rồi vuốt chéo nhẹ hoặc vuốt xuống, nếu `Math.abs(deltaX)` vượt quá 16px trước khi `deltaY` chiếm ưu thế, hệ thống lập tức khóa cuộn trang web và bắt đầu kéo Sidebar ra ngoài, gây hiện tượng giật cục và ức chế cho người dùng.

4. **Hiện tượng giật nhấp nháy khi thả tay (`touchend` Flash)**:
   - Xem dòng 1447-1448:
     ```javascript
     activeSidebar.style.removeProperty('transform');
     activeSidebar.style.removeProperty('transition');
     ```
   - Gỡ bỏ thuộc tính inline ngay trước khi gọi `setDrawerOpen` khiến phần tử giật về tọa độ CSS gốc trong 1 khung hình (16ms) trước khi lớp chuyển động mới kịp áp dụng.

---

## 4. Tinh Gọn Tiêu Đề Thanh Bên & Tiêu Chuẩn Vùng Chạm >= 48px (Question 4)

### 4.1 Hiện trạng Tiêu đề Thương hiệu (Sidebar Brand Header)
Cấu trúc HTML hiện tại trên toàn bộ các trang:
```html
<div class="sidebar-brand-header flex items-center justify-between pb-4 border-b border-border/60">
  <a href="trangchudong.html" class="flex items-center gap-3 group no-underline border-0 outline-none shadow-none">
    <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
      <svg class="w-5 h-5 text-white" ...></svg>
    </div>
    <div class="sidebar-text">
      <div class="flex items-center gap-1.5">
        <span class="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">SlideVault</span>
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">PRO</span>
      </div>
      <p class="text-[11px] text-muted-foreground font-medium">AI Presentation Studio</p>
    </div>
  </a>
  <div class="flex items-center gap-1 shrink-0">
    <button type="button" data-sidebar-close class="lg:hidden p-1.5 rounded-xl hover:bg-surface-pill text-muted-foreground hover:text-foreground transition-all cursor-pointer" title="Đóng thanh bên" aria-label="Đóng thanh bên">
      <svg class="w-4 h-4" ...></svg>
    </button>
    <button type="button" data-sidebar-collapse-btn class="sidebar-collapse-btn hidden lg:flex p-1.5 rounded-xl ...">...</button>
  </div>
</div>
```

### 4.2 Phương án tinh gọn chuẩn Apple VisionOS trên Mobile
1. **Tinh giảm kích thước khối thương hiệu**:
   - Biểu tượng logo thu nhỏ từ `w-10 h-10` (40px) xuống `w-8 h-8` (32px), bo góc tròn `rounded-xl`.
   - Giữ tiêu đề 1 dòng gọn gàng: `SlideVault` kèm huy hiệu `PRO`.
   - Ẩn dòng chữ phụ `AI Presentation Studio` trên màn hình hẹp (`< 640px`) hoặc thu nhỏ cỡ chữ thành `text-[10px]` để tiết kiệm không gian chiều cao quý giá trên iPhone 15 Pro.
2. **Tăng cường vùng chạm Nút Đóng `[data-sidebar-close]` đạt chuẩn >= 48px**:
   - Hiện trạng: Nút đóng chỉ có `p-1.5` với icon `w-4 h-4` (tổng kích thước 28px × 28px), rất khó bấm trúng trên điện thoại di động.
   - Chuẩn hóa: Đặt kích thước tối thiểu `min-w-[48px] min-h-[48px]` (hoặc `w-12 h-12 flex items-center justify-center`) với icon `w-5 h-5`, giúp ngón tay cái chạm cực kỳ nhạy và chính xác.

### 4.3 Khảo sát vùng chạm (Touch Target >= 48px) trên toàn bộ Sidebar
| Phần tử | Kích thước hiện tại | Trạng thái đạt chuẩn 48px | Khuyến nghị khắc phục |
|---|---|---|---|
| **Các mục menu điều hướng (`.nav-pill-item`)** | `height: 48px !important; min-height: 48px !important;` (`glass-theme.css` dòng 4433) | **ĐẠT CHUẨN** (>= 48px) | Giữ nguyên, rất chuẩn xác |
| **Nút Đóng thanh bên (`[data-sidebar-close]`)** | `p-1.5` + SVG 16px (28px × 28px) | **KHÔNG ĐẠT** (Chỉ 28px) | Nâng lên `min-width: 48px; min-height: 48px;` |
| **Nút đổi Theme (`data-theme-toggle` ở footer)** | `p-1.5 rounded-xl` (28px × 28px) | **KHÔNG ĐẠT** (Chỉ 28px) | Mở rộng padding hoặc đặt `min-w-[44px] min-h-[44px]` |
| **Nút đăng nhập (`#sidebarAuthActionBtn` ở footer)** | `p-1.5 rounded-xl` (28px × 28px) | **KHÔNG ĐẠT** (Chỉ 28px) | Nâng lên `min-w-[44px] min-h-[44px]` |
| **Các nút điều hướng đáy (`.mobile-nav-item`)** | `min-height: 48px !important; min-width: 48px !important;` (`glass-theme.css` dòng 5287) | **ĐẠT CHUẨN** (>= 48px) | Giữ nguyên |

---

## 5. Rà Soát & Triệt Tiêu Nút 3 Chấm Thừa (Question 5)

### 5.1 Kết quả kiểm tra toàn diện mã nguồn
Đã tiến hành rà soát tự động bằng regex chuyên sâu trên toàn bộ 19 file HTML và các file script:
- Các mẫu kiểm tra: `more-vertical`, `more-horizontal`, `ellipsis`, `dropdown-toggle`, `data-mobile-more`, `data-sidebar-more`, `three-dots`, `3-dots`, các SVG chứa 3 hình tròn `<circle>`.
- **Kết quả trong mã HTML tĩnh**: **0** nút 3 chấm thừa tồn tại trong các thẻ `header`, `card`, `sidebar`, hay `toolbar`.
- Vị trí nút số 5 trên thanh Bottom Dock (`mobile-glass-nav`): Đã được chuyển đổi hoàn toàn thành nút `Menu` có icon 3 gạch ngang (hamburger):
  ```html
  <button type="button" class="mobile-nav-item" data-sidebar-toggle title="Mở danh mục menu">
    <svg class="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
    <span>Menu</span>
  </button>
  ```

### 5.2 Lớp bảo vệ vĩnh viễn trong CSS (`tệp hệ thống/glass-theme.css`)
Tại dòng 4477 - 4495 đã có sẵn luật loại bỏ triệt để:
```css
/* Xóa triệt để mọi thanh/nút 3 chấm trên toàn bộ giao diện */
[data-sidebar-more],
[data-mobile-more],
.sidebar-more-btn,
.nav-pill-more,
.more-dots-btn,
button:has([data-lucide^="more-"]),
button:has([data-lucide="ellipsis"]),
button:has([data-lucide="ellipsis-vertical"]),
button:has(svg.lucide-more-horizontal),
button:has(svg.lucide-more-vertical),
button:has(.fa-ellipsis),
button:has(.fa-ellipsis-vertical),
button:has(.fa-ellipsis-h),
button:has(.fa-ellipsis-v) {
  display: none !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
```
**Kết luận**: Mục tiêu triệt tiêu nút 3 chấm thừa đã được xử lý triệt để, cả trong mã cấu trúc HTML lẫn lớp phòng thủ CSS. Không còn nút 3 chấm nào hiển thị trên giao diện người dùng.

---

## 6. Điểm Gãy Responsive (CSS Breakpoints) & Nguyên Nhân Tràn Màn Hình Ngang (Question 6)

### 6.1 Khảo sát các điểm gãy (Breakpoints) hiện tại
Trong `glass-theme.css`, có 4 nhóm điểm gãy chính:
1. **Mobile cơ sở (`@media (max-width: 640px)`)**:
   - Thiết lập `overflow-x: hidden !important;` cho `html, body`.
   - Thu hẹp padding của `.saas-layout-wrapper` còn `10px`.
   - Ép buộc touch target 48px cho các phần tử di động.
2. **Ngưỡng điện thoại thông minh (`@media (max-width: 767.98px)`)**:
   - Padding đáy cho `.saas-layout-wrapper`: `padding-bottom: 5.5rem`.
   - Ẩn toàn bộ thanh số 3 `mobile-dynamic-island` nếu màn hình >= 768px (`min-width: 768px`).
3. **Ngưỡng Máy Tính Bảng dọc & ngang (`@media (min-width: 768px) and (max-width: 1023.98px)`)**:
   - Dành riêng cho iPad Mini (768px), iPad Air (820px) và iPad Pro 11" (834px).
   - Tối ưu lưới danh mục sản phẩm thành 2 cột (`grid-template-columns: repeat(2, minmax(0, 1fr)) !important;`).
   - Ẩn các huy hiệu chữ dài trên Topbar (`#touchSwitchLabel`, `.topbar-status-badge`).
4. **Ngưỡng Chuyển Đổi Desktop Master (`@media (max-width: 1023.98px)` vs `@media (min-width: 1024px)`)**:
   - Dưới 1024px: Sidebar chuyển thành Drawer di động ẩn ngoài màn hình (`translate3d(-105%, 0, 0)`), Bottom Dock xuất hiện.
   - Từ 1024px trở lên: Sidebar cố định dạng rail bên trái (`margin-left: calc(260px + 1.25rem)`), Bottom Dock ẩn.

### 6.2 Nguyên Nhân Gây Tràn Màn Hình Ngang (Horizontal Overflow) & Cách Khắc Phục
Mặc dù đã có `overflow-x: hidden !important;` trên `html, body`, hiện tượng giật ngang hoặc thanh cuộn ngang vẫn có thể phát sinh do các nguyên nhân cụ thể sau:

1. **Vấn đề Topbar bị quá tải trên `AI.html`**:
   - Khảo sát dòng 537-541 trên `AI.html`: Nút `open-hand-control` có chứa `<span class="inline font-bold">Camera AI 3D Touch</span>`.
   - Trên các trang khác (`trangchudong.html`, `index.html`), nhãn này có lớp `hidden sm:inline`. Nhưng trên `AI.html`, nhãn này được để `inline` cố định.
   - Cùng với bộ chuyển tab `Slide / Chat AI`, nút Menu, và nút Theme, chiều rộng tối thiểu của Topbar vượt quá 393px trên iPhone 15 Pro, gây phình ngang khung hình Topbar.
   - **Khắc phục**: Đổi thành `<span class="hidden sm:inline font-bold">...</span>` trên `AI.html`.
2. **Khuyết điểm vùng chọn `max-width: 100vw`**:
   - Trên một số trình duyệt WebKit và Chromium di động, `100vw` bao gồm cả bề rộng thanh cuộn (nếu có), dẫn đến trang rộng hơn viewport khả dụng từ 15px - 17px.
   - **Khắc phục**: Thay thế toàn bộ `100vw` bằng `100%` trên `html, body, .saas-layout-wrapper`.
3. **Các phần tử Flexbox thiếu `min-width: 0`**:
   - Trong các thanh cuộn ngang như `#categoryChipsGroup` (trang chủ) hay `#qvThumbsRow` (modal), nếu các container cha thiếu `min-w-0`, các phần tử con bên trong sẽ đẩy rộng khung ngoài thay vì cuộn nội bộ.
   - **Khắc phục**: Đảm bảo toàn bộ các thẻ cha bọc thanh cuộn ngang có `min-w-0` và `w-full max-w-full`.

---

## 7. Tổng Hợp & Đề Xuất Thực Thi (Actionable Roadmap)

Dành cho tác nhân lập trình kế tiếp:
1. **Triển khai Scroll-Driven Engine hoàn chỉnh trong `glass-theme.js`**:
   - Thêm `scrollRestorationTimer` (~1000ms) để tự động phục hồi Topbar & Bottom Dock khi người dùng dừng cuộn.
   - Lắng nghe thêm `scrollend` và `touchend`.
   - Tinh chỉnh ngưỡng `diff > 8` (ẩn) và `diff < -6` (hiện).
2. **Khắc phục triệt để Sidebar Drawer**:
   - Trong `glass-theme.css`: Đổi `.saas-sidebar` trên mobile thành `overflow: hidden !important;`. Chỉ giữ `overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain;` cho `nav.sidebar-nav-scroll`.
   - Trong `glass-theme.js`: Xóa bỏ đoạn chặn vuốt `if (isInsideSidebar && isDrawerOpen) return;`, cho phép cử chỉ vuốt sang trái từ bên trong thanh bên để đóng drawer một cách mượt mà.
   - Khắc phục giật màn hình khi `touchend`: Không gỡ bỏ inline style trước khi animation snap class được kích hoạt.
3. **Chuẩn hóa vùng chạm & header thanh bên**:
   - Tinh gọn header thương hiệu trên mobile.
   - Nâng kích thước nút đóng `[data-sidebar-close]` lên tối thiểu 48px × 48px.
4. **Sửa lỗi tràn Topbar trên `AI.html`**:
   - Ẩn chữ `Camera AI 3D Touch` trên màn hình nhỏ `< 640px` (`hidden sm:inline`).
5. **Bảo toàn Invariance Rule**:
   - Sau bất kỳ chỉnh sửa nào trên `trangchudong.html`, đồng bộ nguyên vẹn từng byte sang `index.html` và xác thực khớp SHA-256.
