export class ApiRequestError extends Error {
 readonly status:number; readonly code:string; readonly requestId?:string; readonly fieldErrors:Record<string,string>;
 constructor(status:number,code:string,message:string,requestId?:string,fieldErrors:Record<string,string>={}) {
  super(message);this.name='ApiRequestError';this.status=status;this.code=code;this.requestId=requestId;this.fieldErrors=fieldErrors;
 }
}
const codes:Record<number,string>={400:'INVALID_REQUEST',401:'UNAUTHORIZED',403:'FORBIDDEN',404:'NOT_FOUND',409:'CONFLICT',429:'RATE_LIMITED',502:'DEPENDENCY_UNAVAILABLE',503:'DEPENDENCY_UNAVAILABLE',504:'DEPENDENCY_TIMEOUT'};
const messages:Record<number,string>={400:'Thông tin yêu cầu không hợp lệ.',401:'Vui lòng đăng nhập để tiếp tục.',403:'Bạn không có quyền thực hiện yêu cầu này.',404:'Không tìm thấy dữ liệu yêu cầu.',409:'Dữ liệu đã thay đổi hoặc chưa sẵn sàng. Hãy tải lại trạng thái.',429:'Có quá nhiều yêu cầu. Vui lòng thử lại sau.'};
export function transportError(error:unknown):ApiRequestError {
 const timeout=error instanceof Error&&['TimeoutError','AbortError'].includes(error.name);
 return new ApiRequestError(0,timeout?'TIMEOUT':'NETWORK',timeout?'Yêu cầu quá thời gian. Chưa xác định được kết quả; hãy kiểm tra trạng thái trước khi thử lại.':'Không thể kết nối. Hãy kiểm tra trạng thái trước khi thử lại.');
}
export async function responseError(response:Response):Promise<ApiRequestError> {
 let text:string;
 try{text=await response.text();}catch(error){return transportError(error);}
 let body:Record<string,unknown>={};
 try{const parsed:unknown=JSON.parse(text);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))body=parsed as Record<string,unknown>;}catch{/* Legacy plain/empty errors stay supported. */}
 const safeId=(v:unknown)=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(v)?v:undefined;
 const requestId=safeId(body.requestId)||safeId(response.headers.get('X-Request-ID'));
 let code=codes[response.status]||(response.status>=500?'INTERNAL_ERROR':'REQUEST_FAILED');
 if(typeof body.code==='string'&&/^[A-Z][A-Z0-9_]{0,63}$/.test(body.code))code=body.code;
 let message=messages[response.status]||'Không thể xử lý yêu cầu lúc này. Hãy kiểm tra trạng thái và thử lại sau.';
 const fields:Record<string,string>={};
 if(response.status<500){
  if(typeof body.message==='string'&&body.message.trim())message=body.message;
  else if(text.trim()&&!/^[\s]*[<{\[]/.test(text)&&text.length<=1000)message=text;
  if(body.fieldErrors&&typeof body.fieldErrors==='object'&&!Array.isArray(body.fieldErrors))for(const [key,value]of Object.entries(body.fieldErrors))if(typeof value==='string')fields[key]=value;
 }
 return new ApiRequestError(response.status,code,message,requestId,fields);
}
/** The deadline remains attached to the response body; mutations are never retried here. */
export async function bookingFetch(url:string,init:RequestInit={},timeoutMs=15000):Promise<Response> {
 try{return await fetch(url,{...init,signal:AbortSignal.timeout(timeoutMs)});}catch(error){throw transportError(error);}
}
