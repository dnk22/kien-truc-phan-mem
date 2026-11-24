import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/report.api';
import { localDay,validPeriod } from '../utils/report-dates';
export function useReports(defaultDays=7){
 const [period,setPeriod]=useState({from:localDay(1-defaultDays),to:localDay()});
 const valid=validPeriod(period.from,period.to);
 const revenue=useQuery({queryKey:['reports','revenue',period],queryFn:()=>reportApi.revenue(period.from,period.to),enabled:valid,refetchInterval:15000});
 const inventory=useQuery({queryKey:['reports','inventory'],queryFn:reportApi.inventory,refetchInterval:30000});
 return {period,setPeriod,valid,revenue,inventory};
}
