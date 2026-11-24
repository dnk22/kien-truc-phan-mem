export const usernameRules = [
  { required: true, message: 'Nhập tên đăng nhập' },
  {
    pattern: /^[a-z0-9][a-z0-9._-]{2,39}$/,
    message: 'Dùng 3–40 ký tự thường, số, dấu chấm, gạch dưới hoặc gạch ngang',
  },
];
export const passwordRules = [
  { required: true, message: 'Nhập mật khẩu' },
  {
    pattern: /^[\x20-\x7E]{10,64}$/,
    message: 'Dùng 10–64 ký tự ASCII in được',
  },
];
