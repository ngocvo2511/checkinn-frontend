export const MIN_PRICE = 0;
export const MAX_PRICE = 24000000;
export interface SearchFilterValues {
  priceRange: number[];
  amenities: string[];
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
  return {accommodationTypes:[...new Set(params.getAll('accommodationTypes'))].sort(),priceRange:[Math.min(min,max),max],amenities:[...new Set(params.getAll('amenity').filter(Boolean))].sort(),starRatings:numbers('star',1,5),guestRatings:numbers('guestRating',0,10)};
}
export function patchSearchFilters(params: URLSearchParams, patch: Partial<SearchFilterValues>): URLSearchParams {
  const next = new URLSearchParams(params);
  if (patch.priceRange) {
    next.set('minPrice',String(patch.priceRange[0])); next.set('maxPrice',String(patch.priceRange[1]));
  }
  for (const [field,key] of [['accommodationTypes','accommodationTypes'],['amenities','amenity'],['starRatings','star'],['guestRatings','guestRating']] as const) {
    if (patch[field] === undefined) continue;
    next.delete(key);
    for (const value of patch[field]!) next.append(key,String(value));
  }
  return next;
}
