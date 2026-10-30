import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and os.path.isfile(f)]

results = []
for f in sorted(html_files):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    
    # Check for [data-sidebar-more], [data-mobile-more], .more, .dots, etc.
    patterns = [
        r'data-sidebar-more',
        r'data-mobile-more',
        r'sidebar-more-btn',
        r'nav-pill-more',
        r'more-dots',
        r'lucide-more',
        r'data-lucide=[\'"]more',
        r'data-lucide=[\'"]ellipsis',
        r'fa-ellipsis'
    ]
    for p in patterns:
        for m in re.finditer(p, content, re.I):
            start = max(0, m.start() - 60)
            end = min(len(content), m.end() + 60)
            snippet = content[start:end].replace('\n', ' ')
            results.append(f"{f}: found pattern '{p}': ...{snippet}...")

# Also check for inline SVGs with 3 dots:
# e.g., 3 <circle> elements or <polyline> / <path> with dots
for f in sorted(html_files):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    # Find all svg tags
    svgs = re.findall(r'<svg[^>]*>.*?</svg>', content, re.DOTALL | re.IGNORECASE)
    for s in svgs:
        circles = re.findall(r'<circle[^>]*>', s, re.IGNORECASE)
        if len(circles) == 3:
            s_clean = ' '.join(s.split())
            results.append(f"{f}: 3-circle SVG: {s_clean[:120]}")

with open(r'.agents\teamwork\teamwork_preview_explorer_survey_3\raw_3dots_found.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(results))

print(f"Total occurrences found: {len(results)}")
