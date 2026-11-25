# FINAL local acceptance checklist

- [x] Active main includes DEV-0–7; start 5274c90, initial clean tree
- [x] Original Master/DOCX preserved (SHA256 evidence)
- [x] AMQP lockfile synchronized; frozen install
- [x] Generate, format, build, lint, typecheck, Jest and format check
- [x] Seven application images built; Web rebuilt with OpenSSL
- [x] Nine containers healthy; only Web/Gateway host ports
- [x] Five DB fresh startup migrations; replay + Prisma diff, seed twice preserving edits, production seed guard
- [x] Four roles, direct API permissions/revocation/ownership; twenty cross-DB denials
- [x] DEV-6 business and outage regression
- [x] FINAL real PostgreSQL/RabbitMQ concurrency, timeout, restart, retry/DLQ/recovery/timezone tests
- [x] SQL/API data invariants and report quantity/top/payment/low-stock reconciliation
- [x] Browser happy path, Admin UI, roles/session/single-flight, forms/loading/empty/error, responsive and print/PDF
- [x] Interrupted prepare and payment preserve original keys across refresh; actor cart isolation
- [x] 20-client representative READ benchmark with actual timings
- [x] 88 requirement rows, docs and actual evidence manifest
- [x] FINAL-3: synchronize/render/inspect UML; [report package](report-assets/README.md) prepared
- [ ] FINAL-4: approve71 grouped requirement IDs before making individual definitions official
- [ ] FINAL-4: update DOCX after FINAL-3 review

Local demo acceptance passes with scope limits: one store/replica, no external banking, at-least-once delivery, no production HTTPS/HA/backup-restore/physical printer test. No tag/deploy/PR/commit created. Results and rerun provenance: evidence/final/manifest.md. Historical failed harness attempts remain in logs; latest results are 44 unique acceptance cases PASS plus 24 Jest suites / 65 tests PASS.
