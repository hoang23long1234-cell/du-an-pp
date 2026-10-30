import os
import glob
import re

PATTERNS = [
    r'more-vertical',
    r'more-horizontal',
    r'ellipsis',
    r'data-mobile-more',
    r'circle.*cx=[\'"]12[\'"].*cy=[\'"]12[\'"]',
    r'circle.*cx=[\'"]19[\'"]',
    r'3-dots',
    r'threedots',
    r'dropdown-toggle'
]

regex = re.compile('|'.join(PATTERNS), re.IGNORECASE)

root_dir = r'c:\Users\admin\Downloads\dự án pp'
html_files = [f for f in glob.glob(os.path.join(root_dir, '*.html')) if os.path.isfile(f)]

results = []
for file_path in sorted(html_files):
    fname = os.path.basename(file_path)
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        for lnum, line in enumerate(f, 1):
            if regex.search(line):
                results.append((fname, lnum, line.strip()))

output_path = os.path.join(os.path.dirname(__file__), 'survey_3dots_results.txt')
with open(output_path, 'w', encoding='utf-8') as out:
    for fname, lnum, line in results:
        out.write(f'{fname}:{lnum}: {line}\n')

print(f'Done scanning {len(html_files)} files. Found {len(results)} matches. Output saved to {output_path}')
