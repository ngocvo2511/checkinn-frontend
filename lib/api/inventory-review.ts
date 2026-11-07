import {readJson,readArray,ReadApiError} from './read-request.ts';

export interface InventoryRequest {
 id:string;room_id:string;hotel_id:string;previous_quantity:number|null;proposed_quantity:number;
 source:string;requested_by:string;requested_at:string;status:'PENDING'|'APPROVED'|'REJECTED'|'SUPERSEDED';
 revision:number;reviewed_by:string|null;reviewed_at:string|null;review_reason:string|null;
}
export interface InventoryState {
 revision:number;managed:boolean;verified:boolean;currentQuantity:number|null;
 latestRequest:InventoryRequest|null;approvedRequest:InventoryRequest|null;
}
const base=`${process.env.NEXT_PUBLIC_API_BASE_URL||'http://localhost:8080'}/api/hotel`;
const headers=()=>({'Content-Type':'application/json',Authorization:`Bearer ${typeof window==='undefined'?'':localStorage.getItem('token')||''}`});
const integer=(value:unknown)=>Number.isSafeInteger(value);
const request=(value:InventoryRequest)=>typeof value.id==='string'&&typeof value.room_id==='string'&&typeof value.hotel_id==='string'
 &&(value.previous_quantity===null||integer(value.previous_quantity))&&integer(value.proposed_quantity)&&value.proposed_quantity>0
 &&typeof value.source==='string'&&!!value.source.trim()&&integer(value.revision)&&value.revision>=0
 &&typeof value.requested_by==='string'&&typeof value.requested_at==='string'
 &&(value.reviewed_by===null||typeof value.reviewed_by==='string')&&(value.reviewed_at===null||typeof value.reviewed_at==='string')
 &&(value.review_reason===null||typeof value.review_reason==='string')
 &&['PENDING','APPROVED','REJECTED','SUPERSEDED'].includes(value.status);
function checkedRequest(value:unknown):InventoryRequest {return readArray<InventoryRequest>([value],request)[0];}
export function inventoryState(value:unknown):InventoryState {
 if(!value||typeof value!=='object')throw new ReadApiError('INVALID_RESPONSE');
 const state=value as InventoryState;
 if(!integer(state.revision)||state.revision<0||typeof state.managed!=='boolean'||typeof state.verified!=='boolean'
   ||!(state.currentQuantity===null||integer(state.currentQuantity)))throw new ReadApiError('INVALID_RESPONSE');
 if(state.latestRequest!==null)checkedRequest(state.latestRequest);
 if(state.approvedRequest!==null)checkedRequest(state.approvedRequest);
 if(state.verified&&(!state.managed||!state.approvedRequest||state.approvedRequest.status!=='APPROVED'||state.approvedRequest.proposed_quantity!==state.currentQuantity))
   throw new ReadApiError('INVALID_RESPONSE');
 return state;
}
export const inventoryReviewApi={
 async state(roomId:string){return inventoryState(await readJson(`${base}/api/v1/${encodeURIComponent(roomId)}/inventory-review`,{headers:headers(),cache:'no-store'}));},
 async propose(roomId:string,quantity:number,revision:number,source:string){return checkedRequest(await readJson(`${base}/api/v1/${encodeURIComponent(roomId)}/inventory-review`,{method:'POST',headers:headers(),body:JSON.stringify({quantity,revision,source})}));},
 async pending(page=0,history=false){return readArray<InventoryRequest>(await readJson(`${base}/admin/inventory-reviews${history?'/history':''}?page=${page}`,{headers:headers(),cache:'no-store'}),request);},
 async review(row:InventoryRequest,approve:boolean,reason:string){return checkedRequest(await readJson(`${base}/admin/inventory-reviews/${encodeURIComponent(row.id)}/review`,{method:'POST',headers:headers(),body:JSON.stringify({approve,reason,revision:row.revision})}));},
};
