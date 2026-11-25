# Kế hoạch cập nhật DOCX — FINAL-4 (chưa chỉnh DOCX)

Nguồn: Bao_cao_Nhom_06_Sieu_thi_mini.docx, document.xml body blocks theo docx-structure.json. Bản gốc là thiết kế trước triển khai, có hình/đoạn placeholder. Giữ bìa, thông tin nhóm/giảng viên và số/tên chương gốc. Không tự thêm đóng góp đã hoàn thành cho từng thành viên từ bảng phân công dự kiến.

| Phần / blocks gốc      | Giữ                                                                      | Sửa hoặc bổ sung                                                                                                                                 | Hình / bảng / code / nguồn                                                     | Lưu ý                                                                                              |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Mở đầu23–30            | Lý do, phạm vi một store, bảng phân công gốc                             | Nêu sản phẩm thực tế và kết quả có ngày/provenance                                                                                               | architecture-summary; test-summary; source report                              | Phân công dự kiến không đồng nghĩa chứng minh ai viết code                                         |
| Ch1 32–61; 1.3/1.4/1.6 | Nhóm FR/BR/NFR gốc và4 vai trò                                           | Duyệt71 ID chưa được neo riêng; trình bày79 runtime-supported/7 partial/1 unit/1 source                                                          | requirement-summary; reconciliation88 rows; bảng RBAC                          | Không tự đặt nghĩa chính thức hoặc ghi88 runtime PASS                                              |
| Ch2 63–106             | Microservices, Client–Server, Layered, REST, EDA,5 DB                    | Dùng tên service/port/network thật; thêm catalog zero-stock, live session, actor/cid, retry mandatory; sửa row-lock mô tả thành advisory lock V1 | Component/Layered/Deployment; ownership, versions, trade-offs; snippets Outbox | Gateway không DB; không cross-DB FK/query;3300 chỉ test override                                   |
| Ch3 108–163            | Các mục3.1–3.10, cấu trúc UML theo nhóm                                  | Thay lớp dự kiến bằng actual ports/classes; thêm prepare/confirm/cancel/recovery;5 trạng thái;5 ERD (Inventory2 phần)                            | UML manifest, figure catalog; activity reserve                                 | Draft không status trước persistence; state transitions ở repository, không Invoice entity methods |
| Ch4 165–200            | Thứ tự gốc:4.1 Factory;4.2 Builder;4.3.1 Facade;4.3.2 Strategy;4.4 SOLID | 4 diagram riêng, snippet nguyên văn, test refs và trade-off                                                                                      | final3-gof-\*; design-patterns.md; code-excerpts                               | Không đổi Builder sang Director giả; bank manual; Repository/Saga không tính GoF                   |
| Ch5 202–227            | Các mục5.1–5.6                                                           | Đổi “dự kiến/chưa chạy” thành nguồn/kết quả có ngày; TC01–15 map tới actual IDs; runtime, screenshots, benchmark                                 | table-catalog; test-summary; screenshot/PDF; evidence manifest/provenance      | 65 Jest và44 groups tách riêng; benchmark READ; lỗi screenshot không là hình happy path            |
| Kết luận229–236        | Giới hạn một store, không ngân hàng/HA                                   | Kết quả đạt được có điều kiện; remaining limitations; hướng phát triển phù hợp                                                                   | known-limitations; requirement-summary                                         | Không biến local demo thành chứng minh production SLA                                              |
| Phụ lục238–243         | Tài liệu tham khảo gốc                                                   | UML appendix, OpenAPI, full trace, code paths/hashes, provenance                                                                                 | assets-manifest.json, UML manifest, evidence refs                              | Không in secrets/demo key/token/connection URLs                                                    |

## Heading outline thực tế

Word styles gốc gán Heading1 cho nhiều tiểu mục (1.3,1.5,1.6,2.3…); FINAL-4 cần sửa hierarchy styles và tái tạo TOC/list figures, giữ số/tên nội dung. Không thay bằng cấu trúc gợi ý khác. Số trang hiện tại chỉ là placeholder, cập nhật tự động sau khi chèn assets.

