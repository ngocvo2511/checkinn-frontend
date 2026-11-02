import { proxyPointsQuote } from '@/lib/server/points-quote-proxy';

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  return proxyPointsQuote(request, (await params).userId);
}
