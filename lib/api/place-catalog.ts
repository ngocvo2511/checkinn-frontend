import { readJson, readArray, ReadApiError } from './read-request.ts';
import type { PlaceSearchPage, PlaceSummary } from '../../types/place.ts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const BATCH_SIZE = 50;

const isSummary = (place: PlaceSummary) =>
  typeof place.id === 'string' && place.id.length > 0 && typeof place.name === 'string'
  && Number.isFinite(place.latitude) && Number.isFinite(place.longitude);

export async function searchPlaces(keyword: string, options: { cursor?: string | null; limit?: number } = {}): Promise<PlaceSearchPage> {
  const q = keyword.trim();
  if (q.length === 0 || q.length > 100) throw new ReadApiError('VALIDATION');
  const params = new URLSearchParams({ q });
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.limit) params.set('limit', String(options.limit));
  const data = await readJson(`${API_BASE_URL}/api/places/search?${params}`, { cache: 'no-store' });
  if (!data || typeof data !== 'object') throw new ReadApiError('INVALID_RESPONSE');
  const page = data as { items?: unknown; nextCursor?: unknown };
  if (page.nextCursor !== null && typeof page.nextCursor !== 'string') throw new ReadApiError('INVALID_RESPONSE');
  return { items: readArray<PlaceSummary>(page.items, isSummary), nextCursor: page.nextCursor };
}

/** Unknown ids are simply absent from the result. */
export async function getPlacesByIds(placeIds: string[]): Promise<Map<string, PlaceSummary>> {
  const ids = [...new Set(placeIds.filter(id => typeof id === 'string' && id.trim()))];
  const result = new Map<string, PlaceSummary>();
  for (let offset = 0; offset < ids.length; offset += BATCH_SIZE) {
    const batch = ids.slice(offset, offset + BATCH_SIZE);
    const data = await readJson(`${API_BASE_URL}/api/places/batch?ids=${batch.map(encodeURIComponent).join(',')}`, { cache: 'no-store' });
    for (const place of readArray<PlaceSummary>(data, row => isSummary(row) && batch.includes(row.id))) result.set(place.id, place);
  }
  return result;
}
