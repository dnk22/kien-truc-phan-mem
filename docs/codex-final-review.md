# Handoff sau FINAL review

Current results and limitations: [final-review-progress](final-review-progress.md), [manifest](evidence/final/manifest.md), [88 requirement rows](report-evidence.md). Start branch main / commit 5274c90; no commit or PR created by agent. Source hashes in source-baseline.json; original DOCX/Master unchanged.

Review changes by logical groups: AMQP lockfile; Inventory zero catalog and adjustment; Sales actor/Builder/correlation; Report mandatory retry routing; Gateway OpenAPI/status; frontend recovery/mobile; health test mocks; isolated acceptance harness; documentation. Repository-wide formatting is a separate normalization group requested by quality gate.

Before FINAL-3, read actual outcomes rather than old candidate docs. Reconcile UML with changed contracts, render and inspect diagrams, choose actual screenshots/PDF, and resolve remaining failures/blockers. No automatic report edits, release tag, external deployment or commercial-scope additions.

## Previous pre-FINAL instructions (historical)

# Codex final review handoff

Work on active branch; do not create PR unless requested. Read Prompt_Codex_MiniMart.md and source DOCX, then inspect actual repo. Resolve lockfile first. Run real quality gates and fix errors without weakening TypeScript/ESLint/tests. Pay special attention to generated Prisma client paths, dependency declarations, gateway proxy allowlists/idempotency header, response pagination types, shared component props and lazy route registration. Check existing DEV-1 tests against evolved schema and navigation; preserve their intent.

Execute DEV-6 harness on disposable stack. Add missing real DB and broker tests from dev6-verification.md, including duplicate event, DLQ, concurrent confirm/cancel, stale adjustment, multi-item rollback and restart after remote commit. Verify no cross-DB access, session revoke, role/ownership, internal credential and private routes. Check POS reload/ambiguous payment, multi-tab, retry exhaustion, product absent stock, price snapshot and receipt history. Ensure seed and migration run twice safely. Measure latency if available. Run browser flows with real data; capture evidence as described in report-evidence.md.

Fix critical functional/security issues before cosmetic refactor. Keep architecture and business scope; avoid new infrastructure. Record actual commands/results, update README and relevant docs/UML, report remaining failures explicitly. Do not fabricate screenshots, metrics or PASS. Final report needs real evidence; no tag/deploy until acceptance.

Render and inspect the UML index in docs/uml/README.md and reconcile with fixes. Complete docs/release-checklist.md and docs/evidence/final/manifest.md with actual results. FR/BR/NFR traceability is grouped; expand against the original report if individual requirement evidence is required.
