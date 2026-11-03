"use client";

import { useEffect, useState } from "react";
import { loyaltyApi, type LoyaltyPointsResponse } from "@/lib/api/booking";
import { usePointsQuote } from "@/hooks/usePointsQuote";
import type { PointsQuoteState } from "@/lib/points-quote";

interface PointsDiscountProps {
  userId: string;
  totalAmount: number;
  onPointsChange: (usedPoints: number, discountAmount: number) => void;
  onQuoteStateChange?: (status: PointsQuoteState['status']) => void;
}

export default function PointsDiscountSection({ userId, totalAmount, onPointsChange, onQuoteStateChange }: PointsDiscountProps) {
  const [account, setAccount] = useState<{ userId: string; data: LoyaltyPointsResponse | null; error: boolean } | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const quote = usePointsQuote(userId, totalAmount, pointsToUse);
  const used = quote.quote?.pointsToUse ?? 0;
  const discount = quote.quote?.discountAmount ?? 0;

  useEffect(() => {
    let active = true;
    loyaltyApi.getUserPoints(userId).then(data => {
      if (active) setAccount({ userId, data, error: false });
    }).catch(() => { if (active) setAccount({ userId, data: null, error: true }); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => { onPointsChange(used, discount); }, [used, discount, onPointsChange]);
  useEffect(() => { onQuoteStateChange?.(quote.status); }, [quote.status, onQuoteStateChange]);

  if (!account || account.userId !== userId) return <p className="text-sm text-gray-500">Đang tải thông tin điểm…</p>;
  if (account.error) return <p role="alert" className="text-sm text-red-600">Không tải được thông tin điểm. Vui lòng thử lại.</p>;
  if (!account.data || account.data.availablePoints <= 0) return <p className="text-sm text-blue-700">Bạn hiện chưa có điểm khả dụng.</p>;
  const available = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.trunc(account.data.availablePoints)));

  return <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
    <button type="button" onClick={() => setExpanded(value => !value)} className="w-full text-left font-semibold text-gray-800">
      🎁 Sử dụng điểm giảm giá — {available.toLocaleString("vi-VN")} điểm khả dụng
    </button>
    {expanded && <div className="mt-4 border-t pt-4 space-y-3">
      {(account.data.reservedPoints ?? 0) > 0 && <p className="text-sm text-gray-500">
        Đang giữ cho đặt phòng khác: {account.data.reservedPoints?.toLocaleString("vi-VN")} điểm
      </p>}
      <label className="block text-sm font-medium" htmlFor="loyalty-points">Số điểm muốn sử dụng</label>
      <div className="flex gap-2">
        <input id="loyalty-points" type="number" min={0} max={available} step={1} value={pointsToUse}
          onChange={event => {
            const value = Number(event.target.value);
            setPointsToUse(Number.isFinite(value) ? Math.min(available, Math.max(0, Math.trunc(value))) : 0);
          }} className="flex-1 px-3 py-2 border rounded-lg" />
        <button type="button" onClick={() => setPointsToUse(available)} className="px-3 py-2 text-blue-700">Dùng tối đa</button>
        <button type="button" onClick={() => setPointsToUse(0)} className="px-3 py-2 text-gray-600">Không dùng điểm</button>
      </div>
      {quote.status === 'loading' && <p role="status" className="text-sm">Đang kiểm tra giảm giá điểm…</p>}
      {quote.status === 'error' && <div role="alert" className="text-sm text-red-600">
        {quote.error} <button type="button" onClick={quote.retry} className="underline">Thử lại</button>
      </div>}
      {quote.status === 'ready' && <div className="bg-green-50 rounded-lg p-3 text-sm">
        <p>Sử dụng {used.toLocaleString("vi-VN")} điểm, giảm {discount.toLocaleString("vi-VN")} VND.</p>
        <p>1 điểm = {quote.quote?.redemptionRate.toLocaleString("vi-VN")} VND theo báo giá.</p>
      </div>}
      <p className="text-xs text-gray-500">Giới hạn giảm giá và số điểm thực dùng do máy chủ xác nhận; điểm chưa được giữ chỗ.</p>
    </div>}
  </div>;
}
