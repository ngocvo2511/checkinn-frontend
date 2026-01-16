"use client";

interface BookingSummaryPointsProps {
  pointsUsed: number;
  discountAmount: number;
  totalAmountBefore: number;
  totalAmountAfter: number;
}

export default function BookingSummaryPoints({
  pointsUsed,
  discountAmount,
  totalAmountBefore,
  totalAmountAfter,
}: BookingSummaryPointsProps) {
  if (pointsUsed === 0) {
    return null;
  }

  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-4">
      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
        🎁 Tóm Tắt Sử Dụng Điểm
      </h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700">Điểm sử dụng:</span>
          <span className="font-semibold text-gray-800">{pointsUsed.toLocaleString("vi-VN")} điểm</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-700">Giảm giá:</span>
          <span className="font-semibold text-green-600">
            -{discountAmount.toLocaleString("vi-VN")} VND
          </span>
        </div>
        
        <div className="border-t border-green-200 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-gray-700">Tổng tiền (trước):</span>
            <span className="line-through text-gray-500">
              {totalAmountBefore.toLocaleString("vi-VN")} VND
            </span>
          </div>
          
          <div className="flex justify-between mt-2">
            <span className="font-semibold text-gray-800">Tổng tiền (sau):</span>
            <span className="font-bold text-green-600 text-lg">
              {totalAmountAfter.toLocaleString("vi-VN")} VND
            </span>
          </div>
        </div>

        <div className="bg-green-100 text-green-800 p-2 rounded text-xs mt-3">
          ✓ Bạn đã tiết kiệm {((discountAmount / totalAmountBefore) * 100).toFixed(1)}% giá trị đơn hàng
        </div>
      </div>
    </div>
  );
}
