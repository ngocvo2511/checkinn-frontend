/** Report periods use the same business day as the cash ledger, independent of browser timezone. */
export const REPORT_ZONE = 'Asia/Ho_Chi_Minh';
function currentMonth(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: REPORT_ZONE, year:'numeric', month:'numeric'}).formatToParts(now);
  return {year:Number(parts.find(p=>p.type==='year')!.value), month:Number(parts.find(p=>p.type==='month')!.value)};
}
function day(year:number,month:number,date:number) {return `${year}-${String(month).padStart(2,'0')}-${String(date).padStart(2,'0')}`;}
export function reportMonthRange(now=new Date()) {
  const {year,month}=currentMonth(now);
  return {from:day(year,month,1),to:day(year,month,new Date(Date.UTC(year,month,0)).getUTCDate())};
}
export function reportMonths(now=new Date()) {
  const {year,month}=currentMonth(now);
  return Array.from({length:6},(_,i)=>{
    const at=new Date(Date.UTC(year,month-6+i,1));
    return {monthKey:day(at.getUTCFullYear(),at.getUTCMonth()+1,1).slice(0,7),
      monthLabel:at.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'})};
  });
}
export function reportChartRange(now=new Date()) {
  return {from:reportMonths(now)[0].monthKey+'-01',to:reportMonthRange(now).to};
}
export function reportMonthKey(value:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Invalid report day');
  const [year,month,date]=value.split('-').map(Number),at=new Date(0);
  at.setUTCFullYear(year,month-1,date);
  if(at.getUTCFullYear()!==year || at.getUTCMonth()!==month-1 || at.getUTCDate()!==date)throw new Error('Invalid report day');
  return value.slice(0,7);
}
