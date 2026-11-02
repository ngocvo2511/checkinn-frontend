export async function proxyPointsQuote(request: Request, userId: string,
  baseUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080') {
  const headers = { 'Cache-Control': 'no-store' };
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) {
    return Response.json({ error: 'Vui lòng đăng nhập' }, { status: 401, headers });
  }
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400, headers }); }
  if (!userId || !Number.isSafeInteger(body?.pointsToUse) || body.pointsToUse <= 0
      || !Number.isFinite(body?.totalAmount) || body.totalAmount <= 0 || body.totalAmount > Number.MAX_SAFE_INTEGER) {
    return Response.json({ error: 'Số điểm và tổng tiền không hợp lệ' }, { status: 400, headers });
  }
  try {
    const upstream = await fetch(`${baseUrl}/api/loyalty-points/${encodeURIComponent(userId)}/quote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify({ pointsToUse: body.pointsToUse, totalAmount: body.totalAmount }),
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (!upstream.ok) {
      const error = await upstream.json().catch(() => ({ error: 'Không tải được giảm giá điểm' }));
      return Response.json(error, { status: upstream.status, headers });
    }
    return Response.json(await upstream.json(), { status: upstream.status, headers });
  } catch {
    return Response.json({ error: 'Không tải được giảm giá điểm' }, { status: 503, headers });
  }
}
