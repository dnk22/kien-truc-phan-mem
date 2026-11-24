import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
export default function UnauthorizedPage() {
  return (
    <Result
      status="403"
      title="Không có quyền truy cập"
      subTitle="Tài khoản của bạn không được phép truy cập trang này."
      extra={
        <Link to="/">
          <Button type="primary">Về trang chính</Button>
        </Link>
      }
    />
  );
}
