import {readJson,readArray,ReadApiError} from './read-request.ts';
const API_BASE_URL=process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
export interface ReviewSummary {hotelId:string;totalReviews:number;averageRating:number|null;}
/** Bound each public request; search never loads review content or guest identities. */
export async function getReviewSummaries(hotelIds:string[]):Promise<Map<string,ReviewSummary>> {
 const ids=[...new Set(hotelIds)];
 if(ids.some(id=>typeof id!=='string'||!id.trim()))throw new ReadApiError('VALIDATION');
 const result=new Map<string,ReviewSummary>();
 for(let offset=0;offset<ids.length;offset+=100){
  const batch=ids.slice(offset,offset+100),query=new URLSearchParams();
  for(const id of batch)query.append('hotelIds',id);
  const data=await readJson(`${API_BASE_URL}/api/hotel/api/v1/reviews/summaries?${query}`);
  const rows=readArray<ReviewSummary>(data,row=>batch.includes(row.hotelId)&&Number.isSafeInteger(row.totalReviews)&&row.totalReviews>=0&&
   (row.totalReviews===0?row.averageRating===null:typeof row.averageRating==='number'&&Number.isFinite(row.averageRating)&&row.averageRating>=0&&row.averageRating<=10));
  for(const row of rows){if(result.has(row.hotelId))throw new ReadApiError('INVALID_RESPONSE');result.set(row.hotelId,row);}
 }
 return result;
}
