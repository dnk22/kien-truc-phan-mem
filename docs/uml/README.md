# UML index – DEV-7

Use PlantUML locally (Java/Graphviz as required): `plantuml -tsvg docs/uml/*.puml`. Rendering has not been executed here. Prefer current component.puml, deployment.puml, use-case-overview.puml and dev7-{identity,product,inventory,sales,report}-erd.puml for the report. The five ERDs derive from current Prisma schemas; technical marker tables included; external UUIDs are not FKs. Existing DEV-2–5 class, sequence, state and pattern diagrams retained; DEV-0 erd-foundation is historical. dev7-inventory-class and dev7-sales-recovery supplement them. Compare with final code after Codex fixes. No rendered images or runtime evidence claimed.

## FINAL-3 synchronization required after accepted review

No database table/schema change in FINAL; five ERDs remain structurally applicable. Reconcile class/sequence/component details with ProductDirectory.list and Inventory catalog merge (including zero stock), actorId on remote stock commit, propagated correlation, Report mandatory retry return/reconnect and the operator notice at recovery limit. Existing Saga state names and the four GoF patterns are unchanged. Render/inspect diagrams before editing DOCX; source hashes must still match until that separately authorized phase. No render or DOCX edit is claimed in FINAL-1/2.
