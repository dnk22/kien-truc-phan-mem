import { Button,Space } from 'antd';
export function DocumentActions({canConfirm,onConfirm,onCancel,onEdit,onView}:{canConfirm:boolean;onConfirm:()=>void;onCancel:()=>void;onEdit?:()=>void;onView?:()=>void}){
 return <Space wrap>{onView&&<Button type="link" onClick={onView}>Chi tiết</Button>}{onEdit&&<Button type="link" onClick={onEdit}>Sửa</Button>}{canConfirm&&<Button type="link" onClick={onConfirm}>Xác nhận</Button>}<Button danger type="link" onClick={onCancel}>Hủy</Button></Space>;
}
