#!/usr/bin/env python3
"""Build the FINAL-4 preparation package from actual committed sources/evidence."""
import json,re,hashlib,subprocess,collections,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
os.chdir(ROOT)
D=ROOT/'docs/report-assets';D.mkdir(exist_ok=True)
def read(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def rel(p):return os.path.relpath(ROOT/p,D)
def table(headers,rows):return '| '+' | '.join(headers)+' |\n|'+ '|'.join(['---']*len(headers))+'|\n'+''.join('| '+' | '.join(str(v).replace('|','/').replace('\n','; ') for v in row)+' |\n' for row in rows)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
meta=read('docs/uml/manifest.json');canonical=[m for m in meta if m.get('classification')!='HISTORICAL']
assets=[]
def asset(id,typ,path,caption,ch,priority,source,status='VERIFIED',notes='',**extra):
 assets.append(dict(id=id,type=typ,path=rel(path),caption=caption,chapter=ch,priority=priority,source=source,verification=status,sha256=sha(path),notes=notes,**extra))
for m in canonical:
 for fmt in ['svg','png']:
  p=Path('docs/uml/rendered')/fmt/(m['id']+'.'+fmt)
  if p.exists():asset(m['id']+'-'+fmt,'Diagram',str(p),m['title'],m['chapter'],'REQUIRED' if m['classification']=='MAIN_REPORT' else 'APPENDIX','UML',m.get('visualInspectionStatus','PENDING'),m.get('limitations',''),orientation=m.get('orientation','landscape'),umlSource=rel(m['source']))
# selected photos: never classify loading/failure originals as completed screenshots.
screens=[('login','docs/evidence/final3/login-ready.png','Đăng nhập bằng tài khoản nhân viên','REQUIRED'),('users','docs/evidence/final3/users-ready.png','Danh sách tài khoản và vai trò ADMIN','REQUIRED'),('products','docs/evidence/final/products-desktop.png','Quản lý sản phẩm, trạng thái và phân trang','REQUIRED'),('categories','docs/evidence/final3/categories-desktop.png','Quản lý danh mục','RECOMMENDED'),('suppliers','docs/evidence/final3/suppliers-desktop.png','Quản lý nhà cung cấp và trạng thái hợp tác','RECOMMENDED'),('receipt','docs/evidence/final/warehouse-receipt.png','Warehouse lập phiếu nhập DRAFT trước xác nhận','REQUIRED'),('inventory','docs/evidence/final3/inventory-ready.png','Tồn thực tế, reserved và available theo catalog','REQUIRED'),('movements','docs/evidence/final3/movements-desktop.png','Lịch sử biến động nhập/bán và actor','RECOMMENDED'),('adjustments','docs/evidence/final3/adjustments-desktop.png','Phiếu kiểm kê nháp và đã xác nhận','RECOMMENDED'),('approval','docs/evidence/final3/manager-approval-dialog.png','Hộp thoại duyệt kiểm kê; chưa submit mutation','RECOMMENDED'),('pos','docs/evidence/final/pos-ready.png','Prepare đã giữ hàng và hiển thị giá chính thức','REQUIRED'),('cash','docs/evidence/final3/pos-cash-focus.png','Hóa đơn tiền mặt hoàn tất (crop ảnh gốc)','RECOMMENDED'),('bank','docs/evidence/final/pos-bank-completed.png','Chuyển khoản xác nhận thủ công','RECOMMENDED'),('invoice','docs/evidence/final/invoice-desktop.png','Hóa đơn COMPLETED và tiền thừa','REQUIRED'),('report','docs/evidence/final3/reports-revenue-only.png','Doanh thu năm2026:34 hóa đơn, gồm fixture timezone','REQUIRED'),('dashboard','docs/evidence/final3/dashboard-ready.png','Dashboard ngày25/11/2026; không có giao dịch mới','RECOMMENDED'),('denied','docs/evidence/final3/role-denied.png','Warehouse bị chặn màn hình quản lý tài khoản','RECOMMENDED'),('mobile','docs/evidence/final3/navigation-mobile-ready.png','Drawer điều hướng trên mobile theo role Warehouse','RECOMMENDED'),('retry','docs/evidence/final3/payment-retry-focus.png','Thanh toán thành công sau retry cùng key (crop)','APPENDIX'),('error','docs/evidence/final/products-error.png','Trạng thái lỗi mạng có nút thử lại','APPENDIX'),('empty','docs/evidence/final/products-empty.png','Tìm kiếm không có kết quả','APPENDIX'),('print','docs/evidence/final3/invoice-print-page-1.png','Trang in hóa đơn từ PDF thực tế','REQUIRED')]
for id,p,cap,prio in screens:
 if Path(p).exists():asset('screen-'+id,'Image',p,cap,5,prio,'PDF' if id=='print' else 'Screenshot',notes='Demo/test fixtures, not customer records. See screenshot-review.json for source and crop provenance.')
asset('invoice-pdf','PDF','docs/evidence/final/invoice-print.pdf','Bản in hóa đơn Chromium; không kiểm thử máy in vật lý',5,'APPENDIX','PDF')
for name in ['acceptance.json','acceptance-runs.json','quality-gates.json','quality-gates.log','data-invariants.json','performance.json','compose-ps.json','topology.json','openapi.json','correlation.json','api-boundaries.json','provenance.json']:
 asset('evidence-'+name,'Evidence','docs/evidence/final/'+name,name,5,'APPENDIX','Test evidence',notes='Historical FINAL-2; do not relabel as rerun on current HEAD.')
for name in ['runtime-current.json','queues-current.json','requirement-reconciliation.json','invoice-pdf-review.json']:
 asset('final3-'+name,'Evidence','docs/evidence/final3/'+name,name,5 if 'requirement' not in name else 1,'APPENDIX','Test evidence',notes='FINAL-3 read-only review/snapshot, not acceptance-suite rerun.')
# Code excerpts: exact HEAD bytes and line spans; no prettifying/editing within snippets.
S='apps/sales-service/src/modules/sales/';O='apps/sales-service/src/modules/outbox/';R='apps/report-service/src/modules/report/';I='apps/inventory-service/src/modules/inventory/'
choices=[('factory','Factory Method',S+'domain/payment/payment.creator.ts',1,18,4),('strategy','Strategy — cash',S+'domain/payment/cash-payment.strategy.ts',5,24,4),('builder','Builder — validation snapshot',S+'domain/invoice.builder.ts',16,40,4),('facade','Facade — confirm/cancel',S+'application/checkout.facade.ts',34,47,4),('saga','Saga — reconcile COMMIT',S+'application/checkout-orchestrator.ts',82,100,3),('outbox','COMPLETED + Outbox atomic',S+'infrastructure/prisma-invoice.repository.ts',0,0,2),('consumer','Idempotent projection',R+'infrastructure/prisma-projection.repository.ts',11,35,5),('concurrency','Inventory advisory lock',I+'infrastructure/inventory-transaction.ts',4,16,3)]
ex=[];text='# Code excerpts từ source thực tế\n\nHEAD '+head+'. Mỗi khối là đoạn nguyên văn (không phải file độc lập), không thêm dấu ba chấm hoặc sửa định dạng code. Line numbers1-based. Trạng thái test là lịch sử FINAL-2; source file hiện tại khớp HEAD và SHA256. Chỉ gán đóng góp thành viên khi có xác nhận riêng.\n\n'
for id,title,p,start,end,ch in choices:
 raw=Path(p).read_bytes();assert raw==subprocess.check_output(['git','show',head+':'+p]),p
 lines=raw.decode().splitlines()
 if not start:start=next(i+1 for i,l in enumerate(lines) if 'await tx.outboxEvent.create' in l);end=start+9
 end=min(end,len(lines))
 code='\n'.join(lines[start-1:end]);entry={'id':id,'title':title,'source':p,'startLine':start,'endLine':end,'sha256':sha(p),'excerptSha256':hashlib.sha256(code.encode()).hexdigest(),'code':code};ex.append(entry)
 text+='## '+title+'\n\nSource: ['+p+']('+rel(p)+'), lines '+str(start)+'–'+str(end)+'.\n\n```ts\n'+code+'\n```\n\n'
 asset('code-'+id,'Code',p,title,ch,'RECOMMENDED','Code',startLine=start,endLine=end,excerptSha256=entry['excerptSha256'])
(D/'code-excerpts.md').write_text(text);(D/'code-excerpts.json').write_text(json.dumps(ex,ensure_ascii=False,indent=2)+'\n')
# Chapter plan reflects the actual document, including accidental heading levels.
blocks=read('docs/evidence/final3/docx-structure.json');heads=[b for b in blocks if b['style'] in ['Heading1','Heading2']]
plan='''# Kế hoạch cập nhật DOCX — FINAL-4 (chưa chỉnh DOCX)

Nguồn: Bao_cao_Nhom_06_Sieu_thi_mini.docx, document.xml body blocks theo docx-structure.json. Bản gốc là thiết kế trước triển khai, có hình/đoạn placeholder. Giữ bìa, thông tin nhóm/giảng viên và số/tên chương gốc. Không tự thêm đóng góp đã hoàn thành cho từng thành viên từ bảng phân công dự kiến.

| Phần / blocks gốc | Giữ | Sửa hoặc bổ sung | Hình / bảng / code / nguồn | Lưu ý |
|---|---|---|---|---|
| Mở đầu23–30 | Lý do, phạm vi một store, bảng phân công gốc | Nêu sản phẩm thực tế và kết quả có ngày/provenance | architecture-summary; test-summary; source report | Phân công dự kiến không đồng nghĩa chứng minh ai viết code |
| Ch1 32–61; 1.3/1.4/1.6 | Nhóm FR/BR/NFR gốc và4 vai trò | Duyệt71 ID chưa được neo riêng; trình bày79 runtime-supported/7 partial/1 unit/1 source | requirement-summary; reconciliation88 rows; bảng RBAC | Không tự đặt nghĩa chính thức hoặc ghi88 runtime PASS |
| Ch2 63–106 | Microservices, Client–Server, Layered, REST, EDA,5 DB | Dùng tên service/port/network thật; thêm catalog zero-stock, live session, actor/cid, retry mandatory; sửa row-lock mô tả thành advisory lock V1 | Component/Layered/Deployment; ownership, versions, trade-offs; snippets Outbox | Gateway không DB; không cross-DB FK/query;3300 chỉ test override |
| Ch3 108–163 | Các mục3.1–3.10, cấu trúc UML theo nhóm | Thay lớp dự kiến bằng actual ports/classes; thêm prepare/confirm/cancel/recovery;5 trạng thái;5 ERD (Inventory2 phần) | UML manifest, figure catalog; activity reserve | Draft không status trước persistence; state transitions ở repository, không Invoice entity methods |
| Ch4 165–200 | Thứ tự gốc:4.1 Factory;4.2 Builder;4.3.1 Facade;4.3.2 Strategy;4.4 SOLID |4 diagram riêng, snippet nguyên văn, test refs và trade-off | final3-gof-*; design-patterns.md; code-excerpts | Không đổi Builder sang Director giả; bank manual; Repository/Saga không tính GoF |
| Ch5 202–227 | Các mục5.1–5.6 | Đổi “dự kiến/chưa chạy” thành nguồn/kết quả có ngày; TC01–15 map tới actual IDs; runtime, screenshots, benchmark | table-catalog; test-summary; screenshot/PDF; evidence manifest/provenance |65 Jest và44 groups tách riêng; benchmark READ; lỗi screenshot không là hình happy path |
| Kết luận229–236 | Giới hạn một store, không ngân hàng/HA | Kết quả đạt được có điều kiện; remaining limitations; hướng phát triển phù hợp | known-limitations; requirement-summary | Không biến local demo thành chứng minh production SLA |
| Phụ lục238–243 | Tài liệu tham khảo gốc | UML appendix, OpenAPI, full trace, code paths/hashes, provenance | assets-manifest.json, UML manifest, evidence refs | Không in secrets/demo key/token/connection URLs |

## Heading outline thực tế

Word styles gốc gán Heading1 cho nhiều tiểu mục (1.3,1.5,1.6,2.3…); FINAL-4 cần sửa hierarchy styles và tái tạo TOC/list figures, giữ số/tên nội dung. Không thay bằng cấu trúc gợi ý khác. Số trang hiện tại chỉ là placeholder, cập nhật tự động sau khi chèn assets.

'''
plan+=table(['Body block','Word style','Heading nguyên bản'],[(b['index'],b['style'],b['text']) for b in heads]);(D/'report-update-plan.md').write_text(plan)
# all complete tables derived from evidence/source
q=read('docs/evidence/final/quality-gates.json');accept=read('docs/evidence/final/acceptance.json');assert len(accept)==len({a['id'] for a in accept})==44 and all(a['result']=='PASS' for a in accept)
bench=read('docs/evidence/final/performance.json');inv=read('docs/evidence/final/data-invariants.json');rec=read('docs/evidence/final3/requirement-reconciliation.json');runtime=read('docs/evidence/final3/runtime-current.json')
log=Path('docs/evidence/final/quality-gates.log').read_text();counts=[tuple(map(int,m)) for m in re.findall(r'Test Suites:\s+(\d+) passed, (\d+) total',log)];tests=[tuple(map(int,m)) for m in re.findall(r'Tests:\s+(\d+) passed, (\d+) total',log)];assert sum(a for a,b in counts)==24 and sum(a for a,b in tests)==65
summary='''# Test summary để dùng Chương5

Đây là review kết quả lịch sử FINAL-2 (24/11/2026), không phải chạy lại suites tại fe96c3e hoặc working tree FINAL-3. 44 unique case IDs được tổng hợp latest-result; full invocation41 + browser final8 + D01/D02 + A18 có overlap, không cộng thành tổng lượt test. Source/logs được kiểm tra tồn tại và đối chiếu nội dung. R01 health thật độc lập với6 health specs mocked Prisma.

'''+table(['Nhóm','Suites','Cases/groups','Passed','Failed','Skipped','Nguồn'],[['Jest pure unit',18,59,59,0,0,'quality-gates.log; health specs excluded'],['Jest HTTP health (mock DB ports)',6,6,6,0,0,'6 health.spec.ts; not DB integration'],['Real API/runtime/SQL','—',23,23,0,0,'R01–03,A01–18,D01–02'],['Fault injection (real DB/broker)','—',12,12,0,0,'F01–12'],['Browser E2E','—',8,8,0,0,'U01–08'],['Benchmark','—',1,1,0,0,'P01'],['DEV-6 regression','—','5 overlapping groups','PASS',0,0,'dev6.log; not added to44']])
summary+='\n## Quality gates\n\n'+table(['Command','Exit','Result','Log'],[(r['command'],r['exitCode'],r['result'],'../evidence/final/quality-gates.log') for r in q])
summary+='\n##44 IDs và labels thực tế\n\n'+table(['ID','Nội dung','Kết quả'],[(a['id'],a['label'],a['result']) for a in accept])
summary+='\n## TC01–15 trong DOCX block213\n\n'+table(['Original TC','Actual refs'],list(zip(['TC'+str(i).zfill(2) for i in range(1,16)],['A01','A03,A18','A04','A06,U02','A06','A08','A09','A10,U04,U08','A10','F01','F01','F02','F02','F03','A10'])))
summary+='\n## Benchmark (READ only)\n\nHardware: '+bench['host']['cpu']+', '+str(bench['host']['cpus'])+'CPU, '+str(bench['host']['memoryBytes'])+' bytes host; '+bench['docker']+'. macOS arm64, Node'+bench['host']['node']+'. Dataset '+str(bench['dataset'])+'. Protected Gateway with live-session checks.\n\n'
summary+=table(['Endpoint','Clients','Requests','Seconds','P50 ms','P95 ms','Max ms','Error rate'],[(r['endpoint'],r['concurrency'],r['requests'],r['durationSeconds'],r['p50'],r['p95'],r['max'],r['errorRate']) for r in bench['measurements']])
summary+='\n## Data consistency\n\n'+table(['Snapshot','Invoices total','COMPLETED','Payments','Facts','SENT outbox','Reservation/movement'],[['FINAL-2 historical',inv['invoices'],inv['completed'],'One per completed (D01)',inv['reportFacts'],inv['outbox'],'COMMITTED; actor/quantity/stock reconcile'],['FINAL-3 read-only',sum(x['count'] for x in runtime['invoices']),next(x['count'] for x in runtime['invoices'] if x['status']=='COMPLETED'),runtime['payments'][0]['count'],runtime['facts'][0]['count'],next(x['count'] for x in runtime['outbox'] if x['status']=='SENT'),'See runtime-current.json; no new sales created']])
summary+='\nCurrent read-only snapshot time: '+runtime['capturedAt']+'. Auth captures may create refresh-session metadata only. No data changed to preserve34. Runtime files contain9 healthy containers; historical20 cross-DB denials A14; durable main/retry/dead queues and basic-return failure F05. No physical printer, production HTTPS/HA/backup-restore tests.\n'
(D/'test-summary.md').write_text(summary)
# table catalog contains actual complete tables, not only suggestions
text='''# Table catalog — dữ liệu sẵn để chèn DOCX

Số bảng là đề xuất, FINAL-4 dùng Word captions chính thức. Các nguồn lịch sử giữ ngày/provenance, không gán cho HEAD mới. Các bảng test, TC, consistency và benchmark hoàn chỉnh nằm trong [test-summary](test-summary.md), được xem là phần tiếp nối của catalog này.

## Bảng2.1 — Microservices và database ownership

Nguồn: compose.yaml, Prisma schemas. Ch2.\n\n'''
services=[('Identity','3001','identity_db / identity_user','Tài khoản, JWT/session'),('Product','3002','product_db / product_user','Danh mục, giá và barcode'),('Inventory','3003','inventory_db / inventory_user','NCC/phiếu/tồn/reservation'),('Sales','3004','sales_db / sales_user','Checkout/payment/invoice/outbox'),('Report','3005','report_db / report_user','Projection/doanh thu')]
text+=table(['Service','Internal port','DB / owner','Trách nhiệm'],services)
text+='\nGateway8080 không DB; Web3000 nội bộ/Nginx. Chỉ publish WEB_PORT(default3000, test3300) và GATEWAY_PORT(default8080). PostgreSQL1 instance,5 DB credentials riêng, chỉ FKs trong từng DB.\n\n## Bảng5.1 — Technology versions\n\nNguồn: manifests/lockfile/compose và environment log.\n\n'
versions=[('Node','22.22.2'),('pnpm','10.32.1')]
for app,packages in [('web',['react','vite','antd','typescript','@tanstack/react-query','zustand','axios']),('sales-service',['@nestjs/core','prisma','@prisma/client','amqplib'])]:
 data=read('apps/'+app+'/package.json');deps={**data.get('dependencies',{}),**data.get('devDependencies',{})}
 for pkg in packages:
  if pkg in deps:versions.append((pkg,deps[pkg]))
versions +=[('PostgreSQL','17.7-bookworm'),('RabbitMQ','4.2.1-management-alpine'),('PlantUML tool (FINAL-3)','1.2025.10 / Java17.0.18; Smetana')];text+=table(['Công nghệ','Phiên bản'],versions)
text+='\n## Bảng1.1 — RBAC thực tế\n\nNguồn: docs/actor-permissions.md + guards/navigation.\n\n'+Path('docs/actor-permissions.md').read_text().split('\n\n',1)[1]
text+='\n## Bảng4.1 — GoF và class\n\n'+table(['Pattern','Actual classes','Test'],[['Factory Method','PaymentCreator; CashPaymentCreator; BankTransferPaymentCreator','payment-patterns.spec.ts'],['Strategy','PaymentStrategy; CashPaymentStrategy; BankTransferStrategy; context PaymentService','payment-patterns.spec.ts'],['Builder','InvoiceBuilder → InvoiceDraft; client InvoiceService','invoice.builder.spec.ts'],['Facade','CheckoutFacade → InvoiceService/PaymentService/CheckoutOrchestrator','checkout.facade.spec.ts']])
text+='\n## Bảng5.2–5.6 — Quality/test/TC/data/performance\n\nCác bảng đầy đủ trong [test-summary](test-summary.md), nguồn quality-gates.json/log, acceptance.json, data-invariants.json, performance.json, runtime-current.json.\n\n## Bảng1.2 — Requirement coverage\n\n'+table(['Nhóm','Dòng đề xuất','Runtime supported','Partial','Unit only','Source only'],[(prefix,sum(r['proposedId'].startswith(prefix) for r in rec),*[sum(r['proposedId'].startswith(prefix) and r['verification']==status for r in rec) for status in ['RUNTIME_SUPPORTED','PARTIAL','UNIT_ONLY','SOURCE_REVIEW']]) for prefix in ['FR','BR','NFR']])
text+='\n71 ID NEEDS_CONFIRMATION,17 có anchor. Không gọi88 runtime PASS; xem requirement-id-reconciliation.md.\n\n## Bảng5.7 — Hạn chế\n\n'+table(['Giới hạn','Ảnh hưởng','Nguồn'],[['Single store/replica; global advisory locks','No HA/multi-replica SLA','architecture-current, code'],['Two READ benchmarks only','No full CRUD/write latency claim','performance.json'],['Manual transfer, browser PDF','No real bank or physical printer','Strategy/U03'],['No operator/DLQ UI; recovery20','Reconcile original key/payment/reservation','F11/runbook'],['Multi-tab refresh, in-process rate limit','May require login; not distributed','auth contract'],['Original grouped IDs, no old source hash manifest','Numbering review; limited commit provenance','reconciliation/provenance'],['StockMetrics text stale','Label says initialized rows though catalog-wide48 vs10 DB rows','source StockMetrics; read-only screenshot']])
(D/'table-catalog.md').write_text(text)
(D/'architecture-summary.md').write_text('''# Architecture summary cho Ch2/3

Một Web React/Vite, API Gateway Nest,5 business services và PostgreSQL/RabbitMQ, tổng9 container. PostgreSQL có5 DB/user, không cross-DB query hoặc FK. Gateway nối public/private networks, không DB, proxy allowlist public; /internal/v1 không public. Web Nginx proxy API/health. Default host3000/8080; nghiệm thu dùng3300/8080.

Layered: presentation → application → domain ports; infrastructure Prisma/HTTP realize ports; composition root nối bằng DI tokens. Shared packages chỉ kỹ thuật. Inventory gọi Product catalog pages và batch, ghép inventory rows và zero defaults; lowStock available<=threshold, summary gồm catalog, không chỉ10 inventory rows. Sales kiểm tra price/ACTIVE, Builder tạo InvoiceDraft; repository lưu default PENDING/RESERVE. Không có Invoice domain entity với methods transition; state đổi trong repositories và assertCanConfirm/assertCanCancel.

Saga prepare/reserve/READY; payment trước remote commit; PROCESSING/COMMIT; Inventory commit ghi actor cashier; COMPLETED+Outbox atomic. Persist RELEASE trước release; cancel chỉREADY/no payment. Local TX không mở qua HTTP. Retry phải lookup remote trước side effect, worker5s/attempts<20/backoff<=60s, không auto-refund hay auto-expire. Actor/correlation propagate cùng credential nội bộ; live session forward bearer tới Identity, role check tại backend.

Outbox poll2s, persistent mandatory + publisher confirm + return check rồi SENT. Consumer validate/dedup/event+facts TX rồi manual ACK; transient retry durable10s queue, mandatory return handling, retry budget5, poison DLQ. At-least-once, không exactly-once/HA. Report đọc projection của mình; stock qua Inventory REST. GMT+7 ngày inclusive/exclusive next midnight.

Khác DOCX: advisory lock V1 thay mô tả row-lock; snapshot lúc draft có thể khác catalog sau này; class dự kiến ReserveStockUseCase/RevenueService/StockClient được thay bằng ReservationService/ReportService/StockPort và adapters thực tế. Không sửa database để khớp thiết kế dự kiến. ERD chỉ FK vật lý; stock_movements/adjustments/product UUID không FK sang inventories hoặc Product DB. Foundation marker và _prisma_migrations được lược bỏ có chú thích.
''')
(D/'known-limitations.md').write_text('''# Known limitations và điều kiện biên

- Local một store/replica; không HA, publisher/recovery leases hoặc distributed rate limit. Advisory lock serialize writes.
- No real bank, physical printer, production HTTPS/Secure-cookie deployment, backup/restore hoặc full dependency security audit.
- P95 chỉ hai protected READ endpoints/dataset nhỏ; không suy rộng CRUD/writes/production.
- Không operator recovery/DLQ replay UI đầy đủ; hết20 retry cần đối soát và giữ original key/payload; không nhận tiền lần hai.
- Refresh single-flight chỉ một tab; lost response/replay có thể yêu cầu login lại.
- Catalog-wide summary/low-stock tuyến tính qua REST pages, không atomic catalog+inventory snapshot.
- P2 phát hiện trong FINAL-3: StockMetrics vẫn ghi “chỉ thống kê sản phẩm đã có bản ghi tồn kho” trong khi code/API catalog-wide48 và DB inventory rows10. Dữ liệu đúng, label cũ sai phạm vi. Không sửa application trong phase tài liệu; ghi chú/không dùng label đó làm định nghĩa trong DOCX. Screenshot revenue-only crop có nguồn giữ nguyên, không sửa số liệu.
-71 IDs chỉ được phân rã đề xuất từ nhóm, cần duyệt;7 mục PARTIAL,1 unit,1 source review. Không88 runtime PASS.
- FINAL-2 tested uncommitted tree at5274c90; fe96c3e contains282 recorded changed paths, but no per-file historical working-tree hash manifest. Không chứng minh exact tested bytes correspond commit; không sửa lịch sử logs.
- Không có live Saga RECOVERY screenshot: snapshot không có RECOVERY. Không tạo fault mới chỉ để chụp; dùng diagrams và F07–F11 logs, UI warning source reference. Nếu cần ảnh thực trạng này ở FINAL-4 thì chạy fault có kiểm soát riêng, không mock.
- Diagram full technical sequences và full Inventory ERD ở appendix; dùng split figures cho A4. A4 rendering previews hỗ trợ layout, không là screenshot runtime.
''')
(D/'requirement-summary.md').write_text('''# Requirement summary cho Ch1 và Kết luận

88 dòng là57 FR +21 BR +10 NFR được đề xuất phân rã từ8 nhóm FR/10 nhóm BR/6 hàng NFR gốc.17 IDs có anchor riêng ở phụ lục/nguồn,71 NEEDS_CONFIRMATION. Không đổi numbering DOCX. FR48 giữ snapshot/tra cứu, FR49 đề xuất in; FR45–47 chỉ anchored theo nhóm. BR02 khóa tài khoản nhưng phụ lục TC01 là sai password, cần duyệt.

'''+table(['Nhóm','Runtime-supported','Partial','Unit-only','Source-only'],[(prefix,*[sum(r['proposedId'].startswith(prefix) and r['verification']==status for r in rec) for status in ['RUNTIME_SUPPORTED','PARTIAL','UNIT_ONLY','SOURCE_REVIEW']]) for prefix in ['FR','BR','NFR']])+'''
Runtime-supported phản ánh assertion có liên quan trong lịch sử, không bao hàm mọi trường hợp. Partial: FR16/17/19/34, BR20, NFR01/07; unit-only BR07; source-only NFR04. Tham chiếu đã sửa: FR05→A15/U06, FR15/BR11→A16, FR55→A05/D02. Không chạy lại acceptance để làm số đẹp. Bảng đầy đủ: ../requirement-id-reconciliation.md, JSON ../evidence/final3/requirement-reconciliation.json.
''')
# Figure catalog: numbering proposal, preserve original pattern ordering.
figs=[];counter=collections.Counter()
fixed={'component':'2.1','final3-layered-sales':'2.2','final3-seq-outbox-publish':'2.3a','final3-seq-outbox-project':'2.3b','final3-seq-retry-dlq':'2.3c','final3-seq-recovery':'2.4','use-case-overview':'3.1','final3-class-sales':'3.2a','final3-class-inventory-stock':'3.2b','final3-seq-prepare-snapshot':'3.3a','final3-seq-prepare-reserve':'3.3b','final3-seq-confirm-payment':'3.3c','final3-seq-confirm-commit':'3.3d','final3-state-invoice':'3.4a','final3-state-reservation':'3.4b','final3-activity-reserve':'3.5','final3-erd-identity':'3.6','final3-erd-product':'3.7','final3-erd-inventory-receipts':'3.8a','final3-erd-inventory-stock':'3.8b','final3-erd-sales':'3.9','final3-erd-report':'3.10','deployment':'3.11','final3-gof-factory':'4.1','final3-gof-builder':'4.2','final3-gof-facade':'4.3','final3-gof-strategy':'4.4'}
for m in canonical:
 id=m['id'];num=fixed.get(id)
 if not num:counter['A']+=1;num='A.'+str(counter['A'])
 figs.append(['Hình '+num,m['title'],rel('docs/uml/rendered/png/'+id+'.png'),'4.'+{'final3-gof-factory':'1','final3-gof-builder':'2','final3-gof-facade':'3.1','final3-gof-strategy':'3.2'}.get(id,'') if m['chapter']==4 else 'Ch'+str(m['chapter']),m.get('limitations',''),m['classification']])
for i,(id,p,cap,prio) in enumerate(screens,1):
 if Path(p).exists():figs.append(['Hình5.'+str(i),cap,rel(p),'5.3–5.5','Actual screenshot/PDF; see provenance notes',prio])
(D/'figure-catalog.md').write_text('# Figure catalog (numbering đề xuất)\n\nGiữ mapping captions gốc khi có; a/b và A.x là đề xuất, FINAL-4 tạo captions/TOC tự động và kiểm tra collisions. Không cần dùng mọi hình main; xem priority. SVG cho vector, PNG tương thích Word. Dùng khổ A4 theo orientation/A4-preview metadata, không co diagram lớn thành hình nhỏ.\n\n'+table(['Proposed Figure ID','Caption tiếng Việt','Source Path','Target Section','Description','Priority'],figs))
(D/'assets-manifest.json').write_text(json.dumps({'head':head,'pathsRelativeTo':'docs/report-assets','historicalEvidenceDate':'2026-11-24','noDocxEdit':True,'assets':assets},ensure_ascii=False,indent=2)+'\n')
(D/'README.md').write_text('''# FINAL-4 preparation package

Đọc theo thứ tự: **report-update-plan.md → requirement-summary.md + ../requirement-id-reconciliation.md → figure-catalog.md/table-catalog.md → code-excerpts.md → assets-manifest.json**. Source DOCX/Master giữ nguyên. Branch main/HEAD '''+head+'''; FINAL-3 chỉ chỉnh documentation/tooling/assets, không application/schema.

| File | Mục đích |
|---|---|
| [report-update-plan](report-update-plan.md) | Đối chiếu block/style/heading thực tế của DOCX, việc giữ/sửa/bổ sung từng chương |
| [figure-catalog](figure-catalog.md) | Caption Việt, số đề xuất, vị trí và priority của UML/ảnh |
| [table-catalog](table-catalog.md) | Services, DB, versions, RBAC, GoF, references bảng test/benchmark/coverage/limits |
| [code-excerpts](code-excerpts.md) + [JSON](code-excerpts.json) |8 trích đoạn nguyên văn, path/line range/HEAD/hash cho kiểm tra tự động |
| [test-summary](test-summary.md) | Counts đã đối chiếu logs,44 IDs, TC01–15 mapping, gates/data/benchmark |
| [architecture-summary](architecture-summary.md) | Mô tả triển khai thật và khác thiết kế dự kiến |
| [known-limitations](known-limitations.md) | Giới hạn sản phẩm/evidence/provenance, P2 StockMetrics label |
| [requirement-summary](requirement-summary.md) | Coverage phân cấp +71 ID cần duyệt, không88 runtime PASS |
| [assets-manifest](assets-manifest.json) | Relative paths, captions, source/verification, SHA256, excerpts |

UML nguồn/ảnh đầy đủ ở ../uml/manifest.json và ../uml/rendered/{svg,png}; hình legacy được giữ HISTORICAL, không dùng làm current report. Evidence nguồn FINAL-2 giữ nguyên; evidence bổ sung ở ../evidence/final3. Không chạy lại full suites vì application không đổi. Screenshots mới chỉ đọc dữ liệu/đăng nhập, không tạo hóa đơn hoặc submit approval.

Đủ tư liệu để soạn FINAL-4; cần nhóm duyệt nghĩa71 ID và đóng góp thành viên, quyết định có cần ảnh live RECOVERY riêng không. Không bắt buộc chạy lại hệ thống/tests nếu chấp nhận snapshot có provenance; nếu sửa code/P0/P1 hoặc muốn tuyên bố commit mới đã acceptance thì phải chạy kiểm thử phù hợp và giữ kết quả mới riêng. Không gán65/44 PASS lịch sử cho HEAD mới.
''')
print(len(assets),'assets;',len(ex),'verbatim excerpts')
