# Demo DEV-1

1. Khởi động theo README, migrate và chạy explicit demo seed; mở `/login`.
2. Đăng nhập admin với DEMO_PASSWORD đã cấu hình. `/users` hiển thị dữ liệu thật: tạo user, tìm kiếm/lọc/phân trang, sửa thông tin với confirm, đổi role và khóa/mở khóa với confirm. Username trùng trả 409, sai input trả 400.
3. Thử khóa/hạ quyền Admin ACTIVE cuối cùng để thấy 409. Không thực hiện trên môi trường production hoặc tài khoản đang được người khác dùng.
4. Mở profile, đổi mật khẩu bằng mật khẩu hiện tại: session bị thu hồi và trở về login; dùng password mới để vào lại. Seed không tự reset password.
5. Reload trang để chứng minh session restoration qua HttpOnly refresh cookie; logout rồi reload vẫn ở login. Access token không lưu localStorage.
6. Đăng nhập manager/cashier/warehouse: default routes dashboard/pos/inventory và menu riêng. Vào trực tiếp `/users` bị chặn. Những trang nghiệp vụ này còn Chưa khả dụng, không có dữ liệu giả.
7. Mobile: mở drawer, chọn menu profile; xem layout không tràn viewport. Desktop có sidebar có thể thu gọn.
8. Swagger tại Gateway `/docs`. API cookie actions cần Origin phù hợp và X-CSRF-Protection: 1; GET me/users cần bearer. Xem `api-contracts.md`.

Ảnh thật và log ở `docs/evidence/dev1`; các trạng thái loading/error trong browser test được gây ra bằng trì hoãn hoặc chặn transport, không fake thành công API. Chưa có ảnh `docker compose ps` vì daemon chưa chạy. Kịch bản nhập hàng/POS/checkout/Outbox vẫn chưa được hiện thực, dừng tại DEV-1.
