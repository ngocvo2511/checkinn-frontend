export const MIN_PRICE = 0;
export const MAX_PRICE = 24000000;
export interface SearchFilterValues {
  priceRange: number[];
  amenities: string[];
  amenityCodes: string[];
  accommodationTypes: string[];
  starRatings: number[];
  guestRatings: number[];
}
export function parseSearchFilters(params: URLSearchParams): SearchFilterValues {
  const price = (key: string, fallback: number) => {
    const raw = params.get(key);
    const value = raw === null || raw.trim() === '' ? fallback : Number(raw);
    return Number.isFinite(value) ? Math.max(MIN_PRICE, Math.min(MAX_PRICE, value)) : fallback;
  };
  const min = price('minPrice', MIN_PRICE), max = price('maxPrice',MAX_PRICE);
  const numbers = (key: string, lower: number, upper: number) => [...new Set(params.getAll(key).map(Number).filter(n => Number.isFinite(n) && n >= lower && n <= upper))].sort((a,b) => a-b);
  return {amenityCodes:[...new Set(params.getAll('amenityCodes').filter(Boolean))].sort(),accommodationTypes:[...new Set(params.getAll('accommodationTypes'))].sort(),priceRange:[Math.min(min,max),max],amenities:[...new Set(params.getAll('amenity').filter(Boolean))].sort(),starRatings:numbers('star',1,5),guestRatings:numbers('guestRating',0,10)};
}
export function patchSearchFilters(params: URLSearchParams, patch: Partial<SearchFilterValues>): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete('page');
  if (patch.priceRange) {
    next.set('minPrice',String(patch.priceRange[0])); next.set('maxPrice',String(patch.priceRange[1]));
  }
  for (const [field,key] of [['amenityCodes','amenityCodes'],['accommodationTypes','accommodationTypes'],['amenities','amenity'],['starRatings','star'],['guestRatings','guestRating']] as const) {
    if (patch[field] === undefined) continue;
    next.delete(key);
    for (const value of patch[field]!) next.append(key,String(value));
  }
  return next;
}

export interface SearchPaging {page:number;size:number;sort:string;}
/** Invalid URL controls are rejected by the API adapter, not silently substituted. */
export function parseSearchPaging(params:URLSearchParams):SearchPaging {
 const number=(key:string,fallback:number)=>{const raw=params.get(key);return raw===null?fallback:raw.trim()?Number(raw):NaN;};
 return {page:number('page',0),size:number('size',20),sort:params.get('sort')??'DEFAULT'};
}
export function patchSearchPaging(params:URLSearchParams,patch:Partial<SearchPaging>):URLSearchParams {
 const next=new URLSearchParams(params);
 if(patch.sort!==undefined){if(patch.sort==='DEFAULT')next.delete('sort');else next.set('sort',patch.sort);next.delete('page');}
 if(patch.size!==undefined){if(patch.size===20)next.delete('size');else next.set('size',String(patch.size));next.delete('page');}
 if(patch.page!==undefined){if(patch.page===0)next.delete('page');else next.set('page',String(patch.page));}
 return next;
}
