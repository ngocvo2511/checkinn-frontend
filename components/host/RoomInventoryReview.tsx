'use client';
import {useEffect,useState} from 'react';
import {inventoryReviewApi,type InventoryState} from '@/lib/api/inventory-review';

export default function RoomInventoryReview({roomId,onState}:{roomId:string;onState:(state:InventoryState|null)=>void}) {
 const [state,setState]=useState<InventoryState|null>(null),[quantity,setQuantity]=useState(''),[source,setSource]=useState('');
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let current=true;setState(null);onState(null);setError('');
  inventoryReviewApi.state(roomId).then(value=>{if(current){setState(value);onState(value);}})
   .catch(()=>{if(current)setError('Không tải được trạng thái xác minh số phòng. Hãy thử tải lại.');});
  return()=>{current=false;};
 },[roomId,retry,onState]);
 async function propose(event:React.FormEvent) {
  event.preventDefault();if(!state)return;const count=Number(quantity);
  if(!quantity.trim()||!Number.isSafeInteger(count)||count<1||!source.trim()){setError('Nhập số phòng nguyên dương và nguồn xác minh.');return;}
  setBusy(true);setError('');setMessage('');
  try{await inventoryReviewApi.propose(roomId,count,state.revision,source.trim());setMessage('Đã gửi đề xuất. Số phòng chỉ thay đổi sau khi ADMIN duyệt.');setRetry(n=>n+1);}
  catch{setError('Không gửi được đề xuất. Thông tin có thể đã thay đổi; tải lại trước khi gửi lại.');}
  finally{setBusy(false);}
 }
 return <section aria-label="Xác minh số phòng" className="mb-6 rounded-xl border bg-white p-6 space-y-3">
  <h2 className="text-lg font-semibold">Xác minh số phòng</h2>
  <p>Gửi số phòng thực tế kèm nguồn kiểm tra. ADMIN duyệt trước khi cập nhật; giá và booking hiện có được giữ nguyên.</p>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  <button type="button" disabled={busy} onClick={()=>setRetry(n=>n+1)}>Tải lại xác minh</button>
  {!state&&!error&&<p>Đang tải trạng thái xác minh…</p>}
  {state&&<><p>Số phòng đang lưu: {state.currentQuantity??'Chưa biết'} · {state.verified?'Đã duyệt nguồn xác minh':'Chưa xác minh nguồn'}</p>
   {state.latestRequest&&<p>Đề xuất gần nhất: {state.latestRequest.proposed_quantity} · {state.latestRequest.status} · {state.latestRequest.review_reason||state.latestRequest.source}</p>}
   <form onSubmit={propose}><fieldset disabled={busy} className="space-y-3">
    <label className="block">Số phòng đề xuất <input required type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)} className="border rounded p-2"/></label>
    <label className="block">Nguồn xác minh số phòng <textarea required maxLength={1000} value={source} onChange={e=>setSource(e.target.value)} className="border rounded p-2"/></label>
    <button type="submit">Gửi đề xuất số phòng</button>
   </fieldset></form>
  </>}
 </section>;
}
