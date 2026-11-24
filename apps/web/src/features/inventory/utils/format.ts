export const formatDate=(v:string)=>new Date(v).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
export const money=(v:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v);
