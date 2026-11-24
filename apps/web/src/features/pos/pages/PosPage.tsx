import { useEffect } from 'react';
import { useCartStore } from '../stores/cart.store';
import { Alert, Button, Card, Col, Row, Space } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductPicker } from '../components/ProductPicker';
import { CartPanel } from '../components/CartPanel';
import { PaymentPanel } from '../components/PaymentPanel';
import { useCheckout } from '../hooks/useCheckout';
import { InvoiceSummary } from '../../sales/components/InvoiceSummary';
import { isTerminal } from '../../sales/utils/sale-status';
import { PageHeader } from '../../../shared/components/PageHeader';
export default function PosPage() {
  const [params, setParams] = useSearchParams();
  const checkout = useCheckout(params.get('invoiceId') ?? undefined);
  const invoice = checkout.invoice;
  useEffect(() => () => useCartStore.getState().clear(), []);
  const pending =
    checkout.prepare.isPending ||
    checkout.confirm.isPending ||
    checkout.cancel.isPending;
  return (
    <>
      <PageHeader
        title="Bán hàng POS"
        description="Kiểm tra giá, giữ hàng và xác nhận thanh toán"
        actions={<Link to="/invoices">Hóa đơn của tôi</Link>}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ProductPicker disabled={checkout.locked || pending} />
        </Col>
        <Col xs={24} lg={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {!invoice && (
              <CartPanel
                disabled={checkout.locked || pending}
                pending={checkout.prepare.isPending}
                onPrepare={checkout.start}
              />
            )}
            {checkout.pendingPrepare && !checkout.prepare.isPending && (
              <Alert
                type="warning"
                message="Chưa xác định kết quả giữ hàng"
                action={
                  <Button onClick={checkout.start}>Thử lại cùng yêu cầu</Button>
                }
              />
            )}
            {checkout.query.isError && (
              <Alert
                type="error"
                message="Không tải được trạng thái hóa đơn"
                action={
                  <Button onClick={() => void checkout.query.refetch()}>
                    Tải lại
                  </Button>
                }
              />
            )}
            {invoice && (
              <Card>
                <InvoiceSummary invoice={invoice} />
              </Card>
            )}
            {invoice?.status === 'READY' && (
              <PaymentPanel
                invoice={invoice}
                pending={pending}
                uncertain={!!checkout.pendingConfirm}
                onPay={checkout.pay}
                onCancel={() => checkout.cancel.mutate()}
              />
            )}
            {invoice &&
              !isTerminal(invoice.status) &&
              invoice.status !== 'READY' && (
                <Alert
                  type="warning"
                  showIcon
                  message="Giao dịch đang xử lý hoặc cần đối soát"
                  description="Không tạo giao dịch khác để thay thế. Hệ thống tự truy vấn lại trạng thái giữ hàng; không nhận tiền lần nữa."
                />
              )}
            {invoice && isTerminal(invoice.status) && (
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    checkout.reset();
                    setParams({});
                  }}
                >
                  Giao dịch mới
                </Button>
                <Link to={'/invoices/' + invoice.id}>Xem hóa đơn</Link>
              </Space>
            )}
          </Space>
        </Col>
      </Row>
    </>
  );
}
