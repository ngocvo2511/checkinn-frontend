import type {HotelVerificationDocuments} from './hotels.ts';
const BASE=process.env.NEXT_PUBLIC_API_BASE_URL||'http://localhost:8080';

export class DocumentApiError extends Error {
 readonly status:number|null;
 constructor(status:number|null) {
  super(status===401?'Vui lòng đăng nhập để xem hồ sơ.'
   :status===403?'Bạn không có quyền truy cập hồ sơ này.'
   :status===404?'Không tìm thấy hồ sơ yêu cầu.'
   :status===400?'Thông tin tài liệu không hợp lệ.'
   :'Không thể tải hoặc xác nhận tài liệu lúc này. Hãy kiểm tra hồ sơ trước khi gửi lại.');
  this.name='DocumentApiError';this.status=status;
 }
}
async function request(id:string,headers:Record<string,string>,body?:FormData):Promise<unknown> {
 if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw new DocumentApiError(400);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 const options:RequestInit={method:body?'POST':'GET',headers:{Accept:'application/json',...headers},body,signal:controller.signal};
 try {
  let response=await fetch(`${BASE}/api/hotel/hotels/${encodeURIComponent(id)}/documents`,options);
  // Read-only legacy routing remains compatible. Uploads are never automatically replayed.
  if(!body && response.status===404) {
   await response.body?.cancel().catch(()=>undefined);
   response=await fetch(`${BASE}/hotels/${encodeURIComponent(id)}/documents`,options);
  }
  if(!response.ok) {await response.body?.cancel().catch(()=>undefined);throw new DocumentApiError(response.status);}
  return await response.json();
 }catch(error){throw error instanceof DocumentApiError?error:new DocumentApiError(null);}
 finally{clearTimeout(timer);}
}
const record=(value:unknown):value is Record<string,unknown>=>!!value && typeof value==='object' && !Array.isArray(value);
export async function getHotelVerificationDocuments(id:string,headers:Record<string,string>):Promise<HotelVerificationDocuments> {
 const data=await request(id,headers);
 if(!record(data) || typeof data.hotelId!=='string' || data.hotelId.toLowerCase()!==id.toLowerCase()
   || !['DRAFT','PENDING','APPROVED','REJECTED'].includes(String(data.approvedStatus)))throw new DocumentApiError(null);
 for(const field of ['businessLicenseNumber','taxId','operationLicenseNumber','ownerIdentityNumber','rejectionReason'])
  if(data[field]!=null && typeof data[field]!=='string')throw new DocumentApiError(null);
 for(const field of ['businessLicenseUrl','operationLicenseUrl','ownerIdentityFrontUrl','ownerIdentityBackUrl']) {
  if(data[field]==null)continue;
  if(typeof data[field]!=='string')throw new DocumentApiError(null);
  try{const url=new URL(data[field]);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error();}
  catch{throw new DocumentApiError(null);}
 }
 return data as unknown as HotelVerificationDocuments;
}
export async function uploadHotelVerificationDocuments(id:string,body:FormData,headers:Record<string,string>):Promise<Record<string,unknown>> {
 const data=await request(id,headers,body);
 if(!record(data) || typeof data.message!=='string' || !data.message.trim())throw new DocumentApiError(null);
 return data;
}
