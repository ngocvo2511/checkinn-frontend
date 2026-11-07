import {offerPage} from './offer-fixtures';
import {test,expect} from '@playwright/test';
const ids=Array.from({length:7},(_,i)=>`11111111-1111-4111-8111-${String(i+1).padStart(12,'0')}`);
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type','access-control-allow-methods':'GET,OPTIONS'};
test('search page includes seven aggregate ratings without extra summary or review-content calls',async({page})=>{
 let summaries=0,details=0,offers=0;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.port==='8080'){
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(u.pathname.endsWith('/accommodation-types'))return route.fulfill({headers:cors,json:[]});
   if(u.pathname.endsWith('/hotels/offers/page')){offers++;return route.fulfill({headers:cors,json:offerPage(u,ids.map((id,i)=>({hotel:{id,isActive:true,approvedStatus:'APPROVED',name:`Summary hotel ${i+1}`,address:{},roomTypes:[]},offer:{roomTypeId:id,quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null},reviews:{hotelId:id,totalReviews:2,averageRating:8.5}})))});}
   if(u.pathname.endsWith('/reviews/summaries')){
    summaries++;expect(u.searchParams.getAll('hotelIds')).toEqual(ids);
    return route.fulfill({headers:cors,json:ids.map(hotelId=>({hotelId,totalReviews:2,averageRating:8.5}))});
   }
   if(u.pathname.includes('/stats/')){details++;return route.fulfill({headers:cors,json:{totalReviews:2,averageRating:8.5,recentReviews:[]}});}
   return route.fulfill({headers:cors,json:[]});
  }
  if(u.origin!=='http://127.0.0.1:3300')return route.abort();
  if(u.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 await page.goto('/search?cityName=Fixture');
 await expect(page.getByText('Summary hotel 7',{exact:true})).toBeVisible();
 expect(offers).toBe(1);expect(summaries).toBe(0);expect(details).toBe(0);
 await expect(page.getByText('8.5/10',{exact:true})).toHaveCount(7);
});