| Body block | Word style | Heading nguyên bản                              |
| ---------- | ---------- | ----------------------------------------------- |
| 17         | Heading1   | MỤC LỤC                                         |
| 19         | Heading2   | Danh mục từ viết tắt                            |
| 23         | Heading1   | MỞ ĐẦU                                          |
| 24         | Heading2   | 1. Lý do chọn đề tài                            |
| 26         | Heading2   | 2. Mục tiêu và phạm vi                          |
| 28         | Heading2   | 3. Phân công công việc                          |
| 32         | Heading1   | CHƯƠNG 1. ĐẶC TẢ BÀI TOÁN VÀ YÊU CẦU HỆ THỐNG   |
| 33         | Heading2   | 1.1. Bài toán và tác nhân                       |
| 36         | Heading2   | 1.2. Phạm vi ưu tiên                            |
| 40         | Heading1   | 1.3. Yêu cầu chức năng                          |
| 42         | Heading2   | 1.4. Yêu cầu phi chức năng                      |
| 46         | Heading1   | 1.5. Quy trình nghiệp vụ                        |
| 47         | Heading2   | 1.5.1. Nhập hàng                                |
| 51         | Heading2   | 1.5.2. Bán hàng và thanh toán                   |
| 53         | Heading2   | 1.5.3. Kiểm kê và thống kê                      |
| 56         | Heading1   | 1.6. Quy tắc nghiệp vụ                          |
| 58         | Heading2   | 1.7. Quyết định nghiệp vụ bổ sung               |
| 60         | Heading2   | 1.8. Kết luận chương                            |
| 63         | Heading1   | CHƯƠNG 2. THIẾT KẾ KIẾN TRÚC PHẦN MỀM           |
| 64         | Heading2   | 2.1. Lựa chọn kiến trúc                         |
| 68         | Heading2   | 2.2. Các phong cách kết hợp                     |
| 71         | Heading1   | 2.3. Kiến trúc tổng thể và thành phần           |
| 77         | Heading1   | 2.4. Kiến trúc phân lớp và công nghệ            |
| 84         | Heading1   | 2.5. Kiến trúc dữ liệu và giao tiếp             |
| 87         | Heading2   | 2.5.1. Sự kiện và Outbox                        |
| 92         | Heading1   | 2.6. Điều phối giao dịch bán hàng               |
| 93         | Heading2   | 2.6.1. Saga Orchestration                       |
| 99         | Heading1   | 2.7. Tính toàn vẹn, bảo mật và triển khai       |
| 100        | Heading2   | 2.7.1. Stock Reservation và Idempotency         |
| 103        | Heading2   | 2.7.2. Bảo mật                                  |
| 105        | Heading2   | 2.7.3. Quyết định kiến trúc                     |
| 108        | Heading1   | CHƯƠNG 3. THIẾT KẾ HỆ THỐNG BẰNG UML            |
| 109        | Heading2   | 3.1. Use Case tổng quan                         |
| 113        | Heading2   | 3.2. Danh mục Use Case                          |
| 116        | Heading1   | 3.3. Đặc tả Use Case tiêu biểu                  |
| 120        | Heading1   | 3.4. Thiết kế lớp nghiệp vụ                     |
| 124        | Heading2   | 3.4.1. Các nhóm lớp còn lại                     |
| 127        | Heading1   | 3.5. Biểu đồ tuần tự bán hàng                   |
| 132        | Heading1   | 3.6. Biểu đồ trạng thái và hoạt động            |
| 139        | Heading1   | 3.7. Thiết kế cơ sở dữ liệu – Identity, Product |
| 146        | Heading1   | 3.8. Thiết kế cơ sở dữ liệu – Inventory         |
| 151        | Heading1   | 3.9. Thiết kế cơ sở dữ liệu – Sales, Report     |
| 158        | Heading1   | 3.10. Hợp đồng API và triển khai                |
| 165        | Heading1   | CHƯƠNG 4. ÁP DỤNG MẪU THIẾT KẾ                  |
| 166        | Heading2   | 4.1. Factory Method                             |
| 171        | Heading2   | Minh họa contract dự kiến                       |
| 174        | Heading1   | 4.2. Builder Pattern                            |
| 179        | Heading2   | Minh họa contract dự kiến                       |
| 183        | Heading1   | 4.3. Facade và Strategy                         |
| 184        | Heading2   | 4.3.1. Facade Pattern                           |
| 188        | Heading2   | 4.3.2. Strategy Pattern                         |
| 194        | Heading1   | 4.4. SOLID và các mẫu bổ trợ                    |
| 196        | Heading2   | 4.4.1. Repository và Dependency Injection       |
| 198        | Heading2   | 4.4.2. Đánh giá                                 |
| 202        | Heading1   | CHƯƠNG 5. CÀI ĐẶT, KIỂM THỬ VÀ DEMO             |
| 203        | Heading2   | 5.1. Kế hoạch cài đặt                           |
| 206        | Heading2   | 5.2. Hướng dẫn triển khai dự kiến               |
| 209        | Heading2   | 5.3. Minh chứng cài đặt                         |
| 212        | Heading1   | 5.4. Kế hoạch kiểm thử                          |
| 216        | Heading1   | 5.5. Kịch bản demo và minh chứng giao diện      |
| 226        | Heading2   | 5.6. Đánh giá nghiệm thu                        |
| 229        | Heading1   | KẾT LUẬN                                        |
| 230        | Heading2   | 1. Kết quả thiết kế                             |
| 232        | Heading2   | 2. Hạn chế                                      |
| 234        | Heading2   | 3. Hướng phát triển                             |
| 238        | Heading1   | TÀI LIỆU THAM KHẢO VÀ PHỤ LỤC                   |
| 239        | Heading2   | Tài liệu tham khảo                              |
| 241        | Heading2   | Phụ lục – Ma trận truy vết mẫu                  |
