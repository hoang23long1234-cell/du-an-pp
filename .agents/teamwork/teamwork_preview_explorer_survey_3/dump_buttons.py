import re

files = ['trangchudong.html', 'vault.html', 'thuvienmau.html', 'AI.html', 'setting.html', 'security.html']

results = []
for f in files:
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    
    # Also find buttons created in template strings in JS
    js_buttons = re.findall(r'<button[^>]*>.*?</button>', content, re.DOTALL | re.IGNORECASE)
    results.append(f"=== {f}: {len(js_buttons)} buttons found ===")
    for b in js_buttons:
        clean_b = ' '.join(b.split())
        # Check if button has no text (icon-only button)
        text_inside = re.sub(r'<[^>]+>', '', b).strip()
        if len(text_inside) <= 2:
            results.append(f"  [ICON-ONLY BUTTON]: {clean_b[:150]}")
        elif any(k in b.lower() for k in ['dot', 'more', 'option', 'menu', 'tùy chọn', 'khác']):
            results.append(f"  [CANDIDATE]: {clean_b[:150]}")

with open(r'.agents\teamwork\teamwork_preview_explorer_survey_3\all_icon_buttons.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(results))

print("Done dumping icon-only and candidate buttons.")
