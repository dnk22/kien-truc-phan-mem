# FINAL-3 — UML Synchronization, Rendering & Evidence Preparation

Hoàn tất F3.0–F3.14 trên main, HEAD bắt đầu/kết thúc **fe96c3eda789f8d88ea9482c8fe7fe82a02a7ca1**. Initial tree clean; không branch/commit/PR/tag/push. Parent5274c90; local origin/main cùng HEAD, không fetch để suy diễn remote state. Không chỉnh apps/packages/infrastructure/Compose/lockfile hoặc DOCX/Master. Bản kê file [changed-files](evidence/final3/changed-files.json).

## Kết quả từng phase

| Phase                     | Kết quả                                                                                                                                  | Minh chứng                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| F3.0 Discovery            | DONE; đọc Master/DOCX/source/docs/evidence; ghi28 UML ban đầu, baseline hashes và outline Word                                           | uml-before.json; docx-structure.json; provenance.json                     |
| F3.1 Architecture         | DONE; Web/Gateway/5 services/5 DB/broker, internal calls, credentials/correlation/actor/catalog zero-stock,9 containers/networks/volumes | component; deployment; layered Sales                                      |
| F3.2 Use Case             | DONE; tổng quan4 role và5 nhóm; ADMIN không kế thừa business MANAGER                                                                     | use-case-overview; final3-usecase-\*                                      |
| F3.3 Class                | DONE;7 module views dựa port/class thực tế, không Invoice entity/transition methods giả                                                  | final3-class-\*                                                           |
| F3.4 GoF                  | DONE;4 diagram riêng + source/roles/flow/snippet/tests/trade-offs                                                                        | design-patterns.md                                                        |
| F3.5 Sequence             | DONE;19 current views, tách prepare/confirm/outbox cho A4; auth/catalog/receipt/adjustment/cancel/recovery/retry                         | UML manifest                                                              |
| F3.6 State                | DONE;5 diagrams; invoice status/intent, reservation, receipt, adjustment, outbox PENDING/SENT                                            | final3-state-\*                                                           |
| F3.7 ERD                  | DONE;5 full schemas+2 Inventory subsets; FK vật lý, SQL constraints và logical external references                                       | final3-erd-\*                                                             |
| F3.8 Rendering            | DONE;77 syntax/SVG/PNG PASS;52 current visual reviewed;25 historical giữ nguồn/render, không selected                                    | render-commands.json; render.log; visual-review.json                      |
| F3.9 Evidence             | DONE;35 PNG reviewed (19 original+12 browser bổ sung+3 crops+1 PDF page);22 selected images và1 PDF                                      | screenshot-review.json; capture.json; crops.json; invoice-pdf-review.json |
| F3.10 Tests               | DONE; review historical65 Jest/44 unique IDs, benchmark/data/runtime; không rerun suites                                                 | report-assets/test-summary.md                                             |
| F3.11 Requirements        | DONE;88 rows:79 runtime-supported/7 partial/1 unit/1 source;71 numbering NEEDS_CONFIRMATION                                              | requirement-id-reconciliation.md                                          |
| F3.12 Provenance          | DONE; giữ logs/JSON gốc;282 changed paths match commit; không có old working-tree hashes để chứng minh byte identity                     | evidence/final/provenance.json; manifest.md                               |
| F3.13 DOCX package        | DONE;11 files,151 assets,8 code excerpts nguyên văn/HEAD/hash; chapter plan theo block/style thực tế                                     | report-assets/README.md                                                   |
| F3.14 Documentation gates | DONE; syntax/render, links/files/hashes, JSON/IDs/excerpts/source preservation, formatter/lint                                           | documentation-checks.json; quality-gates.json/log                         |

Các đường dẫn evidence không có prefix trong bảng ở docs/evidence/final3, trừ provenance/manifest lịch sử ở docs/evidence/final. Danh mục chính: [UML](uml/README.md), [report package](report-assets/README.md), [reconciliation](requirement-id-reconciliation.md).

## Lệnh và môi trường

