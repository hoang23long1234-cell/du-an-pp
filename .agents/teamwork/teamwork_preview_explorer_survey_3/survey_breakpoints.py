import re

with open(r'tệp hệ thống\glass-theme.css', 'r', encoding='utf-8', errors='ignore') as f:
    css = f.read()

# Find all @media queries
media_queries = re.findall(r'@media[^{]+', css)
media_counts = {}
for m in media_queries:
    clean_m = ' '.join(m.split())
    media_counts[clean_m] = media_counts.get(clean_m, 0) + 1

lines = ["=== MEDIA QUERIES IN glass-theme.css ==="]
for mq, count in sorted(media_counts.items(), key=lambda x: -x[1]):
    lines.append(f"  ({count}x) {mq}")

# Find overflow-x rules
overflow_rules = []
for idx, line in enumerate(css.splitlines(), 1):
    if 'overflow-x' in line or 'overflow:' in line:
        overflow_rules.append(f"  Line {idx}: {line.strip()[:100]}")

lines.append("\n=== OVERFLOW RULES IN glass-theme.css (sample) ===")
lines.extend(overflow_rules[:30])

with open(r'.agents\teamwork\teamwork_preview_explorer_survey_3\breakpoint_survey.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(lines))

print("Breakpoints surveyed.")
