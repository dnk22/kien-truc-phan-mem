export function localDay(offset=0){
 return new Date(Date.now()+7*3600000+offset*86400000).toISOString().slice(0,10);
}
export function validPeriod(from:string,to:string){
 const a=Date.parse(from+'T00:00:00Z'),b=Date.parse(to+'T00:00:00Z');
 return Number.isFinite(a)&&Number.isFinite(b)&&a<=b&&b-a<=365*86400000;
}
