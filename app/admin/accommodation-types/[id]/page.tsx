"use client";
import {useCallback,useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import {AccommodationTypeReviews} from '@/components/admin/AccommodationTypeReviews';
import {hotelApi,type Hotel} from '@/lib/api/hotels';
export default function AccommodationReviewDetail(){
 const id=useParams().id as string;
 const [hotel,setHotel]=useState<Hotel|null>(null),[error,setError]=useState('');
 const load=useCallback(async()=>{try{const value=await hotelApi.getHotelPreview(id,localStorage.getItem('token')||'');setHotel(value);setError('');}catch{setError('Không tải được thông tin cơ sở.');}},[id]);
 useEffect(()=>{
  let current=true;
  hotelApi.getHotelPreview(id,localStorage.getItem('token')||'').then(value=>{if(current){setHotel(value);setError('');}}).catch(()=>{if(current)setError('Không tải được thông tin cơ sở.');});
  return()=>{current=false;};
 },[id]);
 return <div><AdminMenu/><main className="ml-[280px] p-8 space-y-5">
  <h1 className="text-2xl font-semibold">Xét duyệt loại hình lưu trú</h1>
  <button type="button" className="underline" onClick={()=>void load()}>Tải lại thông tin cơ sở</button>
  {error&&<p role="alert">{error}</p>}
  {hotel&&<section className="border rounded p-4 space-y-2"><h2>{hotel.name}</h2><p>Loại công bố: {hotel.accommodationTypeLabel||'Chưa phân loại'}</p><p>{hotel.description}</p><p>{hotel.address?.street}, {hotel.address?.city}</p><p>Trạng thái: {hotel.approvedStatus}</p></section>}
  <AccommodationTypeReviews hotelId={id} onReviewed={load}/>
 </main></div>;
}
