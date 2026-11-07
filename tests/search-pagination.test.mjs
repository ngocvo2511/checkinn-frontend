import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelApi} from '../lib/api/hotels.ts';
import {parseSearchPaging,patchSearchPaging,patchSearchFilters} from '../lib/search/criteria.ts';
const row={hotel:{id:'fixture',name:'Synthetic hotel',isActive:true,approvedStatus:'APPROVED',roomTypes:[]},offer:{roomTypeId:'room',quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null},reviews:{hotelId:'fixture',totalReviews:0,averageRating:null}};
const page={page:0,size:1,sort:'PRICE_ASC',totalElements:3,totalPages:3,availableAmenities:['Pool, Indoor'],content:[row]};
async function mocked(fetcher,run){const previous=globalThis.fetch;globalThis.fetch=fetcher;try{await run();}finally{globalThis.fetch=previous;}}
test('paged search sends every global filter and reads server totals/review facts in one request',async()=>{
 let count=0;await mocked(async url=>{count++;const u=new URL(url);assert.ok(u.pathname.endsWith('/hotels/offers/page'));assert.deepEqual(u.searchParams.getAll('amenities'),['Pool, Indoor']);assert.deepEqual(u.searchParams.getAll('starRatings'),['4','5']);assert.deepEqual(u.searchParams.getAll('guestRatings'),['8.5']);assert.equal(u.searchParams.get('page'),'0');assert.equal(u.searchParams.get('size'),'1');return Response.json(page);},async()=>{
  const result=await hotelApi.searchHotelOfferPage({cityId:'city',page:0,size:1,sort:'PRICE_ASC',amenities:['Pool, Indoor'],starRatings:[4,5],guestRatings:[8.5]});assert.equal(count,1);assert.equal(result.content[0].matchedOffer.unitPrice,200000);assert.equal(result.content[0].reviews.averageRating,null);assert.equal(result.totalElements,3);assert.equal(result.totalPages,3);
 });
});
test('out-of-range page is an empty page with original total, not no matches',async()=>{
 await mocked(async()=>Response.json({...page,page:99,content:[]}),async()=>{const result=await hotelApi.searchHotelOfferPage({page:99,size:1,sort:'PRICE_ASC'});assert.equal(result.content.length,0);assert.equal(result.totalElements,3);});
});
test('malformed page totals/boundaries/facts/unsolicited identities are rejected',async()=>{
 for(const value of [null,[],{...page,page:1},{...page,size:2},{...page,sort:'POPULAR'},{...page,totalElements:-1},{...page,totalPages:2},{...page,content:[]},{...page,availableAmenities:['A','A']},{...page,content:[{...row,reviews:{hotelId:'foreign',totalReviews:0,averageRating:null}}]},{...page,content:[{...row,reviews:{hotelId:'fixture',totalReviews:2,averageRating:null}}]},{...page,size:2,totalElements:2,totalPages:1,content:[row,row]}])await mocked(async()=>Response.json(value),async()=>assert.rejects(hotelApi.searchHotelOfferPage({size:value?.size===2?2:1,sort:'PRICE_ASC'}),e=>e.code==='INVALID_RESPONSE'));
});
test('invalid page/size/sort controls never request an unbounded fallback list',async()=>{
 await mocked(()=>assert.fail('invalid input should not fetch'),async()=>{for(const params of [{page:-1},{page:1.5},{page:2147483648},{size:0},{size:51},{sort:'POPULAR'}])await assert.rejects(hotelApi.searchHotelOfferPage(params),e=>e.code==='VALIDATION');});
});
test('page HTTP failure remains typed and never falls back to client pagination or zero results',async()=>{
 let calls=0;await mocked(async()=>{calls++;return new Response(null,{status:503});},async()=>{await assert.rejects(hotelApi.searchHotelOfferPage({}),e=>e.code==='UPSTREAM'&&e.status===503);assert.equal(calls,1);});
});
test('URL page controls reset page on sort/size/filter changes while preserving destination and filters',()=>{
 const original=new URLSearchParams('cityId=fixture&page=4&size=10&sort=PRICE_DESC&amenity=Pool&star=5');
 assert.deepEqual(parseSearchPaging(original),{page:4,size:10,sort:'PRICE_DESC'});
 const sorted=patchSearchPaging(original,{sort:'RATING_DESC'});assert.equal(sorted.has('page'),false);assert.equal(sorted.get('size'),'10');assert.equal(sorted.get('amenity'),'Pool');
 const filtered=patchSearchFilters(original,{guestRatings:[8.5]});assert.equal(filtered.has('page'),false);assert.equal(filtered.get('sort'),'PRICE_DESC');assert.equal(filtered.get('size'),'10');assert.equal(filtered.get('cityId'),'fixture');
 const next=patchSearchPaging(original,{page:5});assert.equal(next.get('page'),'5');assert.equal(next.get('sort'),'PRICE_DESC');assert.equal(original.get('page'),'4');
 assert.ok(Number.isNaN(parseSearchPaging(new URLSearchParams('page=')).page));
});
