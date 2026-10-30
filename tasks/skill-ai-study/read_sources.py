from pathlib import Path
import sys,json,re,hashlib
sys.stdout.reconfigure(encoding='utf-8')
base=Path('skill AI');out=Path('tasks/skill-ai-study');logpath=out/'read-log.json'
log=json.loads(logpath.read_text(encoding='utf-8')) if logpath.exists() else []
mode=sys.argv[1]
paths=[]
if mode=='overview':
 repos=sorted(p for p in base.iterdir() if p.is_dir())
 for repo in repos[int(sys.argv[2]):int(sys.argv[3])]:
  p=repo/'README.md'
  if not p.exists():
   candidates=list(repo.glob('*/README.md'))
   p=candidates[0] if candidates else next(repo.rglob('*.html'))
  paths.append(p)
else:paths=[Path(p) for p in sys.argv[2:]]
for p in paths:
 s=p.read_text(encoding='utf-8-sig',errors='replace');lines=s.splitlines();printed=[]
 print('\nSOURCE',p.as_posix(),'LINES',len(lines),'CHARS',len(s))
 if mode=='full': printed=list(range(len(lines)))
 else:
  exclude=r'install|sponsor|commercial|contribut|star history|acknowledge|quick ?start|getting started|table of contents|translations|why use|partners|community|connect with|licens|social'
  skip=False;budget=2200
  for i,line in enumerate(lines):
   if re.match(r'^#{1,3} ',line):skip=bool(re.search(exclude,line,re.I))
   if skip or line.lstrip().startswith(('<img','<a ','[![','![','<div','</div','<br','<picture','<source','</picture','<p ','</p','<h','</h')):continue
   if not line.strip():continue
   if budget-len(line)<0:break
   printed.append(i);budget-=len(line)
  print('OTHER_HEADINGS', ' | '.join(re.findall(r'(?m)^#{1,3} .+',s)[-18:]))
 for i in printed:print(str(i+1)+': '+lines[i])
 log.append({'path':p.as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':mode,'total_lines':len(lines),'displayed_lines_1based':[i+1 for i in printed]})
 logpath.write_text(json.dumps(log,ensure_ascii=False,indent=2),encoding='utf-8')

