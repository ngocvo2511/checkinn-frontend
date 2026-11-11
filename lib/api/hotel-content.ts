import type {Hotel} from './hotels.ts';

const BASE=process.env.NEXT_PUBLIC_API_BASE_URL||'http://localhost:8080';
export interface PolicyInput {category:string;content:string}
export interface QuestionInput {question:string;answer:string}
export interface AmenityInput {title:string;amenities:{title:string}[]}
export class HotelContentError extends Error {
 readonly status:number|null;
 constructor(status:number|null,scope:'content'|'amenities'='content'){
  super(status===400?(scope==='amenities'?'Mỗi danh mục và tiện ích cần tên không trống, tối đa 255 ký tự. Hãy hoàn thiện hoặc xóa dòng không dùng.':'Chính sách cần danh mục và nội dung; FAQ cần câu hỏi tối đa 255 ký tự và câu trả lời. Hãy hoàn thiện hoặc xóa dòng không dùng.')
   :status===401?'Vui lòng đăng nhập để cập nhật nội dung.'
   :status===403?'Bạn không có quyền cập nhật khách sạn này.'
   :status===404?'Không tìm thấy khách sạn hoặc nội dung yêu cầu.'
   :'Chưa thể xác nhận nội dung đã lưu. Hãy tải lại khách sạn và kiểm tra trước khi gửi tiếp.');
  this.name='HotelContentError';this.status=status;
 }
}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown):value is string=>typeof value==='string'&&!!value.trim();
export function preparePolicies(value:unknown):PolicyInput[]{
 if(!Array.isArray(value)||value.some(p=>!record(p)||!text(p.category)||p.category.length>255||!text(p.content)))throw new HotelContentError(400);
 return value.map(p=>({category:p.category.trim(),content:p.content.trim()}));
}
export function prepareQuestions(value:unknown):QuestionInput[]{
 if(!Array.isArray(value)||value.some(q=>!record(q)||!text(q.question)||q.question.length>255||!text(q.answer)))throw new HotelContentError(400);
 return value.map(q=>({question:q.question.trim(),answer:q.answer.trim()}));
}
export function prepareAmenities(value:unknown):AmenityInput[]{
 if(!Array.isArray(value))throw new HotelContentError(400,'amenities');
 for(const category of value){
  if(!record(category)||Object.hasOwn(category,'items')||!text(category.title)||category.title.length>255)throw new HotelContentError(400,'amenities');
  if(category.amenities!=null && (!Array.isArray(category.amenities)||category.amenities.some(item=>!record(item)||!text(item.title)||item.title.length>255)))throw new HotelContentError(400,'amenities');
 }
 return value.map(category=>({title:category.title.trim(),amenities:(category.amenities??[]).map((item:{title:string})=>({title:item.title.trim()}))}));
}
export async function updateHotelContent(id:string,kind:'policies'|'questions'|'amenities',value:unknown,headers:Record<string,string>):Promise<Hotel>{
 if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw new HotelContentError(400);
 const body=kind==='amenities'?{amenityCategories:prepareAmenities(value)}:kind==='policies'?preparePolicies(value):prepareQuestions(value);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(`${BASE}/api/hotel/hotels/${encodeURIComponent(id)}/${kind}`,{
   method:'PUT',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:controller.signal,
  });
  if(!response.ok){await response.body?.cancel().catch(()=>undefined);throw new HotelContentError(response.status,kind==='amenities'?'amenities':'content');}
  const data:unknown=await response.json(),field=kind==='amenities'?'amenityCategories':kind==='policies'?'policies':'faqs';
  if(!record(data)||typeof data.id!=='string'||data.id.toLowerCase()!==id.toLowerCase()||!Array.isArray(data[field]))throw new HotelContentError(null);
  if(kind==='amenities'){
   if((data[field] as unknown[]).some(category=>!record(category)||typeof category.title!=='string'||!Array.isArray(category.items)||category.items.some(item=>!record(item)||typeof item.title!=='string')))throw new HotelContentError(null);
  }else if((data[field] as unknown[]).some(row=>!record(row)|| (kind==='policies'
   ?typeof row.category!=='string'||typeof row.content!=='string':typeof row.question!=='string'||typeof row.answer!=='string')))throw new HotelContentError(null);
  return data as unknown as Hotel;
 }catch(error){throw error instanceof HotelContentError?error:new HotelContentError(null);}
 finally{clearTimeout(timer);}
}
