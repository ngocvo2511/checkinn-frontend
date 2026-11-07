import {readJson,readArray} from './read-request.ts';
export interface AmenityCode {code:string;label:string;description?:string|null;active:boolean;revision:number}
export interface AmenityMappingRequest {id:string;hotel_id:string;amenity_id:string;title_snapshot:string;status:string;codes:string[];revision:number;note:string|null;review_reason:string|null}
export interface AmenityMapping {id:string;title:string;revision:number;approvedCodes:Array<{code:string;label:string}>;latestRequest:AmenityMappingRequest|null}
const base=`${process.env.NEXT_PUBLIC_API_BASE_URL||'http://localhost:8080'}/api/hotel`;
const headers=()=>({'Content-Type':'application/json',Authorization:`Bearer ${typeof window==='undefined'?'':localStorage.getItem('token')||''}`});
const catalog=(data:unknown)=>readArray<AmenityCode>(data,v=>typeof v.code==='string'&&/^[A-Z][A-Z0-9_]{0,63}$/.test(v.code)&&typeof v.label==='string'&&!!v.label.trim()&&typeof v.active==='boolean'&&Number.isSafeInteger(v.revision));
const requests=(data:unknown)=>readArray<AmenityMappingRequest>(data,v=>typeof v.id==='string'&&typeof v.hotel_id==='string'&&typeof v.amenity_id==='string'&&typeof v.title_snapshot==='string'&&Array.isArray(v.codes)&&v.codes.every(c=>typeof c==='string')&&Number.isSafeInteger(v.revision));
export const amenityApi={
 async catalog(admin=false){return catalog(await readJson(`${base}/${admin?'admin/':''}amenity-catalog`,admin?{headers:headers(),cache:'no-store'}:undefined));},
 async save(value:AmenityCode,create:boolean){return readJson(`${base}/admin/amenity-catalog${create?'':'/'+encodeURIComponent(value.code)}`,{method:create?'POST':'PUT',headers:headers(),body:JSON.stringify(value)});},
 async mappings(hotelId:string){return readArray<AmenityMapping>(await readJson(`${base}/hotels/${encodeURIComponent(hotelId)}/amenity-mappings`,{headers:headers(),cache:'no-store'}),v=>typeof v.id==='string'&&typeof v.title==='string'&&Number.isSafeInteger(v.revision)&&Array.isArray(v.approvedCodes));},
 async propose(hotelId:string,row:AmenityMapping,codes:string[],note:string){return readJson(`${base}/hotels/${encodeURIComponent(hotelId)}/amenity-mappings/${encodeURIComponent(row.id)}/requests`,{method:'POST',headers:headers(),body:JSON.stringify({codes,revision:row.revision,note})});},
 async pending(page=0,history=false){return requests(await readJson(`${base}/admin/amenity-mappings${history?"/history":""}?page=${page}`,{headers:headers(),cache:'no-store'}));},
 async review(row:AmenityMappingRequest,approve:boolean,reason:string){return readJson(`${base}/admin/amenity-mappings/${encodeURIComponent(row.id)}/review`,{method:'POST',headers:headers(),body:JSON.stringify({approve,reason,revision:row.revision})});},
};
