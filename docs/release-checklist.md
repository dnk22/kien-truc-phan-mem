# DEV-7 release checklist

## Source preparation
- [x] Release and demo runbooks
- [x] Current component, deployment and overview use-case PlantUML
- [x] Five schema-derived ERDs
- [x] Class, state, sequence and GoF diagram index
- [x] Current RBAC matrix and API index
- [x] Grouped FR/BR/NFR traceability and evidence manifest template
- [x] Codex handoff

## Mandatory local gates (not executed)
- [ ] Synchronize AMQP lockfile and verify frozen install
- [ ] Format, build, lint, typecheck, unit tests
- [ ] Render PlantUML, inspect diagrams and reconcile against final source
- [ ] Compose config, fresh migration/seed, service health, database isolation
- [ ] DEV-1 regressions and DEV-6 business/fault checks
- [ ] Manual cases in dev6-verification.md
- [ ] Browser role flows, responsive UI, print, screenshots
- [ ] Measure latency or explicitly disclose NOT RUN
- [ ] Demo rehearsal, update actual evidence and final architecture
- [ ] Report DOCX update after verification
- [ ] Release tag only after acceptance and authorization

No release readiness claim. Known blockers and remaining gaps: see release.md and codex-final-review.md. No fabricated evidence.
