"use client";

import { useState, useEffect } from "react";

interface LoyaltyPointsData {
  totalPoints: number;
  usedPoints: number;
  availablePoints: number;
}

interface PointsDiscountProps {
  userId: string;
  totalAmount: number;
  onPointsChange: (usedPoints: number, discountAmount: number) => void;
  maxDiscount?: number;
}

export default function PointsDiscountSection({
  userId,
  totalAmount,
  onPointsChange,
  maxDiscount = totalAmount * 0.5, // Mặc định 50% tổng tiền
}: PointsDiscountProps) {
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPointsData | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Tỷ lệ quy đổi: 500 VND = 1 điểm (1 điểm = 500 VND)
  const POINTS_TO_VND = 500;

  // Fetch thông tin điểm của user
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchLoyaltyPoints();
  }, [userId]);

  const fetchLoyaltyPoints = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loyalty-points/${userId}`);
      if (!response.ok) {
        throw new Error("Không thể lấy điểm tích lũy");
      }
      const data = await response.json();
      setLoyaltyPoints(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching loyalty points:", err);
      setError("Không thể tải thông tin điểm");
      setLoyaltyPoints(null);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán discount khi số điểm thay đổi
  useEffect(() => {
    if (pointsToUse <= 0) {
      setDiscountAmount(0);
      onPointsChange(0, 0);
      return;
    }

    // Tính tiền được giảm: điểm × 500 VND
    let calculatedDiscount = pointsToUse * POINTS_TO_VND;

    // Kiểm tra giới hạn 50% tổng tiền
    if (calculatedDiscount > maxDiscount) {
      calculatedDiscount = maxDiscount;
    }

    setDiscountAmount(calculatedDiscount);
    onPointsChange(pointsToUse, calculatedDiscount);
  }, [pointsToUse, totalAmount, maxDiscount, onPointsChange]);

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;

    // Validate không được vượt quá điểm khả dụng
    if (value > (loyaltyPoints?.availablePoints || 0)) {
      setError(`Bạn chỉ có ${loyaltyPoints?.availablePoints || 0} điểm khả dụng`);
      return;
    }

    // Validate không được vượt quá giới hạn discount 50%
    const maxPoints = Math.floor(maxDiscount / POINTS_TO_VND);
    if (value > maxPoints) {
      setError(`Tối đa có thể dùng ${maxPoints} điểm (${(maxPoints * POINTS_TO_VND).toLocaleString("vi-VN")} VND)`);
      return;
    }

    setPointsToUse(value);
    setError(null);
  };

  const handleUseMaxPoints = () => {
    if (!loyaltyPoints) return;

    // Tính số điểm tối đa có thể dùng
    const maxPointsByDiscount = Math.floor(maxDiscount / POINTS_TO_VND);
    const maxPointsAvailable = loyaltyPoints.availablePoints;
    const maxPoints = Math.min(maxPointsByDiscount, maxPointsAvailable);

    setPointsToUse(maxPoints);
    setError(null);
  };

  const handleClearPoints = () => {
    setPointsToUse(0);
    setDiscountAmount(0);
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-500 text-sm">Đang tải thông tin điểm...</p>
      </div>
    );
  }

  if (!loyaltyPoints || loyaltyPoints.availablePoints === 0) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-blue-700 text-sm">
          {loyaltyPoints ? "Bạn hiện chưa có điểm khả dụng" : "Bạn chưa có tài khoản điểm"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
      >
        <div className="text-left">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            🎁 Sử Dụng Điểm Giảm Giá
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Điểm khả dụng: <span className="font-semibold text-blue-600">{loyaltyPoints.availablePoints.toLocaleString("vi-VN")}</span> điểm
          </p>
        </div>
        <span className="text-2xl">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="mt-4 border-t pt-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Thông tin điểm */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-gray-600">Tổng Điểm</p>
              <p className="text-lg font-bold text-blue-600">{loyaltyPoints.totalPoints.toLocaleString("vi-VN")}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <p className="text-xs text-gray-600">Đã Dùng</p>
              <p className="text-lg font-bold text-orange-600">{loyaltyPoints.usedPoints.toLocaleString("vi-VN")}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-xs text-gray-600">Khả Dụng</p>
              <p className="text-lg font-bold text-green-600">{loyaltyPoints.availablePoints.toLocaleString("vi-VN")}</p>
            </div>
          </div>

          {/* Input điểm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số Điểm Muốn Sử Dụng
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={pointsToUse}
                onChange={handlePointsChange}
                min="0"
                max={loyaltyPoints.availablePoints}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số điểm"
              />
              <button
                onClick={handleUseMaxPoints}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              >
                Dùng Tối Đa
              </button>
            </div>
          </div>

          {/* Thông tin giảm giá */}
          {pointsToUse > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Điểm sử dụng:</span>
                <span className="font-semibold text-gray-800">{pointsToUse.toLocaleString("vi-VN")} điểm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tiền được giảm:</span>
                <span className="font-bold text-green-600 text-lg">
                  -{discountAmount.toLocaleString("vi-VN")} VND
                </span>
              </div>
              {discountAmount === maxDiscount && pointsToUse * POINTS_TO_VND > maxDiscount && (
                <p className="text-xs text-amber-600 italic">
                  * Giảm giá không được vượt quá 50% tổng tiền
                </p>
              )}
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex gap-2">
            {pointsToUse > 0 && (
              <button
                onClick={handleClearPoints}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
              >
                Xóa Lựa Chọn
              </button>
            )}
            <div className="flex-1 bg-blue-100 text-blue-700 p-2 rounded-lg text-center text-sm">
              <p className="font-semibold">Tỷ Lệ Quy Đổi: 1 Điểm = 500 VND</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
