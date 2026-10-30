import os
import re

dirs_to_check = ['.', 'tệp hệ thống', '3dtouch']
js_files = []
for d in dirs_to_check:
    for f in os.listdir(d):
        p = os.path.join(d, f)
        if os.path.isfile(p) and (f.endswith('.js') or f.endswith('.html')):
            js_files.append(p)

patterns = [
    r'more-vertical',
    r'more-horizontal',
    r'ellipsis',
    r'data-mobile-more',
    r'data-sidebar-more',
    r'three-dots',
    r'3-dots',
    r'more_vert',
    r'more_horiz'
]
combined = re.compile('|'.join(patterns), re.IGNORECASE)

results = []
for path in sorted(js_files):
    with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
        for idx, line in enumerate(fp, 1):
            if combined.search(line):
                results.append(f"{path}:{idx}: {line.strip()[:140]}")

with open(r'.agents\teamwork\teamwork_preview_explorer_survey_3\js_dots_results.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(results))

print(f"Scanned {len(js_files)} files. Found {len(results)} matches.")
