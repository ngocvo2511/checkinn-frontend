import type {MediaAsset} from './hotels.ts';
const BASE=process.env.NEXT_PUBLIC_API_BASE_URL||'http://localhost:8080';
type Target={targetId:string;targetType:'HOTEL'|'ROOM_TYPE'};
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);

export class MediaWriteError extends Error {
 readonly status:number|null;
 readonly uncertain:boolean;
 constructor(status:number|null,draft=false){
  super(status===400?'Thông tin yêu cầu không hợp lệ.'
   :status===401?'Vui lòng đăng nhập để tiếp tục.'
   :status===403?'Bạn không có quyền thay đổi dữ liệu này.'
   :status===404?'Không tìm thấy dữ liệu yêu cầu. Hãy tải lại để kiểm tra.'
   :status===409?(draft?'Không thể xóa bản nháp lúc này. Hãy kiểm tra trạng thái khách sạn và các phòng còn tồn tại.':'Dữ liệu đã thay đổi. Hãy tải lại để kiểm tra.')
   :'Chưa thể xác nhận thay đổi đã được lưu. Hãy tải lại để kiểm tra trước khi gửi tiếp.');
  this.name='MediaWriteError';this.status=status;
  this.uncertain=status===null||status>=500||status===408;
 }
}

async function write<T>(path:string,options:RequestInit,decode:(response:Response)=>Promise<T>,draft=false):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(`${BASE}/api/hotel/${path}`,{...options,signal:controller.signal});
  if(!response.ok){await response.body?.cancel().catch(()=>undefined);throw new MediaWriteError(response.status,draft);}
  return await decode(response);
 }catch(error){throw error instanceof MediaWriteError?error:new MediaWriteError(null,draft);}
 finally{clearTimeout(timer);}
}

function media(value:unknown,expected:{id?:string;target?:Target;thumbnail?:boolean;sortOrder?:number}):MediaAsset{
 if(!record(value)||!uuid(value.id)||!uuid(value.targetId)||!['HOTEL','ROOM_TYPE'].includes(String(value.targetType))
  ||typeof value.isThumbnail!=='boolean'||!Number.isInteger(value.sortOrder)||typeof value.url!=='string')throw new MediaWriteError(null);
 try{const url=new URL(value.url);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error();}
 catch{throw new MediaWriteError(null);}
 if(expected.id&&value.id.toLowerCase()!==expected.id.toLowerCase()
  ||expected.target&&(value.targetId.toLowerCase()!==expected.target.targetId.toLowerCase()||value.targetType!==expected.target.targetType)
  ||expected.thumbnail!==undefined&&value.isThumbnail!==expected.thumbnail
  ||expected.sortOrder!==undefined&&value.sortOrder!==expected.sortOrder)throw new MediaWriteError(null);
 return value as unknown as MediaAsset;
}

export async function uploadMedia(target:Target,file:File,thumbnail:boolean,sortOrder:number,headers:Record<string,string>):Promise<MediaAsset>{
 if(!uuid(target.targetId)||!['HOTEL','ROOM_TYPE'].includes(target.targetType)||!(file instanceof Blob)
  ||typeof thumbnail!=='boolean'||!Number.isInteger(sortOrder)||sortOrder < -2147483648||sortOrder > 2147483647)throw new MediaWriteError(400);
 const body=new FormData();body.append('file',file);body.append('targetId',target.targetId);body.append('targetType',target.targetType);
 body.append('isThumbnail',String(thumbnail));body.append('sortOrder',String(sortOrder));
 return write('medias',{method:'POST',headers,body},async response=>media(await response.json(),{target,thumbnail,sortOrder}));
}
export async function selectThumbnail(id:string,headers:Record<string,string>,target?:Target):Promise<MediaAsset>{
 if(!uuid(id)||target&&(!uuid(target.targetId)||!['HOTEL','ROOM_TYPE'].includes(target.targetType)))throw new MediaWriteError(400);
 return write(`medias/${encodeURIComponent(id)}/thumbnail`,{method:'PATCH',headers},async response=>media(await response.json(),{id,target,thumbnail:true}));
}
export async function deleteMedia(id:string,headers:Record<string,string>):Promise<void>{
 if(!uuid(id))throw new MediaWriteError(400);
 return write(`medias/${encodeURIComponent(id)}`,{method:'DELETE',headers},async response=>{
  if((await response.text()).trim()!=='Deleted')throw new MediaWriteError(null);
 });
}
export async function deleteDraft(id:string,headers:Record<string,string>):Promise<void>{
 if(!uuid(id))throw new MediaWriteError(400,true);
 return write(`hotels/${encodeURIComponent(id)}/draft`,{method:'DELETE',headers},async response=>{
  const data=await response.json();if(!record(data)||typeof data.message!=='string'||!data.message.trim())throw new MediaWriteError(null,true);
 },true);
}

export async function previewMedia(target:Target,headers:Record<string,string>):Promise<MediaAsset[]>{
 if(!uuid(target.targetId)||!['HOTEL','ROOM_TYPE'].includes(target.targetType))throw new MediaWriteError(400);
 const query=new URLSearchParams(target);
 return write(`medias/preview?${query}`,{method:'GET',headers,cache:'no-store'},async response=>{
  const data:unknown=await response.json();if(!Array.isArray(data))throw new MediaWriteError(null);
  const assets=data.map(item=>media(item,{target}));
  if(new Set(assets.map(asset=>asset.id.toLowerCase())).size!==assets.length)throw new MediaWriteError(null);
  return assets;
 });
}
