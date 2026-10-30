import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and os.path.isfile(f)]

out_lines = []

for f in sorted(html_files):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        lines = fp.readlines()
    
    file_matches = []
    for idx, line in enumerate(lines, 1):
        # 1. Look for three dots in SVG: 3 circles or dots
        # 2. Look for more, ellipsis, dropdown with 3 dots
        # 3. Look for buttons with 3 dots or dots icon
        if re.search(r'(more-vertical|more-horizontal|ellipsis|dropdown-toggle|btn-more|three-dots|\.\.\.)', line, re.I):
            file_matches.append((idx, line.strip()))
        elif '<circle' in line and lines[max(0, idx-3):min(len(lines), idx+3)]:
            # check if 3 circles exist in close vicinity
            snippet = ''.join(lines[max(0, idx-2):min(len(lines), idx+3)])
            if snippet.count('<circle') >= 3 and ('cx=' in snippet):
                # could be 3-dots svg!
                if 'cx="12"' in snippet or 'cx="5"' in snippet or 'cx="19"' in snippet or 'cy="12"' in snippet or 'cy="5"' in snippet or 'cy="19"' in snippet:
                    file_matches.append((idx, f"3-circle SVG: {line.strip()[:100]}"))
    
    if file_matches:
        out_lines.append(f"=== {f} ({len(file_matches)} matches) ===")
        for lnum, text in file_matches:
            out_lines.append(f"  Line {lnum}: {text[:140]}")

with open(r'.agents\teamwork\teamwork_preview_explorer_survey_3\survey_dots_out.txt', 'w', encoding='utf-8') as out_f:
    out_f.write('\n'.join(out_lines))

print(f"Successfully processed {len(html_files)} files. Output written.")
