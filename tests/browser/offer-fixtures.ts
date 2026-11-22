/** Test API responses from precomputed global matches; backend ordering/filtering is tested separately. */
interface OfferFixture {
 hotel: {id:string; amenityCategories?: {items?: {title?:string}[]}[]};
 reviews?: {hotelId:string;totalReviews:number;averageRating:number|null};
}
export function offerPage<T extends OfferFixture>(url:URL,rows:T[],options:{availableAmenities?:string[]}={}) {
 const page=Number(url.searchParams.get('page')??0),size=Number(url.searchParams.get('size')??20),sort=url.searchParams.get('sort')??'DEFAULT';
 const availableAmenities=options.availableAmenities??[...new Set<string>(rows.flatMap(r=>(r.hotel.amenityCategories??[]).flatMap((c)=>(c.items??[]).map((i)=>i.title?.trim()).filter((title): title is string => Boolean(title)))))].sort();
 return {page,size,sort,totalElements:rows.length,totalPages:Math.ceil(rows.length/size),availableAmenities,
  content:rows.slice(page*size,(page+1)*size).map(r=>({...r,reviews:r.reviews??{hotelId:r.hotel.id,totalReviews:0,averageRating:null}}))};
}
