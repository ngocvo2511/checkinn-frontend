/** Test API responses from precomputed global matches; backend ordering/filtering is tested separately. */
export function offerPage(url:URL,rows:any[],options:{availableAmenities?:string[]}={}) {
 const page=Number(url.searchParams.get('page')??0),size=Number(url.searchParams.get('size')??20),sort=url.searchParams.get('sort')??'DEFAULT';
 const availableAmenities=options.availableAmenities??[...new Set<string>(rows.flatMap(r=>(r.hotel.amenityCategories??[]).flatMap((c:any)=>(c.items??[]).map((i:any)=>i.title?.trim()).filter(Boolean))))].sort();
 return {page,size,sort,totalElements:rows.length,totalPages:Math.ceil(rows.length/size),availableAmenities,
  content:rows.slice(page*size,(page+1)*size).map(r=>({...r,reviews:r.reviews??{hotelId:r.hotel.id,totalReviews:0,averageRating:null}}))};
}
