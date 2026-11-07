'use client';
import {useEffect,useState} from 'react';
import {inventoryReviewApi,type InventoryRequest} from '@/lib/api/inventory-review';
import AdminMenu from '@/components/admin/menu/AdminMenu';

export default function InventoryReviewsPage() {
 const [rows,setRows]=useState<InventoryRequest[]>([]),[page,setPage]=useState(0),[history,setHistory]=useState(false),[retry,setRetry]=useState(0);
 const [error,setError]=useState(''),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[reasons,setReasons]=useState<Record<string,string>>({});
 useEffect(()=>{let current=true;setLoaded(false);setError('');
  inventoryReviewApi.pending(page,history).then(value=>{if(current){setRows(value);setLoaded(true);}}).catch(()=>{if(current)setError('Không tải được yêu cầu xác minh số phòng.');});
  return()=>{current=false;};
 },[page,history,retry]);
 async function review(row:InventoryRequest,approve:boolean){setBusy(true);setError('');
  try{await inventoryReviewApi.review(row,approve,reasons[row.id]||'');setRetry(n=>n+1);}
  catch{setError('Không duyệt được. Revision, số phòng hoặc lượng phòng đang giữ/đã đặt có thể đã thay đổi. Tải lại để kiểm tra.');}
  finally{setBusy(false);}
 }
 return <div className="flex"><AdminMenu/><main className="ml-[280px] p-8 space-y-4 flex-1">
  <h1 className="text-2xl font-bold">Xác minh số phòng</h1><p>Kiểm tra nguồn của OWNER trước khi duyệt. Không coi mọi số phòng cũ bằng 10 là sai. Duyệt chỉ cập nhật tồn phòng cấu hình, không sửa giá hay hủy booking.</p>
  {error&&<p role="alert">{error}</p>}<button disabled={busy} onClick={()=>setRetry(n=>n+1)}>Tải lại yêu cầu</button> <button disabled={busy} onClick={()=>{setHistory(!history);setPage(0);}}>{history?'Xem yêu cầu chờ duyệt':'Xem lịch sử duyệt'}</button>
  {!loaded&&!error&&<p>Đang tải yêu cầu…</p>}{loaded&&rows.length===0&&<p>Không có yêu cầu ở trang này.</p>}
  {loaded&&rows.map(row=><section key={row.id} aria-label={`Yêu cầu số phòng ${row.id}`} className="border rounded p-4 space-y-2">
   <p>Cơ sở: {row.hotel_id} · Loại phòng: {row.room_id}</p><p>Số phòng lúc đề xuất: {row.previous_quantity??'Chưa biết'} · Đề xuất: {row.proposed_quantity}</p>
   <p>Nguồn: {row.source}</p><p>Trạng thái: {row.status}{row.review_reason?` · ${row.review_reason}`:''}</p>
   <p>Người đề xuất: {row.requested_by} · {row.requested_at}</p>{row.reviewed_by&&<p>Người duyệt: {row.reviewed_by} · {row.reviewed_at}</p>}
   <a href={`/hotel/${row.hotel_id}`} className="underline" target="_blank" rel="noreferrer">Xem cơ sở</a>
   {row.status==='PENDING'&&<><label className="block">Lý do quyết định <textarea maxLength={1000} value={reasons[row.id]||''} onChange={e=>setReasons({...reasons,[row.id]:e.target.value})} className="border p-2"/></label>
    <button disabled={busy||!reasons[row.id]?.trim()} onClick={()=>review(row,true)}>Duyệt số phòng</button> <button disabled={busy||!reasons[row.id]?.trim()} onClick={()=>review(row,false)}>Từ chối số phòng</button></>}
  </section>)}
  <nav aria-label="Trang xác minh"><button disabled={page===0||busy} onClick={()=>setPage(n=>n-1)}>Trang trước</button> <span>{page+1}</span> <button disabled={!loaded||rows.length<50||busy} onClick={()=>setPage(n=>n+1)}>Trang sau</button></nav>
 </main></div>;
}
