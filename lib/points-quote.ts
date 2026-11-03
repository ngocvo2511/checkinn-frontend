export interface PointsQuoteInput {
  userId: string;
  pointsToUse: number;
  totalAmount: number;
}

export interface PointsQuote {
  pointsToUse: number;
  discountAmount: number;
  redemptionRate: number;
}

export interface PointsQuoteState {
  key: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  quote: PointsQuote | null;
  error: string | null;
}

export const quoteKey = (input: PointsQuoteInput) => JSON.stringify([input.userId, input.pointsToUse, input.totalAmount]);

export function validPointsInput(input: PointsQuoteInput): boolean {
  return Boolean(input.userId) && Number.isSafeInteger(input.pointsToUse) && input.pointsToUse > 0
    && Number.isFinite(input.totalAmount) && input.totalAmount > 0 && input.totalAmount <= Number.MAX_SAFE_INTEGER;
}

export async function fetchPointsQuote(input: PointsQuoteInput, signal?: AbortSignal): Promise<PointsQuote> {
  if (!validPointsInput(input)) throw new Error('Số điểm và tổng tiền không hợp lệ.');
  const token = typeof window === 'undefined' ? null : window.localStorage.getItem('token')
    || window.localStorage.getItem('accessToken') || window.sessionStorage.getItem('token') || window.sessionStorage.getItem('accessToken');
  if (!token) throw new Error('Vui lòng đăng nhập để sử dụng điểm.');
  let response: Response;
  try {
    response = await fetch(`/api/loyalty-points/${encodeURIComponent(input.userId)}/quote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pointsToUse: input.pointsToUse, totalAmount: input.totalAmount }), signal, cache: 'no-store',
    });
  } catch { throw new Error('Không tải được giảm giá điểm. Vui lòng thử lại hoặc đặt không dùng điểm.'); }
  if (response.status === 409) throw new Error('Điểm thưởng cần được đối soát. Vui lòng liên hệ hỗ trợ hoặc đặt phòng không dùng điểm.');
  if (!response.ok) throw new Error('Không tải được giảm giá điểm. Vui lòng thử lại hoặc đặt không dùng điểm.');
  const quote: PointsQuote = await response.json().catch(() => { throw new Error('Báo giá điểm không hợp lệ. Vui lòng thử lại.'); });
  if (!quote || !Number.isSafeInteger(quote.pointsToUse) || quote.pointsToUse < 0 || quote.pointsToUse > input.pointsToUse
      || !Number.isFinite(quote.redemptionRate) || quote.redemptionRate <= 0
      || !Number.isFinite(quote.discountAmount) || quote.discountAmount < 0 || quote.discountAmount > input.totalAmount * 0.5
      || Math.abs(quote.discountAmount - quote.pointsToUse * quote.redemptionRate) > 0.000001) {
    throw new Error('Báo giá điểm không hợp lệ. Vui lòng thử lại.');
  }
  return quote;
}

/** A replaced/cleared request can never publish its result, even if abort is ignored. */
export function createPointsQuoteLoader(fetchQuote: (input: PointsQuoteInput, signal: AbortSignal) => Promise<PointsQuote>) {
  let generation = 0;
  let controller: AbortController | null = null;
  return {
    cancel() { generation++; controller?.abort(); },
    async load(input: PointsQuoteInput, publish: (state: PointsQuoteState) => void) {
      const current = ++generation;
      controller?.abort();
      controller = new AbortController();
      const key = quoteKey(input);
      if (input.pointsToUse === 0) {
        publish({ key, status: 'idle', quote: null, error: null });
        return;
      }
      publish({ key, status: 'loading', quote: null, error: null });
      try {
        const quote = await fetchQuote(input, controller.signal);
        if (current === generation) publish({ key, status: 'ready', quote, error: null });
      } catch (error) {
        if (current === generation) publish({ key, status: 'error', quote: null,
          error: error instanceof Error ? error.message : 'Không tải được giảm giá điểm.' });
      }
    },
  };
}
