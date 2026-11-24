# Final evidence manifest (template; no results yet)

Commit: NOT RECORDED
Date/time/timezone: NOT RECORDED
Node/pnpm/Docker/Compose: NOT RECORDED
Environment: disposable local demo only

| Check | Command / method | Result | Evidence |
|---|---|---|---|
| Frozen install | pnpm install --frozen-lockfile | BLOCKED pending lockfile | — |
| Build/lint/typecheck/format | root scripts | NOT RUN | — |
| Unit tests | pnpm test | NOT RUN | — |
| UML render | plantuml -tsvg docs/uml/*.puml | NOT RUN | — |
| Fresh migration/seed | docker compose | NOT RUN | — |
| Business integration | pnpm verify:dev6 | NOT RUN | — |
| Fault injection | VERIFY_FAULTS=true | NOT RUN | — |
| DB isolation / invariants | SQL and API assertions | NOT RUN | — |
| Browser/print | actual UI | NOT RUN | — |
| P95 performance | measured benchmark | NOT RUN | — |

Replace template statuses only with observed results, record exact commands and environment, redact secrets. Historical DEV-0/1 evidence is not final evidence.
