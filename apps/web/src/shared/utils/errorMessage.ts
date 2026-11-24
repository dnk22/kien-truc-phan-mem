import axios from 'axios';
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.error?.message;
    if (typeof message === 'string') return message;
    if (!error.response) return 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  }
  return 'Không thể thực hiện thao tác. Vui lòng thử lại.';
}
