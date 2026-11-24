# Kịch bản bảo vệ – nhóm 06

Thời lượng gợi ý 10–12 phút; điều chỉnh theo giảng viên. Chỉ thực hiện sau khi quality gate và demo rehearsal đạt.

| Thời gian | Người phụ trách đề xuất | Nội dung |
|---|---|---|
| 0–2 phút | Duy | Bài toán, phạm vi một siêu thị, component/deployment, 5 DB |
| 2–3 phút | Nguyên | Login 4 role, Admin quản lý người dùng, chặn route/API trái quyền |
| 3–4 phút | Hoàn | Manager tạo danh mục/sản phẩm, mã unique, giá, tìm kiếm |
| 4–6 phút | Thủy | Warehouse lập phiếu nhập, Manager xác nhận, tồn tăng một lần, biến động và kiểm kê |
| 6–9 phút | Duy | Cashier POS, prepare/confirm, tiền thừa, in hóa đơn, 4 GoF trong source |
| 9–11 phút | Duy | Manager báo cáo; minh họa Report/broker offline và backlog catch-up bằng bằng chứng thực tế |
| 11–12 phút | Cả nhóm | Trade-off, hạn chế, kết luận |

## Happy path (expected, not measured)
Create product 12,000 VND, receipt 10 units. Confirm as Manager; onHand=10. Cashier prepares 2 units: onHand=10, reserved=2, available=8, total=24,000. Receive 30,000 cash, change=6,000. Confirm: onHand=8, reserved=0, invoice COMPLETED. Report eventually adds one invoice, 2 units and 24,000 revenue. Use delta from baseline, not absolute totals. Change current price to 13,000; old invoice remains 24,000. Print via browser.
Demonstrate bank transfer separately: cashier manually confirms received funds, no real bank integration.

## Fault demonstration
Use isolated local stack only. Stop Report, complete a sale, restart and show revenue catch-up. Stop RabbitMQ, complete sale, show outbox pending, restart and show SENT/projected. Use logs recorded by verify:dev6 or run live after rehearsal. If fault demo fails, disclose actual result; do not display fabricated evidence.

## Questions to prepare
Why microservices rather than monolith? Course learning objective and independent ownership; overhead for one store. Why separate databases? Data ownership; consistency via Saga/events. Why at-least-once? Confirm/ack ambiguity; idempotent projection. Why not rollback payment? Physical cash/manual transfer cannot be undone by database transaction. Distinguish GoF from architectural patterns. Advisory lock trades throughput for simpler single-store correctness.
