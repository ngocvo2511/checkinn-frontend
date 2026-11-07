"use client";
import {useEffect,useState} from 'react';
import {amenityApi,type AmenityCode} from '@/lib/api/amenity-catalog';
export function AmenityCodeFilters({value,onChange}:{value:string[];onChange:(codes:string[])=>void}) {
 const [options,setOptions]=useState<AmenityCode[]>([]),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0);
 useEffect(()=>{let current=true;amenityApi.catalog().then(rows=>{if(current){setOptions(rows);setStatus('ready');}}).catch(()=>{if(current)setStatus('error');});return()=>{current=false;};},[retry]);
 return <fieldset className="border-t pt-5 space-y-3"><legend className="font-semibold">Tiện nghi đã chuẩn hóa</legend>
  <p className="text-xs">Khớp tất cả mã đã chọn ở cấp cơ sở lưu trú, theo mapping đã duyệt.</p>
  {status==='loading'&&<p>Đang tải tiện nghi…</p>}
  {status==='error'&&<p role="alert">Không tải được catalog tiện nghi. <button type="button" onClick={()=>{setStatus('loading');setRetry(n=>n+1);}}>Thử lại tiện nghi</button></p>}
  {status==='ready'&&options.length===0&&<p>Chưa có mã tiện nghi được công bố.</p>}
  {status==='ready'&&options.map(option=><label key={option.code} className="flex gap-3"><input type="checkbox" checked={value.includes(option.code)} onChange={()=>onChange(value.includes(option.code)?value.filter(c=>c!==option.code):[...value,option.code])}/>{option.label}</label>)}
  {status==='ready'&&value.some(code=>!options.some(o=>o.code===code))&&<p role="alert">URL chứa mã không tồn tại hoặc đã ngừng sử dụng. Hãy xóa hoặc chọn lại.</p>}
  {value.length>0&&<button type="button" onClick={()=>onChange([])}>Xóa bộ lọc mã tiện nghi</button>}
 </fieldset>;
}
