"use client";
import {useCallback,useEffect,useState} from 'react';
import {AccommodationTypeSelect} from './AccommodationTypeSelect';
import {accommodationApi,type AccommodationChange,type AccommodationType} from '@/lib/api/accommodation-types';
import type {Hotel} from '@/lib/api/hotels';
export function HotelAccommodationEditor({hotel,onUpdated}:{hotel:Hotel;onUpdated:()=>Promise<void>|void}) {
 const selectionKey=`${hotel.id}:${hotel.accommodationType||''}`;
 const [selection,setSelection]=useState({key:selectionKey,value:hotel.accommodationType||''});
 const selected=selection.key===selectionKey?selection.value:hotel.accommodationType||'';
 const setSelected=(value:string)=>setSelection({key:selectionKey,value});
 const [history,setHistory]=useState<AccommodationChange[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const loadKey=`${hotel.id}:${hotel.accommodationType||''}`;
 const [loadedKey,setLoadedKey]=useState('');
 const loaded=loadedKey===loadKey;
 const load=useCallback(async()=>{try{const rows=await accommodationApi.history(hotel.id);setHistory(rows);setLoadedKey(`${hotel.id}:${hotel.accommodationType||''}`);setError('');}catch{setLoadedKey('');setError('Không tải được yêu cầu thay đổi. Hãy thử lại.');}},[hotel.id,hotel.accommodationType]);
 useEffect(()=>{void load();},[load]);
 async function save(){if(!selected||busy||!loaded)return;setBusy(true);setError('');setMessage('');
  try{await accommodationApi.propose(hotel.id,selected as AccommodationType);await load();await onUpdated();setMessage(hotel.approvedStatus==='APPROVED'?'Đã ghi nhận đề xuất. Loại công bố chỉ thay đổi khi admin duyệt.':'Đã lưu loại hình lưu trú.');}
  catch{setError('Không lưu được loại hình. Vui lòng tải lại và thử lại.');}finally{setBusy(false);}
 }
 const pending=history.find(c=>c.status==='PENDING');const latest=history[0];
 return <section aria-label="Quản lý loại hình lưu trú" className="rounded-xl border bg-white p-5 space-y-3">
  <h2 className="text-lg font-semibold">Loại hình lưu trú</h2>
  <p>Loại hiện tại: <strong>{hotel.accommodationTypeLabel||'Chưa phân loại'}</strong></p>
  {pending&&<p role="status">Đề xuất đang chờ duyệt: <strong>{pending.requestedTypeLabel}</strong></p>}
  {!pending&&latest?.status==='REJECTED'&&<p>Đề xuất bị từ chối: {latest.requestedTypeLabel} — {latest.rejectionReason}</p>}
  {hotel.approvedStatus==='APPROVED'&&<p>Đổi loại cần admin duyệt. Cơ sở tiếp tục hoạt động với loại hiện tại trong lúc chờ.</p>}
  <AccommodationTypeSelect value={selected} onChange={setSelected} disabled={busy}/>
  <button type="button" className="rounded bg-blue-700 text-white px-4 py-2 disabled:opacity-50" disabled={!selected||busy||!loaded} onClick={save}>{busy?'Đang lưu…':hotel.approvedStatus==='APPROVED'?'Gửi đề xuất loại hình':'Lưu loại hình'}</button>
  <button type="button" onClick={()=>{setLoadedKey('');void load();}} className="ml-3 underline">Tải lại yêu cầu</button>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
 </section>;
}
