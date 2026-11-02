'use client';

import { useEffect, useState } from 'react';
import { createPointsQuoteLoader, fetchPointsQuote, quoteKey, type PointsQuoteState } from '@/lib/points-quote';

export function usePointsQuote(userId: string, totalAmount: number, pointsToUse: number) {
  const [loader] = useState(() => createPointsQuoteLoader(fetchPointsQuote));
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<PointsQuoteState>({ key: '', status: 'idle', quote: null, error: null });
  useEffect(() => {
    void loader.load({ userId, totalAmount, pointsToUse }, setState);
    return () => loader.cancel();
  }, [loader, userId, totalAmount, pointsToUse, attempt]);
  // Props can change one render before the effect cancels the previous request.
  const current: PointsQuoteState = state.key === quoteKey({ userId, totalAmount, pointsToUse }) ? state
    : { key: '', status: pointsToUse === 0 ? 'idle' : 'loading', quote: null, error: null };
  return { ...current, retry: () => setAttempt(value => value + 1) };
}
