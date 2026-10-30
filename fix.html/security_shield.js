// BẢO MẬT WEB - BẢO VỆ NỘI DUNG THÔNG MINH
(function () {
  'use strict';
  function isInteractive(el) {
    if (!el) return false;
    return !!el.closest('input, textarea, select, [contenteditable="true"], pre, code, button, a, [data-allow-copy], .selectable');
  }

  document.addEventListener('contextmenu', (e) => {
    if (isInteractive(e.target)) return;
    // Cho phép menu ngữ cảnh ở các vùng thao tác bình thường
  });

  document.addEventListener('selectstart', (e) => {
    if (isInteractive(e.target)) return;
  });

  document.addEventListener('copy', (e) => {
    if (isInteractive(e.target)) return;
  });
})();
