import { Button,Input,Space } from 'antd';
import { localDay } from '../utils/report-dates';
export function ReportPeriodFilter({period,onChange}:{period:{from:string;to:string};onChange:(period:{from:string;to:string})=>void}){
 return <Space wrap>
 <label>Từ ngày <Input aria-label="Từ ngày" type="date" value={period.from} onChange={e=>onChange({...period,from:e.target.value})}/></label>
 <label>Đến ngày <Input aria-label="Đến ngày" type="date" value={period.to} onChange={e=>onChange({...period,to:e.target.value})}/></label>
 <Button onClick={()=>onChange({from:localDay(),to:localDay()})}>Hôm nay</Button>
 <Button onClick={()=>onChange({from:localDay(-6),to:localDay()})}>7 ngày</Button>
 <Button onClick={()=>onChange({from:localDay(-29),to:localDay()})}>30 ngày</Button>
 </Space>;
}
