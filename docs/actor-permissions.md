# Actor Permission Matrix — DEV-1

| Chức năng đang có               | ADMIN                      | MANAGER    | CASHIER | WAREHOUSE  |
| ------------------------------- | -------------------------- | ---------- | ------- | ---------- |
| Login/refresh/logout            | Có                         | Có         | Có      | Có         |
| Profile/đổi mật khẩu chính mình | Có                         | Có         | Có      | Có         |
| List/detail/create/update user  | Có                         | 403        | 403     | 403        |
| Khóa/mở khóa/đổi role user      | Có, bảo vệ Admin cuối cùng | 403        | 403     | 403        |
| Route mặc định                  | /users                     | /dashboard | /pos    | /inventory |

Menu/route được khai báo tập trung tại `apps/web/src/app/config/navigation.ts`. Tất cả role có profile. Các mục không thuộc DEV-1 có nhãn Sắp có và trang Chưa khả dụng; không có dữ liệu nghiệp vụ giả. RoleGuard ở FE chỉ là trải nghiệm UI; bảo vệ thực nằm ở Gateway JWT/RolesGuard và IdentityGuard/RolesGuard, với revalidation DB cho admin mutation.

Quyền nghiệp vụ mục tiêu vẫn theo Master Specification; chưa hiện thực CRUD Product, Inventory, checkout hoặc Report. ADMIN không tự được thêm quyền nghiệp vụ của Manager/Cashier.
