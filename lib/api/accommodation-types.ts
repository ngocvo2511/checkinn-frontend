import { readJson, readArray, ReadApiError } from './read-request.ts';
export type AccommodationType = 'HOTEL' | 'VILLA' | 'APARTMENT' | 'GUEST_HOUSE';
export interface AccommodationOption { code: AccommodationType; label: string }
export interface AccommodationChange {
  id: string; hotelId: string; previousType: AccommodationType | null; requestedType: AccommodationType;
  previousTypeLabel: string | null; requestedTypeLabel: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: string; rejectionReason: string | null;
}
const base = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/hotel/hotels`;
function headers() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${typeof window === 'undefined' ? '' : localStorage.getItem('token') || ''}` }; }
function changes(value: unknown) {
  return readArray<AccommodationChange>(value,c => typeof c.id==='string' && typeof c.hotelId==='string' && typeof c.requestedTypeLabel==='string' && ['PENDING','APPROVED','REJECTED','SUPERSEDED'].includes(c.status));
}
export const accommodationApi = {
  async catalog(): Promise<AccommodationOption[]> {
    const result=readArray<AccommodationOption>(await readJson(`${base}/accommodation-types`),v => ['HOTEL','VILLA','APARTMENT','GUEST_HOUSE'].includes(v.code) && typeof v.label==='string' && !!v.label.trim());
    if (result.length!==4 || new Set(result.map(v=>v.code)).size!==4) throw new ReadApiError('INVALID_RESPONSE');
    return result;
  },
  async history(id: string) { return changes(await readJson(`${base}/${encodeURIComponent(id)}/accommodation-type-changes`,{headers:headers(),cache:'no-store'})); },
  async pending() { return changes(await readJson(`${base}/accommodation-type-changes/pending`,{headers:headers(),cache:'no-store'})); },
  async propose(id: string, type: AccommodationType) {
    return readJson(`${base}/${encodeURIComponent(id)}/accommodation-type-changes`,{method:'POST',headers:headers(),body:JSON.stringify({accommodationType:type})});
  },
  async review(id: string, approve: boolean, reason?: string) {
    return readJson(`${base}/accommodation-type-changes/${encodeURIComponent(id)}/${approve?'approve':'reject'}`,{method:'POST',headers:headers(),body:JSON.stringify({reason})});
  },
};
