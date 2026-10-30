const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../AI.html');
let html = fs.readFileSync(filePath, 'utf8');

// Sidebar theme toggle
html = html.replace(
  '<button data-theme-toggle class="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Đổi giao diện Sáng / Tối">',
  '<button data-theme-toggle class="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Đổi giao diện Sáng / Tối" aria-label="Đổi giao diện Sáng / Tối">'
);

// Topbar presentation launchers
html = html.replace(
  /<button type="button" onclick="launchPresentationMode\(\)" class="p-2 rounded-xl bg-white\/\[0\.04\] hover:bg-white\/\[0\.08\] text-slate-300 hover:text-white transition-all border border-white\/\[0\.08\] shadow-sm flex items-center gap-1\.5" title="Trình Chiếu Toàn Màn Hình">/g,
  '<button type="button" onclick="launchPresentationMode()" class="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all border border-white/[0.08] shadow-sm flex items-center gap-1.5" title="Trình Chiếu Toàn Màn Hình" aria-label="Trình Chiếu Toàn Màn Hình">'
);
html = html.replace(
  /<button type="button" onclick="launchPresentationMode\(\)" class="p-1\.5 rounded-xl bg-white\/\[0\.04\] hover:bg-white\/\[0\.08\] text-slate-300 hover:text-white transition-all border border-white\/\[0\.08\]" title="Trình Chiếu Toàn Màn Hình">/g,
  '<button type="button" onclick="launchPresentationMode()" class="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all border border-white/[0.08]" title="Trình Chiếu Toàn Màn Hình" aria-label="Trình Chiếu Toàn Màn Hình">'
);

// Timer controls
html = html.replace(
  'id="btnPlayPauseTimer" class="text-emerald-400 hover:text-emerald-300 p-0.5 transition-colors" title="Bắt đầu / Tạm dừng đếm giờ"',
  'id="btnPlayPauseTimer" class="text-emerald-400 hover:text-emerald-300 p-0.5 transition-colors" title="Bắt đầu / Tạm dừng đếm giờ" aria-label="Bắt đầu hoặc tạm dừng đếm giờ"'
);
html = html.replace(
  'onclick="resetPresentationTimer()" class="text-slate-500 hover:text-slate-300 p-0.5 transition-colors" title="Đặt lại 00:00"',
  'onclick="resetPresentationTimer()" class="text-slate-500 hover:text-slate-300 p-0.5 transition-colors" title="Đặt lại 00:00" aria-label="Đặt lại thời gian đếm giờ"'
);
html = html.replace(
  'id="btnToggleTimer" class="hover:text-white p-0.5 transition-colors" title="Bắt đầu / Tạm dừng"',
  'id="btnToggleTimer" class="hover:text-white p-0.5 transition-colors" title="Bắt đầu / Tạm dừng" aria-label="Bắt đầu hoặc tạm dừng đếm giờ thuyết trình"'
);

// Laser & drawing
html = html.replace(
  'id="btnToggleLaserDraw" onclick="toggleLaserDrawMode()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors" title="Bút dạ quang / Laser vẽ trực tiếp"',
  'id="btnToggleLaserDraw" onclick="toggleLaserDrawMode()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors" title="Bút dạ quang / Laser vẽ trực tiếp" aria-label="Bật bút dạ quang hoặc laser vẽ trực tiếp"'
);
html = html.replace(
  'id="btnClearLaserDraw" onclick="clearLaserDrawCanvas()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors" title="Xóa toàn bộ nét vẽ"',
  'id="btnClearLaserDraw" onclick="clearLaserDrawCanvas()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors" title="Xóa toàn bộ nét vẽ" aria-label="Xóa toàn bộ nét vẽ trên slide"'
);

// Slide navigation buttons
html = html.replace(
  'onclick="prevSlide()" class="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition-all" title="Slide trước (Phím ←)"',
  'onclick="prevSlide()" class="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition-all" title="Slide trước (Phím ←)" aria-label="Slide trước"'
);
html = html.replace(
  'onclick="nextSlide()" class="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition-all" title="Slide sau (Phím →)"',
  'onclick="nextSlide()" class="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition-all" title="Slide sau (Phím →)" aria-label="Slide tiếp theo"'
);

