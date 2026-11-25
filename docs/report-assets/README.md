# FINAL-4 preparation package

Đọc theo thứ tự: **report-update-plan.md → requirement-summary.md + ../requirement-id-reconciliation.md → figure-catalog.md/table-catalog.md → code-excerpts.md → assets-manifest.json**. Source DOCX/Master giữ nguyên. Branch main/HEAD fe96c3eda789f8d88ea9482c8fe7fe82a02a7ca1; FINAL-3 chỉ chỉnh documentation/tooling/assets, không application/schema.

| File                                                           | Mục đích                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [report-update-plan](report-update-plan.md)                    | Đối chiếu block/style/heading thực tế của DOCX, việc giữ/sửa/bổ sung từng chương  |
| [figure-catalog](figure-catalog.md)                            | Caption Việt, số đề xuất, vị trí và priority của UML/ảnh                          |
| [table-catalog](table-catalog.md)                              | Services, DB, versions, RBAC, GoF, references bảng test/benchmark/coverage/limits |
| [code-excerpts](code-excerpts.md) + [JSON](code-excerpts.json) | 8 trích đoạn nguyên văn, path/line range/HEAD/hash cho kiểm tra tự động           |
| [test-summary](test-summary.md)                                | Counts đã đối chiếu logs,44 IDs, TC01–15 mapping, gates/data/benchmark            |
| [architecture-summary](architecture-summary.md)                | Mô tả triển khai thật và khác thiết kế dự kiến                                    |
| [known-limitations](known-limitations.md)                      | Giới hạn sản phẩm/evidence/provenance, P2 StockMetrics label                      |
| [requirement-summary](requirement-summary.md)                  | Coverage phân cấp +71 ID cần duyệt, không88 runtime PASS                          |
| [assets-manifest](assets-manifest.json)                        | Relative paths, captions, source/verification, SHA256, excerpts                   |

UML nguồn/ảnh đầy đủ ở ../uml/manifest.json và ../uml/rendered/{svg,png}; hình legacy được giữ HISTORICAL, không dùng làm current report. Evidence nguồn FINAL-2 giữ nguyên; evidence bổ sung ở ../evidence/final3. Không chạy lại full suites vì application không đổi. Screenshots mới chỉ đọc dữ liệu/đăng nhập, không tạo hóa đơn hoặc submit approval.

Đủ tư liệu để soạn FINAL-4; cần nhóm duyệt nghĩa71 ID và đóng góp thành viên, quyết định có cần ảnh live RECOVERY riêng không. Không bắt buộc chạy lại hệ thống/tests nếu chấp nhận snapshot có provenance; nếu sửa code/P0/P1 hoặc muốn tuyên bố commit mới đã acceptance thì phải chạy kiểm thử phù hợp và giữ kết quả mới riêng. Không gán65/44 PASS lịch sử cho HEAD mới.
