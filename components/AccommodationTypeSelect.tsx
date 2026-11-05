"use client";
import { useEffect, useState } from 'react';
import { accommodationApi, type AccommodationOption, type AccommodationType } from '@/lib/api/accommodation-types';
export function useAccommodationCatalog() {
  const [attempt,setAttempt]=useState(0);
  const [result,setResult]=useState<{attempt:number;options:AccommodationOption[];error:boolean}>({attempt:-1,options:[],error:false});
  useEffect(()=>{let active=true;
    accommodationApi.catalog().then(options=>{if(active)setResult({attempt,options,error:false})}).catch(()=>{if(active)setResult({attempt,options:[],error:true})});
    return()=>{active=false};
  },[attempt]);
  const loading=result.attempt!==attempt;
  return {options:loading?[]:result.options,error:!loading&&result.error,loading,retry:()=>setAttempt(v=>v+1)};
}
export function AccommodationTypeSelect({value,onChange,required=false,disabled=false}:{value:string;onChange:(value:AccommodationType)=>void;required?:boolean;disabled?:boolean}) {
 const {options,error,loading,retry}=useAccommodationCatalog();
 return <div className="space-y-2">
  <label className="block font-medium">Loại hình lưu trú{required?' *':''}
   <select aria-label="Loại hình lưu trú" className="block w-full rounded border p-3" value={value} required={required} disabled={disabled||loading||error} onChange={e=>onChange(e.target.value as AccommodationType)}>
    <option value="" disabled>Chọn loại hình lưu trú</option>
    {value && !options.some(o=>o.code===value) && <option value={value}>{value}</option>}
    {options.map(o=><option key={o.code} value={o.code}>{o.label}</option>)}
   </select>
  </label>
  {loading&&<p role="status">Đang tải danh mục…</p>}
  {error&&<p role="alert">Không tải được danh mục loại hình. <button type="button" onClick={retry} className="underline">Thử lại danh mục</button></p>}
 </div>;
}
