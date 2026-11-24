# API Contract — DEV-1

Base public: `http://localhost:8080/api/v1`. Gateway chỉ forward allowlist auth/users tới Identity; không wildcard proxy và không mở `/internal/v1/*`. Identity tự xác thực JWT, kiểm tra session/user và RBAC, không tin `X-Role`/`X-User-Role`.

Swagger Gateway: `/docs`, JSON `/docs-json`. Swagger Identity nội bộ ở cổng 3001 với DTO validation chi tiết. HTTP status được giữ nguyên khi forward. Các endpoint health `/health/live`, `/health/ready` và Swagger không yêu cầu đăng nhập.

## Envelope và header

```json
{ "success": true, "data": {}, "meta": { "correlationId": "..." } }
```

List users: `data` là array; `meta` bổ sung `page`, `pageSize`, `total`, `totalPages`. Lỗi:

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "..." },
  "meta": { "correlationId": "..." }
}
```

Correlation ID từ browser được Gateway truyền sang Identity và trả lại header `X-Correlation-Id`; giá trị không hợp lệ được thay bằng UUID. Không log body, cookie, token hoặc query string. Health vẫn dùng technical response `{status,service}` như DEV-0.

`Authorization: Bearer <accessToken>` cho protected endpoints. Login/refresh/logout/change-password yêu cầu `Origin` khớp một origin trong `CSRF_ALLOWED_ORIGINS` (mặc định fallback `CORS_ORIGIN`) và `X-CSRF-Protection: 1`. Local example tin frontend :3000 và Swagger :8080; production phải thay allowlist bằng HTTPS origins thực tế. Swagger auth actions khai báo header mặc định 1. Browser dùng credentials; CORS allow đúng origin và expose correlation header.

## Authentication

| Method/path                | Yêu cầu                                       | Data trả về                                          |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| POST /auth/login           | `{username,password}`; CSRF header/origin     | `{accessToken,expiresIn,user}`; Set-Cookie refresh   |
| POST /auth/refresh         | HttpOnly refresh cookie; CSRF header/origin   | Token/session mới; xoay cookie                       |
| POST /auth/logout          | Refresh cookie nếu có; CSRF header/origin     | `{message}`; thu hồi family và xóa cookie            |
| GET /auth/me               | Bearer + session/user còn hiệu lực            | UserProfile                                          |
| POST /auth/change-password | Bearer, CSRF, `{currentPassword,newPassword}` | `{message}`; thu hồi toàn bộ sessions, cần login lại |

Login/refresh/logout/password thành công HTTP 200. Refresh token không có trong JSON. Cookie `minimart_refresh`: HttpOnly, SameSite=Lax, Path=/api/v1/auth, Max-Age theo REFRESH_TTL_DAYS; Secure theo COOKIE_SECURE, bắt buộc true khi Identity NODE_ENV=production. Không cấu hình Domain để cookie host-only.

UserProfile chỉ gồm `id,username,fullName,email,phone,role,status,createdAt,updatedAt,lastLoginAt`. Không có passwordHash, tokenHash hoặc tokenVersion. Timestamps ISO UTC; UI ngày giờ bổ sung sau cần hiển thị GMT+7.

Access JWT HS256 có `sub,role,sid,version,iss,aud,iat,exp`; TTL mặc định 300s, cấu hình trong khoảng 1–900s. Xác thực signature/algorithm/expiration/issuer/audience và claims. Identity kiểm tra session chưa revoked/chưa hết hạn, user ACTIVE, tokenVersion và role hiện tại ở mỗi protected request. Khóa/đổi role/đổi mật khẩu tăng version và revoke sessions trong cùng transaction; các request bắt đầu xác thực sau commit bị từ chối ngay. Request đã qua guard trước commit có thể đang chạy; các admin mutation còn revalidate actor trong transaction.

Refresh tokens là 48 random bytes dạng base64url, DB chỉ lưu SHA-256 hash. Rotation revoke session cũ và tạo session mới trong cùng family, được serialize bằng advisory lock theo user. Access token của session cũ bị vô hiệu khi rotation. Replay token cũ revoke toàn family; response 401. Hai refresh đồng thời dùng cùng cookie: một có thể thành công nhưng request replay còn lại sẽ thu hồi family; client cần login lại. Single-flight ở Axios giảm tình huống này trong một tab; chưa phối hợp refresh giữa nhiều tab hoặc recover cookie khi mất response mạng.

Logout không yêu cầu access token còn hạn: cookie xác định family cần revoke. Nếu không có cookie, logout idempotent HTTP 200 và không tự suy ra một family khác từ bearer token. Các API client cần giữ cookie jar.

## User Management — chỉ ADMIN

| Method/path             | Input                                                 | Thành công                  |
| ----------------------- | ----------------------------------------------------- | --------------------------- | --------------- | ----------- | --------------- |
| GET /users              | page=1, pageSize=10 (1–100), search, role, status     | 200 array + pagination meta |
| GET /users/:id          | UUID                                                  | 200 UserProfile             |
| POST /users             | username,password,fullName,role; optional email,phone | 201 UserProfile             |
| PATCH /users/:id        | fullName,email,phone                                  | 200 UserProfile             |
| PATCH /users/:id/status | `{status: ACTIVE                                      | LOCKED}`                    | 200 UserProfile |
| PATCH /users/:id/role   | `{role: ADMIN                                         | MANAGER                     | CASHIER         | WAREHOUSE}` | 200 UserProfile |

Username: 3–40 lowercase ASCII letters/digits/dot/underscore/hyphen, ký tự đầu là chữ/số; không cho đổi username. Password mới: 10–64 printable ASCII để không vượt giới hạn byte của bcrypt. FullName 2–120 ký tự, có ký tự khác khoảng trắng. Email đúng định dạng ≤254; phone 6–20 ký tự từ tập `+0-9 ()-`. PATCH email/phone nhận null để xóa giá trị. DTO whitelist và forbid unknown properties; không đổi role qua PATCH profile. Không có DELETE.

Tìm username/fullName không phân biệt hoa thường; list có thứ tự ổn định createdAt giảm dần rồi id. Unique username được bắt bằng DB constraint, race trả 409. Global PostgreSQL transaction advisory lock serialize mọi admin mutation, kiểm tra lại actor và bảo vệ Admin ACTIVE cuối cùng. Role/status mutation còn khóa theo user để nhất quán với auth/refresh/password.

## HTTP status / error codes

| Status | Ví dụ code                                                                           |
| ------ | ------------------------------------------------------------------------------------ |
| 400    | VALIDATION_ERROR, HTTP_400 (UUID invalid)                                            |
| 401    | INVALID_CREDENTIALS, INVALID_ACCESS_TOKEN, SESSION_REVOKED, CURRENT_PASSWORD_INVALID |
| 403    | FORBIDDEN, CSRF_REJECTED                                                             |
| 404    | USER_NOT_FOUND, HTTP_404                                                             |
| 409    | USERNAME_EXISTS, LAST_ACTIVE_ADMIN                                                   |
| 429    | LOGIN_RATE_LIMITED                                                                   |
| 503    | IDENTITY_UNAVAILABLE, DEPENDENCY_UNAVAILABLE (health)                                |

Rate limiting in-memory fixed window: Gateway theo peer IP, Identity theo peer IP + username. Không tin X-Forwarded-For từ client. Giá trị mặc định 10 lần/60s mỗi process; restart làm mất bộ đếm; chưa hỗ trợ distributed rate limit. Gateway timeout mặc định 5000ms cho fetch/đọc response, lỗi kết nối/timeout trả 503 và giữ correlation ID.

Các API Product, Inventory, Sales, Report và internal business API chưa hiện thực ở DEV-1; không có response mock thành công.
