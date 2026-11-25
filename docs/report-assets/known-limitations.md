# Known limitations và điều kiện biên

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
