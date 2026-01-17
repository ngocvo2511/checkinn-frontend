'use client';

import { useState } from 'react';
import { BookingResponse, bookingApi } from '@/lib/api/booking';

interface BookingPaymentConfirmProps {
  booking: BookingResponse;
  onConfirmed: () => void;
}

export default function BookingPaymentConfirm({ booking, onConfirmed }: BookingPaymentConfirmProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if booking can be paid (HOTEL payment method and PENDING/PENDING_PAYMENT status)
  const canConfirmPayment = () => {
    const status = booking.status?.toUpperCase() || '';
    const isAwaitingPayment = status === 'PENDING' || status === 'PENDING_PAYMENT';
    const isHotelPayment = booking.paymentMethod?.toUpperCase() === 'HOTEL';
    const unpaidAmount = (booking.totalAmount || 0) - (booking.paidAmount || 0);
    
    return isAwaitingPayment && isHotelPayment && unpaidAmount > 0;
  };

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await bookingApi.confirmPayment(booking.id);
      setSuccess(true);
      setTimeout(() => {
        onConfirmed();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Không thể xác nhận thanh toán');
      console.error('Error confirming payment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canConfirmPayment()) {
    return null;
  }

  const unpaidAmount = (booking.totalAmount || 0) - (booking.paidAmount || 0);

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#FEF3C7] p-3 sm:p-4">
      {success ? (
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-[#16A34A]">Xác nhận thanh toán thành công!</span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-800">{error}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#92400E] mb-1">Chưa có thanh toán</p>
            <p className="text-sm font-semibold text-[#92400E]">
              Còn nợ: {unpaidAmount.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <button
            onClick={handleConfirmPayment}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Xác nhận thanh toán
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
