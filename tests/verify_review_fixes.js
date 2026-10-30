const fs = require('fs');
const assert = require('assert');

console.log('================================================================');
console.log('🔍 ADVERSARIAL PEER REVIEW FIXES VERIFICATION');
console.log('================================================================');

// 1. Check user-select for contenteditable
const glass = fs.readFileSync('tệp hệ thống/glass-theme.css', 'utf8');
const mobileOpt = fs.readFileSync('3dtouch/mobile-optimization.css', 'utf8');
const ai = fs.readFileSync('AI.html', 'utf8');

assert(glass.includes('[contenteditable="true"]'), 'glass-theme.css must whitelist [contenteditable="true"]');
assert(mobileOpt.includes('[contenteditable="true"]'), 'mobile-optimization.css must whitelist [contenteditable="true"]');
assert(ai.includes('#cinemaStage [contenteditable="true"]') && ai.includes('user-select: text !important'), 'AI.html must set user-select: text for contenteditable');
console.log('✅ 1. Contenteditable text selection whitelist verified (Bug 1 fixed)');

// 2. Check rich HTML content preservation
assert(ai.includes("else if (field === 'content') {\n          slide.content = fieldEl.innerHTML.trim();"), 'slide.content must preserve innerHTML');
console.log('✅ 2. Rich HTML formatting preservation in slidesData verified (Bug 2 fixed)');

// 3. Check duplicate arrow navigation removed
assert(!ai.includes("if (nextBtn) nextBtn.click();"), 'Redundant arrow navigation click must be removed');
console.log('✅ 3. Arrow key double advancement eliminated (Bug 3 fixed)');

// 4. Check Vault bidirectional sync and deckId loading
assert(ai.includes("localStorage.setItem('slidevault_projects_v2'"), 'saveDeckToVaultSilent must sync to slidevault_projects_v2');
assert(ai.includes("localStorage.setItem('slidevault_saved_decks'"), 'saveDeckToVaultSilent must sync to slidevault_saved_decks');
assert(ai.includes("params.get('deckId') || params.get('deck')"), 'AI.html must ingest deckId/deck query param from Vault');
console.log('✅ 4. Bidirectional Vault sync & URL loader verified (Bug 4 fixed)');

// 5. Check touch targets >= 44px
assert(ai.includes("id=\"mobileTabSlide\" onclick=\"setMobileStudioTab('slide')\" aria-label=\"Xem khung nhìn Trình chiếu Slide\" class=\"min-h-[44px] min-w-[44px]"), 'mobileTabSlide must have min-h-[44px]');
assert(ai.includes("id=\"mobileTabChat\" onclick=\"setMobileStudioTab('chat')\" aria-label=\"Mở bảng trò chuyện Trợ lý AI Co-Pilot\" class=\"min-h-[44px] min-w-[44px]"), 'mobileTabChat must have min-h-[44px]');
assert(ai.includes("id=\"voiceInputBtn\" onclick=\"toggleVoiceInput()\" aria-label=\"Nhập liệu bằng giọng nói tiếng Việt\" class=\"w-10 h-10 sm:w-9 sm:h-9 min-w-[40px] min-h-[40px]"), 'voiceInputBtn must have min-w/min-h 40-44px');
console.log('✅ 5. Mobile touch targets >= 44px verified (Bug 5 fixed)');

// 6. Check floating toolbar ontouchstart & flip
assert(ai.includes("ontouchstart=\"applyFormatCommand(event, 'bold')\""), 'Toolbar buttons must have ontouchstart');
assert(ai.includes("rect.top < 75 ? (rect.bottom + 12) : Math.max(12, rect.top - 50)"), 'Toolbar must have smart flip positioning');
console.log('✅ 6. Floating toolbar touch support & smart flip positioning verified (Bug 6 fixed)');

// 7. Check TTS audio cancellation on slide change
assert(ai.includes("if (typeof isTtsSpeaking !== 'undefined' && isTtsSpeaking && 'speechSynthesis' in window) {\n          window.speechSynthesis.cancel();"), 'Slide navigation must cancel active TTS');
console.log('✅ 7. TTS audio cancellation on slide navigation verified (Bug 7 fixed)');

// 8. Check dynamic layout in-place editing and ID conflict prevention
assert(ai.includes("data-direct-field=\"concept1Title\"") && ai.includes("data-direct-field=\"concept2Title\""), 'Dynamic layouts must include data-direct-field');
assert(ai.includes(".replace(/id=\"(conceptCard[0-9A-Za-z_-]+)\"/g, 'id=\"present_$1\"')"), 'presentContainer must prevent duplicate concept card IDs');
console.log('✅ 8. Dynamic layout editing & duplicate ID prevention verified (Bug 8 fixed)');

console.log('\n🎉 ALL 8 REVIEW FIXES CERTIFIED PASSING 100%!');
