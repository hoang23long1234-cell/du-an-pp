@echo off
chcp 65001 >nul
title SlideVault Pro - Máy Chủ Cho Điện Thoại & Desktop
cls
echo =====================================================================
echo    🚀 KHỞI ĐỘNG MÁY CHỦ SLIDEVAULT CHO ĐIỆN THOẠI & MÁY TÍNH
echo =====================================================================
echo.
echo [1] Đang kết nối mạng Wi-Fi nội bộ...
echo [2] Đang kích hoạt cổng 80 (gõ trực tiếp IP) và cổng 3000...
echo [3] Mã QR sẽ hiển thị trực tiếp bên dưới để quét bằng điện thoại...
echo.

node fix.html/server.js
pause

