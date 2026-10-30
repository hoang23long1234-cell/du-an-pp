import os
import re

PATTERNS = [
    r'more-vertical',
    r'more-horizontal',
    r'ellipsis',
    r'data-mobile-more',
    r'dropdown-toggle',
    r'fa-ellipsis',
    r'lucide-more',
    r'bi-three-dots'
]
regex = re.compile('|'.join(PATTERNS), re.IGNORECASE)

html_files = [f for f in os.listdir('.') if f.endswith('.html') and os.path.isfile(f)]

for f in sorted(html_files):
    try:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
            for idx, line in enumerate(fp, 1):
                if regex.search(line):
                    print(f"{f}:{idx}: {line.strip()[:140]}")
    except Exception as e:
        print(f"Error {f}: {e}")
