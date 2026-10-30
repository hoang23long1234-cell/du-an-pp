import re

with open(r'tệp hệ thống\glass-theme.js', 'r', encoding='utf-8', errors='ignore') as f:
    js_content = f.read()

with open(r'tệp hệ thống\glass-theme.css', 'r', encoding='utf-8', errors='ignore') as f:
    css_content = f.read()

lines = []
lines.append("=== JS occurrences of more/dot/ellipsis ===")
for m in re.finditer(r'.{0,50}(more|dot|ellipsis|three-dots|3-dots).{0,50}', js_content, re.I):
    lines.append("  " + m.group(0).strip())

lines.append("\n=== CSS occurrences of more/dot/ellipsis ===")
for m in re.finditer(r'.{0,50}(more|ellipsis|three-dots|3-dots).{0,50}', css_content, re.I):
    lines.append("  " + m.group(0).strip())

with open(r'.agents\teamwork\teamwork_preview_explorer_survey_3\theme_dots_out.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(lines))
