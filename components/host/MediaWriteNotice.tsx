export default function MediaWriteNotice({message,needsReload,onReload,loading=false}:{message:string|null;needsReload:boolean;onReload:()=>void;loading?:boolean}){
 if(!message)return null;
 return <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
  <p>{message}</p>
  {needsReload&&<button type="button" className="mt-2 underline" disabled={loading} onClick={onReload}>Tải lại để kiểm tra ảnh</button>}
 </div>;
}
