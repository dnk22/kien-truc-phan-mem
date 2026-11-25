#!/usr/bin/env python3
"""Local-only UML syntax/render. Requires Java and PLANTUML_JAR; no public server."""
import argparse,json,os,subprocess,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--jar',default=os.environ.get('PLANTUML_JAR','/tmp/minimart-final3-tools/plantuml-1.2025.10.jar'));args=p.parse_args()
root=Path(__file__).resolve().parents[2];uml=root/'docs/uml';out=root/'docs/evidence/final3';out.mkdir(parents=True,exist_ok=True)
base=['java','-Djava.awt.headless=true','-DPLANTUML_LIMIT_SIZE=12000','-jar',str(Path(args.jar).resolve()),'-charset','UTF-8','-Playout=smetana']
files=sorted(uml.glob('*.puml'));records=[]
with (out/'render.log').open('w') as log:
 for fmt in ['check','svg','png']:
  dest=uml/'rendered'/fmt
  if fmt!='check':dest.mkdir(parents=True,exist_ok=True)
  cmd=base+(['-checkonly'] if fmt=='check' else ['-t'+fmt,'-o',str(dest)])+[str(f) for f in files]
  log.write('$ '+' '.join(cmd)+'\n');log.flush();start=time.time()
  r=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,timeout=600)
  records.append({'format':fmt,'exitCode':r.returncode,'sourceCount':len(files),'durationSeconds':round(time.time()-start,2),'command':cmd});print(fmt,r.returncode,flush=True)
 (out/'render-commands.json').write_text(json.dumps(records,indent=2)+'\n')
raise SystemExit(1 if any(r['exitCode'] for r in records) else 0)
