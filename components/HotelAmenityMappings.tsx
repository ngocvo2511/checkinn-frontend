"use client";
import {useEffect,useState} from 'react';
import {amenityApi,type AmenityCode,type AmenityMapping} from '@/lib/api/amenity-catalog';
function MappingRow({row,hotelId,options,onSaved}:{row:AmenityMapping;hotelId:string;options:AmenityCode[];onSaved:()=>void}) {
 const [codes,setCodes]=useState(row.latestRequest?.status==='PENDING'?row.latestRequest.codes:row.approvedCodes.map(c=>c.code));
 const [note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(){setBusy(true);setError('');try{await amenityApi.propose(hotelId,row,codes,note);onSaved();}catch{setError('Không gửi được mapping. Hãy tải lại trước khi thử lại.');}finally{setBusy(false);}}
 return <fieldset className="border p-3 space-y-2" disabled={busy}><legend>{row.title}</legend>
  <p>Đã duyệt: {row.approvedCodes.map(c=>c.label).join(', ')||'Chưa có mã'}</p>
  {row.latestRequest&&<p>Yêu cầu gần nhất: {row.latestRequest.status}{row.latestRequest.review_reason?` — ${row.latestRequest.review_reason}`:''}</p>}
  {options.map(o=><label key={o.code} className="block"><input type="checkbox" checked={codes.includes(o.code)} onChange={()=>setCodes(codes.includes(o.code)?codes.filter(c=>c!==o.code):[...codes,o.code])}/> {o.label} ({o.code})</label>)}
  {codes.filter(code=>!options.some(o=>o.code===code)).map(code=><label key={code} className="block"><input type="checkbox" checked onChange={()=>setCodes(codes.filter(c=>c!==code))}/> {code} — đã ngừng sử dụng, bỏ chọn trước khi gửi</label>)}
  <label className="block">Ghi chú mapping <input value={note} maxLength={1000} onChange={e=>setNote(e.target.value)} className="border"/></label>
  <p className="text-sm">Bỏ tất cả mã và gửi để đề nghị gỡ mapping. Nhãn gốc vẫn được giữ nguyên.</p>
  <button type="button" onClick={save} className="underline">Gửi mapping chờ duyệt</button>{error&&<p role="alert">{error}</p>}
 </fieldset>;
}
export function HotelAmenityMappings({hotelId,sourceKey}:{hotelId:string;sourceKey:string}) {
 return <HotelAmenityMappingsContent key={JSON.stringify([hotelId,sourceKey])} hotelId={hotelId}/>;
}
function HotelAmenityMappingsContent({hotelId}:{hotelId:string}) {
 const [data,setData]=useState<{rows:AmenityMapping[];options:AmenityCode[]}|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const reload=()=>{setData(null);setError('');setRetry(n=>n+1);};
 useEffect(()=>{let current=true;Promise.all([amenityApi.mappings(hotelId),amenityApi.catalog()]).then(([rows,options])=>{if(current)setData({rows,options});}).catch(()=>{if(current)setError('Không tải được mapping tiện nghi.');});return()=>{current=false;};},[hotelId,retry]);
 return <section aria-label="Mapping tiện nghi" className="border rounded p-4 space-y-4"><h3 className="font-semibold">Mapping tiện nghi chung</h3><p>Chọn mã có ý nghĩa đúng với nhãn gốc. ADMIN kiểm tra trước khi công bố; không tự gộp Wi-Fi miễn phí và trả phí.</p>
  {!data&&!error&&<p>Đang tải mapping…</p>}{error&&<p role="alert">{error}</p>}<button type="button" onClick={reload}>Tải lại mapping</button>
  {data?.rows.length===0&&<p>Hãy thêm nhãn tiện nghi trước khi gắn mã.</p>}
  {data?.rows.map(row=><MappingRow key={`${row.id}:${row.revision}`} row={row} hotelId={hotelId} options={data.options} onSaved={reload}/>)}
 </section>;
}
