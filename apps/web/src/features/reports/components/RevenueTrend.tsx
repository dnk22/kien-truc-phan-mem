import { Card,Empty,Typography } from 'antd';
import type { RevenueReport } from '@minimart/contracts';
import { money } from '../../inventory/utils/format';
export function RevenueTrend({days}:{days:RevenueReport['days']}){
 const max=Math.max(1,...days.map(d=>d.revenue));
 return <Card title="Doanh thu theo ngày">
 {!days.length?<Empty/>:<div style={{overflowX:'auto'}}><div style={{minWidth:Math.max(320,days.length*42),display:'flex',alignItems:'end',gap:6,height:220}} role="img" aria-label="Biểu đồ doanh thu theo ngày">
 {days.map(d=><div key={d.date} style={{flex:1,minWidth:36,textAlign:'center'}} title={d.date+' · '+money(d.revenue)}><div style={{height:Math.max(2,d.revenue/max*165),background:'#1677ff',borderRadius:'4px 4px 0 0'}}/><Typography.Text type="secondary" style={{fontSize:10}}>{d.date.slice(5)}</Typography.Text></div>)}
 </div></div>}
 </Card>;
}
