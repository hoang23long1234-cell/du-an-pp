import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and os.path.isfile(f)]

for f in sorted(html_files):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    
    # Find all buttons and their classes / titles / contents
    buttons = re.findall(r'<button[^>]*>.*?</button>', content, re.DOTALL | re.IGNORECASE)
    
    interesting_btns = []
    for b in buttons:
        # Check if button looks like an options / more / 3-dots button
        if any(w in b.lower() for w in ['dot', 'more', 'option', 'tùy chọn', 'menu', 'extra', 'action', 'thêm', 'dropdown', 'collapse']):
            # Clean up newlines for display
            cleaned = ' '.join(b.split())
            interesting_btns.append(cleaned[:160])
    
    if interesting_btns:
        print(f"=== {f} ({len(interesting_btns)} candidate buttons) ===")
        for b in interesting_btns[:10]:
            print("  ", b)
