# Report evidence và reconciliation hiện hành — FINAL-3

Bản FINAL-2 từng gán VERIFIED cho88 dòng theo các ca được chỉ định; FINAL-3 đã audit lại nội dung assertions và nguồn ID. Không sửa JSON/log nghiệm thu gốc. Tài liệu hiện hành này dẫn tới [bảng reconciliation đầy đủ88 dòng](requirement-id-reconciliation.md) và [JSON có cấu trúc](evidence/final3/requirement-reconciliation.json).

Không thể suy ra57/57 FR được xác minh đầy đủ chỉ từ44 case PASS. Mỗi case chứa nhiều assertion nhưng chỉ hỗ trợ phạm vi thực sự đã assert. Việc runtime PASS và việc numbering chính thức là hai vấn đề độc lập.

| Nhóm | Số dòng đề xuất | Runtime-supported | Partial | Unit-only | Source review |
| ---- | --------------: | ----------------: | ------: | --------: | ------------: |
| FR   |              57 |                53 |       4 |         0 |             0 |
| BR   |              21 |                19 |       1 |         1 |             0 |
| NFR  |              10 |                 7 |       2 |         0 |             1 |

Các sửa reference chính: FR05 A03→A15/U06; FR15 và BR11 DEV6→A16; FR55 bổ sung D02. Những mục partial: FR16, FR17, FR19, FR34, BR20, NFR01, NFR07. Không có phát hiện P0/P1 sản phẩm từ audit này; đây là giới hạn độ rộng minh chứng, không phải mở đợt phát triển mới.

Nguồn nghiệm thu: [manifest lịch sử và provenance bổ sung](evidence/final/manifest.md), [acceptance44 IDs](evidence/final/acceptance.json), [quality gates](evidence/final/quality-gates.json). 24 Jest suites/65 tests (59 unit +6 HTTP health với mocked DB), 44 unique acceptance (23 API/runtime/SQL +12 fault +8 browser +1 benchmark). Không cộng các lần rerun hoặc DEV-6 lặp.

Snapshot lịch sử:34 COMPLETED =34 report facts =34 SENT outbox; xem [current runtime](evidence/final3/runtime-current.json) cho lần đọc bổ sung. Benchmark chỉ hai READ endpoints,20 clients,400 requests/endpoint, P95 43.94/31.79ms. Không có kết luận writes/production SLA. In/PDF không chứng minh máy in vật lý; transfer xác nhận thủ công.

Gói chuẩn bị báo cáo: [report-assets/README](report-assets/README.md). Giữ nguyên source DOCX/Master; các hàng NEEDS_CONFIRMATION phải được duyệt ở FINAL-4.