Java Zulu17.0.18, PlantUML1.2025.10 JAR ngoài repo; Python3.11, Pillow11.3.0/PyMuPDF1.24.14 chỉ phục vụ review; Chrome/Playwright1.57.0 cho screenshots. Không nâng application dependencies. Không có dot/plantuml command: Java -version/JAR -version xác nhận version; JAR -version exit16 do thiếu dot; check/render dùng Smetana exit0. Không dùng public rendering server. [PlantUML Smetana](https://plantuml.com/smetana02).

```sh
python3 scripts/documentation/render-uml.py --jar /tmp/minimart-final3-tools/plantuml-1.2025.10.jar
python3 scripts/documentation/prepare-report-assets.py
python3 scripts/documentation/check-report-assets.py
pnpm exec eslint scripts/documentation/capture-final3.mjs --max-warnings=0
git diff --check
```

Renderer lưu3 commands, exit0 từng bước (check/svg/png). Documentation gate lưu lệnh, exit, log thực tế; Prettier chỉ các file tài liệu mới/đã sửa, embedded-language-formatting off để giữ snippet nguyên văn. Không cần pnpm build/test hoặc full acceptance vì không đổi app.

Capture bổ sung chỉ cần khi muốn cập nhật snapshot: script dùng Chrome tại CHROME_PATH, Playwright từ PLAYWRIGHT_PACKAGE_JSON (mặc định /tmp/minimart-verification/package.json), secret đọc MINIMART_ENV_FILE (mặc định /tmp/minimart-final.env, không in). Stack minimart-final dùng3300/8080. Script đăng nhập, đọc records, mở rồi Hủy approval; không submit business mutations. Thiếu tool/secret thì dừng, không mock ảnh. Không cần chạy lại capture chỉ để soạn Word.

## Runtime và evidence

Khởi động Docker Desktop, khôi phục9 container minimart-final hiện có; không compose down, không reset volume hoặc đụng project khác. Snapshot25/11/2026 giữ55 invoices:34 COMPLETED,7 FAILED,14 CANCELLED;34 payments/facts/SENT. Đăng nhập chụp ảnh tạo auth session metadata. Không sửa business data để duy trì34. [Runtime](evidence/final3/runtime-current.json), [queues](evidence/final3/queues-current.json).

Ảnh gốc login/dashboard/inventory là loading, không dùng như completed page. Report cũ25 hóa đơn ở lượt sớm, report mới year2026 có34/465000 và fixtures timezone; chart là viewport đầu của daily timeline. POS crops giữ state/payment nhưng cạnh phải bảng đã bị clip ở browser gốc; dùng PDF cho bảng hóa đơn đầy đủ. Mobile drawer và approval được chụp sau animation. PDF một A4page:15000, nhận20000, thừa5000; chưa kiểm máy in vật lý.

## Khác biệt và tồn đọng cho review

- **71 NEEDS_CONFIRMATION** là nghĩa riêng của ID phân rã từ bảng nhóm;17 anchors có nguồn. Không phải71 chức năng thiếu. Giữ numbering DOCX, cần nhóm duyệt trước khi viết nghĩa chính thức.
- Partial: FR16/17/19/34,BR20,NFR01/07; BR07 unit-only, NFR04 source-only. Không gọi88 runtime PASS.
- **P2 StockMetrics label**: ghi chỉ sản phẩm đã có record kho trong khi summary catalog-wide48, DB inventory rows10. API/data đúng; không sửa app trong FINAL-3. Caption phải giải thích, không dùng text cũ làm định nghĩa.
- Không có ảnh live Saga RECOVERY do snapshot không ở trạng thái đó; dùng F07–F11 logs+diagram. Không tạo fault chỉ để chụp. Không blocker cho soạn DOCX; nếu bắt buộc ảnh live thì lập lượt fault riêng.
- Historical tested tree tại5274c90 chưa commit, fe96c3e chứa282 paths khớp; không có per-file bytes manifest lúc test nên không chứng minh exact tested commit. Không đổi HEAD lịch sử trong logs.
- V1 advisory lock thay mô tả row-lock dự kiến; Draft không có status trước persistence; GoF Builder không Director; bank manual; queue at-least-once và classic DLX không HA/exactly-once.
- Full technical sequences/Inventory ERD đặt appendix; PNG/SVG có preview A4, vẫn cần review bố cục sau chèn Word. Không phát hiện P0/P1 mới trong phạm vi đối chiếu này; không thay cho acceptance/security audit mới.

## FINAL-4 readiness

Đủ source/figures/tables/snippets để soạn DOCX; đọc report-update-plan → requirement-summary/reconciliation → figure/table catalog → code-excerpts → assets-manifest. Cần xác nhận nghĩa71 ID và đóng góp thành viên (bảng phân công dự kiến không chứng minh ai thực hiện). Không cần rerun hệ thống nếu dùng snapshot có provenance; nếu sửa application hoặc muốn acceptance cho commit mới thì chạy checks phù hợp và giữ evidence mới riêng. Dừng ở đây để review, DOCX gốc chưa chỉnh.
