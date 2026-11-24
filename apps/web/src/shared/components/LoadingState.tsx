import { Spin } from 'antd';
export function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-label="Đang tải">
      <Spin size="large" />
      <p>Đang tải dữ liệu…</p>
    </div>
  );
}
