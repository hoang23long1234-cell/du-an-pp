import os
import re

files = [f for f in os.listdir('.') if f.endswith('.html') and os.path.isfile(f)]

results = []
for f in sorted(files):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    
    topbar_match = re.search(r'<header[^>]*class=[\'"][^\'"]*saas-topbar.*?>(.*?)</header>', content, re.DOTALL | re.IGNORECASE)
    if topbar_match:
        tb_html = topbar_match.group(0)
        # Count buttons inside topbar
        btns = re.findall(r'<button[^>]*>.*?</button>', tb_html, re.DOTALL | re.IGNORECASE)
        # Check text spans in right actions
        results.append(f"=== {f} Topbar: {len(btns)} buttons ===")
        for b in btns:
            b_clean = ' '.join(b.split())
            results.append(f"  Button: {b_clean[:120]}")
    else:
        results.append(f"=== {f}: No <header class='saas-topbar'> found ===")

with open(r'.agents\teamwork\teamwork_preview_explorer_survey_3\topbar_survey.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(results))

print("Topbar survey done.")
