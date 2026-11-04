"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {accommodationApi,type AccommodationChange} from '@/lib/api/accommodation-types';
export function AccommodationTypeReviews({hotelId,onReviewed}:{hotelId?:string;onReviewed?:()=>Promise<void>|void}){
 const [rows,setRows]=useState<AccommodationChange[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[reasons,setReasons]=useState<Record<string,string>>({});
 async function load(){setLoading(true);setError('');try{setRows(await accommodationApi.pending());}catch{setError('Không tải được yêu cầu duyệt loại hình.');}finally{setLoading(false);}}
 useEffect(()=>{void load()},[]);
 async function review(c:AccommodationChange,approve:boolean){setBusy(c.id);setError('');try{await accommodationApi.review(c.id,approve,reasons[c.id]);await load();await onReviewed?.();}catch{setError('Không thể duyệt: yêu cầu có thể đã thay đổi hoặc bạn không có quyền. Hãy tải lại trước khi xét duyệt.');}finally{setBusy('');}}
 return <section className="rounded-xl border bg-white p-5 space-y-4" aria-label="Duyệt loại hình lưu trú">
  <h2 className="text-xl font-semibold">Thay đổi loại hình lưu trú</h2>
  <button className="underline" type="button" onClick={()=>void load()} disabled={!!busy}>Tải lại yêu cầu loại hình</button>
  {loading?<p>Đang tải yêu cầu…</p>:!error&&rows.length===0?<p>Không có yêu cầu loại hình chờ duyệt.</p>:null}
  {error&&<p role="alert">{error}</p>}
  {!loading&&!error&&rows.filter(c=>!hotelId||c.hotelId===hotelId).map(c=><article key={c.id} className="border rounded p-4 space-y-2">
   <Link href={`/admin/accommodation-types/${c.hotelId}`} className="underline">Xem cơ sở {c.hotelId}</Link>
   <p>Loại hiện tại khi đề xuất: {c.previousTypeLabel||'Chưa phân loại'}</p><p>Loại đề xuất: <strong>{c.requestedTypeLabel}</strong></p>
   <p>Gửi lúc: {new Date(c.createdAt).toLocaleString('vi-VN')}</p>
   <label className="block">Lý do từ chối<input aria-label={`Lý do từ chối ${c.id}`} maxLength={1000} className="border rounded p-2 ml-2" value={reasons[c.id]||''} onChange={e=>setReasons({...reasons,[c.id]:e.target.value})}/></label>
   <button className="rounded bg-blue-700 text-white px-4 py-2 mr-2" type="button" disabled={!!busy} onClick={()=>void review(c,true)}>Chấp thuận loại hình</button>
   <button className="rounded border px-4 py-2" type="button" disabled={!!busy||!reasons[c.id]?.trim()} onClick={()=>void review(c,false)}>Từ chối loại hình</button>
  </article>)}
 </section>;
}