// Chat & Modals
html = html.replace(
  'onclick="resetChatHistory()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors" title="Xóa đoạn chat"',
  'onclick="resetChatHistory()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors" title="Xóa đoạn chat" aria-label="Xóa đoạn chat AI"'
);
html = html.replace(
  'id="chatSendButton" onclick="sendChatMessage()" class="absolute right-2.5 bottom-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"',
  'id="chatSendButton" onclick="sendChatMessage()" class="absolute right-2.5 bottom-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" aria-label="Gửi yêu cầu tới AI" title="Gửi"'
);
html = html.replace(
  'onclick="closeDirectEditModal()" class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Đóng"',
  'onclick="closeDirectEditModal()" class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Đóng" aria-label="Đóng bảng chỉnh sửa trực tiếp"'
);
html = html.replace(
  'onclick="closeEditScriptModal()" class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Đóng"',
  'onclick="closeEditScriptModal()" class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Đóng" aria-label="Đóng kịch bản thuyết trình"'
);
html = html.replace(
  'onclick="closeAirShareModal()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Đóng"',
  'onclick="closeAirShareModal()" class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Đóng" aria-label="Đóng chia sẻ AirShare"'
);
html = html.replace(
  'onclick="toggle3DTouchEngine()" class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Thu nhỏ / Phóng to"',
  'onclick="toggle3DTouchEngine()" class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Thu nhỏ / Phóng to" aria-label="Thu nhỏ hoặc phóng to camera 3D"'
);
html = html.replace(
  'onclick="clearPresenterInk()" class="p-1 text-slate-400 hover:text-rose-400 text-[11px] flex items-center gap-1" title="Xóa toàn bộ nét vẽ"',
  'onclick="clearPresenterInk()" class="p-1 text-slate-400 hover:text-rose-400 text-[11px] flex items-center gap-1" title="Xóa toàn bộ nét vẽ" aria-label="Xóa nét vẽ thuyết trình"'
);
html = html.replace(
  'onclick="togglePresenterNotesDrawer()" class="hover:text-white cursor-pointer" title="Ẩn/Hiện ghi chú diễn giả"',
  'onclick="togglePresenterNotesDrawer()" class="hover:text-white cursor-pointer" title="Ẩn/Hiện ghi chú diễn giả" aria-label="Ẩn hoặc hiện ghi chú diễn giả"'
);

// Color buttons
html = html.replace(
  "onclick=\"setPresenterInkColor('#f59e0b')\" class=\"w-3.5 h-3.5 rounded-full bg-amber-400 border border-white/20 hover:scale-125 transition-transform\"",
  "onclick=\"setPresenterInkColor('#f59e0b')\" class=\"w-3.5 h-3.5 rounded-full bg-amber-400 border border-white/20 hover:scale-125 transition-transform\" aria-label=\"Chọn màu vẽ vàng hổ phách\" title=\"Màu vàng\""
);
html = html.replace(
  "onclick=\"setPresenterInkColor('#06b6d4')\" class=\"w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white/20 hover:scale-125 transition-transform\"",
  "onclick=\"setPresenterInkColor('#06b6d4')\" class=\"w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white/20 hover:scale-125 transition-transform\" aria-label=\"Chọn màu vẽ xanh cyan\" title=\"Màu xanh cyan\""
);
html = html.replace(
  "onclick=\"setPresenterInkColor('#f43f5e')\" class=\"w-3.5 h-3.5 rounded-full bg-rose-500 border border-white/20 hover:scale-125 transition-transform\"",
  "onclick=\"setPresenterInkColor('#f43f5e')\" class=\"w-3.5 h-3.5 rounded-full bg-rose-500 border border-white/20 hover:scale-125 transition-transform\" aria-label=\"Chọn màu vẽ đỏ hồng\" title=\"Màu đỏ hồng\""
);

// Dynamic slide thumb action buttons
html = html.replace(
  "onclick=\"duplicateSlide(\${idx})\" title=\"Nhân đôi slide\" class=\"p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white transition-colors\">",
  "onclick=\"duplicateSlide(\${idx})\" title=\"Nhân đôi slide\" aria-label=\"Nhân đôi slide \${idx + 1}\" class=\"p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white transition-colors\">"
);
html = html.replace(
  "onclick=\"deleteSlide(\${idx})\" title=\"Xóa slide\" class=\"p-1 rounded hover:bg-rose-500/30 text-slate-300 hover:text-rose-400 transition-colors\">",
  "onclick=\"deleteSlide(\${idx})\" title=\"Xóa slide\" aria-label=\"Xóa slide \${idx + 1}\" class=\"p-1 rounded hover:bg-rose-500/30 text-slate-300 hover:text-rose-400 transition-colors\">"
);

// Inputs
html = html.replace(
  'id="deckTitleInput" value="KHTN Lớp 10: Tế Bào Học & Hô Hấp Ti Thể"',
  'id="deckTitleInput" aria-label="Tiêu đề bộ slide bài giảng" value="KHTN Lớp 10: Tế Bào Học & Hô Hấp Ti Thể"'
);
html = html.replace(
  'id="directEditTitleInput" class="w-full bg-obsidian-950 text-white rounded-xl px-3.5 py-2 text-sm',
  'id="directEditTitleInput" aria-label="Tiêu đề slide chỉnh sửa" class="w-full bg-obsidian-950 text-white rounded-xl px-3.5 py-2 text-sm'
);
html = html.replace(
  'id="editSlideTitleInput" class="w-full bg-obsidian-950 text-white rounded-xl px-3 py-2 text-xs',
  'id="editSlideTitleInput" aria-label="Tiêu đề slide" class="w-full bg-obsidian-950 text-white rounded-xl px-3 py-2 text-xs'
);
html = html.replace(
  'id="cmdPaletteInput" placeholder="Tìm slide, lệnh AI, đổi màu, xuất PPTX... (gõ để lọc)"',
  'id="cmdPaletteInput" aria-label="Tìm kiếm slide hoặc lệnh AI" placeholder="Tìm slide, lệnh AI, đổi màu, xuất PPTX... (gõ để lọc)"'
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('AI.html updated successfully');
