/** Stay dates are civil calendar days, not UTC instants. Unknown input stays null. */
export function parseStayDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(0);
  date.setFullYear(year,month-1,day);date.setHours(0,0,0,0);
  return date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day ? date : null;
}
/** Count nights by calendar dates even across 23/25-hour daylight-saving days. */
export function stayNights(checkIn: Date, checkOut: Date): number | null {
  if (!Number.isFinite(checkIn.getTime()) || !Number.isFinite(checkOut.getTime())) return null;
  const day=(date:Date)=>{const utc=new Date(0);utc.setUTCFullYear(date.getFullYear(),date.getMonth(),date.getDate());return utc.getTime();};
  return (day(checkOut)-day(checkIn))/86400000;
}
