#!/usr/bin/env python3
"""Verify FINAL-3 files without modifying application, Word source or old evidence."""
import ast, collections, hashlib, json, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
import os
os.chdir(ROOT)
def read(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
checks=[]
def check(name,ok):
 checks.append({'check':name,'passed':bool(ok)})
 if not ok:print('FAIL',name)
m=read('docs/uml/manifest.json');check('77 unique UML sources',len(m)==77==len({v['id'] for v in m}))
for x in m:
 for field,hfield in [('source','sourceSha256'),('renderedSvg','svgSha256'),('renderedPng','pngSha256')]:
  p=Path(x[field]);check(x['id']+' '+field,p.is_file() and p.stat().st_size>0 and sha(p)==x[hfield])
 for ref in x['references']:check('code reference '+ref,Path(ref).exists())
check('52 current visual reviewed',sum(v['visualInspectionStatus']=='PASS' for v in m)==52)
check('local renderer exits0',all(r['exitCode']==0 and r['sourceCount']==77 for r in read('docs/evidence/final3/render-commands.json')))
assets=read('docs/report-assets/assets-manifest.json')['assets'];check('unique asset IDs',len(assets)==len({a['id'] for a in assets}))
for a in assets:
 p=Path('docs/report-assets')/a['path'];check('asset '+a['id'],p.is_file() and p.stat().st_size>0 and sha(p)==a['sha256'])
for e in read('docs/report-assets/code-excerpts.json'):
 raw=Path(e['source']).read_bytes();code='\n'.join(raw.decode().splitlines()[e['startLine']-1:e['endLine']]);check('verbatim '+e['id'],code==e['code'] and sha(e['source'])==e['sha256'] and hashlib.sha256(code.encode()).hexdigest()==e['excerptSha256'] and raw==subprocess.check_output(['git','show','HEAD:'+e['source']]))
r=read('docs/evidence/final3/requirement-reconciliation.json');ids={x['proposedId'] for x in r};check('88 exact requirement IDs',ids=={f'{p}{i:02}' for p,n in [('FR',57),('BR',21),('NFR',10)] for i in range(1,n+1)})
check('71 unresolved numbering',sum(v['numberingStatus']=='NEEDS_CONFIRMATION' for v in r)==71)
# Check actual referenced acceptance IDs, allowing separate unit/source/DEV6 references.
a=read('docs/evidence/final/acceptance.json');actual={v['id'] for v in a['cases']} if isinstance(a,dict) and 'cases' in a else {v['id'] for v in a} if isinstance(a,list) else set()
for v in r:
 for ref in re.findall(r'\b(?:A|F|U|P|R|D)\d{2}\b',v['testReference']):check('test ref '+ref,ref in actual)
check('44 historical unique acceptance IDs',len(actual)==44)
changed=subprocess.check_output(['git','diff','--name-only','HEAD'],text=True).splitlines();check('no application/schema/lock changes',not any(p.startswith(('apps/','packages/','infrastructure/')) or p in ['pnpm-lock.yaml','compose.yaml','package.json'] for p in changed))
check('Master unchanged',sha('Prompt_Codex_MiniMart.md')=='c5cb173a562ff84868b9dbd7eb0b4c843f3eddad523fe4abb1cdc65a614c20fb')
check('DOCX unchanged',sha('Bao_cao_Nhom_06_Sieu_thi_mini.docx')=='9e2efbe19285007896ee442d593a54769cc9164f1b975b8273ecc6eb4efb435d')
p=read('docs/evidence/final/provenance.json')
for path,h in p['snapshotHashes'].items():
 if path.endswith('/manifest.md'):path='docs/evidence/final3/manifest-final2-original.md'
 check('historical bytes '+path,sha(path)==h)
untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines()
files=[Path(p) for p in untracked if p.endswith('.md')]+[Path('README.md')]+[Path(p) for p in changed if p.endswith('.md')]+list(Path('docs/report-assets').glob('*.md'))+list(Path('docs/evidence/final3').glob('*.md'))+[Path('docs/uml/README.md')]
for f in set(files):
 s=f.read_text();check('nonempty '+str(f),bool(s.strip()))
 for link in re.findall(r'\]\(([^)]+)\)',re.sub(r'```.*?```','',s,flags=re.S)):
  if '://' in link or link.startswith(('#','mailto:')):continue
  target=link.split('#')[0].strip('<>');check(str(f)+' link '+link,(f.parent/target).exists())
 check('no credential literal '+str(f),not re.search(r'-{5}BEGIN [A-Z ]*PRIVATE KEY|postgres(?:ql)?://[^\s]+:[^\s]+@|\beyJ[a-zA-Z0-9_-]{30,}\.',s))
for f in Path('scripts/documentation').glob('*.py'):ast.parse(f.read_text())
for e in read('docs/report-assets/code-excerpts.json'):
 check('markdown verbatim '+e['id'],e['code'] in Path('docs/report-assets/code-excerpts.md').read_text())
for f in [Path('docs/uml/manifest.json'),Path('docs/evidence/final/provenance.json')]+list(Path('docs/report-assets').glob('*.json'))+list(Path('docs/evidence/final3').glob('*.json')):
 read(f);check('JSON valid '+str(f),True)
for record in read('docs/evidence/final3/screenshot-review.json')['records']:
 check('reviewed screenshot hash '+record['path'],sha(record['path'])==record['sha256'])
check('browser captures no pageerror',read('docs/evidence/final3/capture.json')['errors']==[])
import xml.etree.ElementTree as ET
for x in m:
 ET.parse(x['renderedSvg']);raw=Path(x['renderedPng']).read_bytes();check('valid SVG and PNG '+x['id'],raw.startswith(b'\x89PNG\r\n\x1a\n') and raw.endswith(b'IEND\xaeB`\x82'))
for f in [Path(p) for p in untracked if Path(p).suffix in ['.md','.json','.puml','.mjs','.py','.log']]:
 check('no sensitive literal '+str(f),not re.search(r'-{5}BEGIN [A-Z ]*PRIVATE KEY|postgres(?:ql)?://[^\s]+:[^\s]+@|\beyJ[a-zA-Z0-9_-]{30,}\.',f.read_text()))

result={'passed':all(c['passed'] for c in checks),'checks':len(checks),'failures':[c for c in checks if not c['passed']],'umlCount':len(m),'assetCount':len(assets),'applicationTests':'NOT_RERUN_DOCUMENTATION_ONLY'}
Path('docs/evidence/final3/documentation-checks.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));raise SystemExit(0 if result['passed'] else 1)
