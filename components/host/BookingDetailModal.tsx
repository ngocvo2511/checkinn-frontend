'use client';

import { useState } from 'react';
import { BookingResponse } from '@/lib/api/booking';
import { bookingApi } from '@/lib/api/booking';

const backdropStyle = {
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  backgroundColor: 'rgba(0, 0, 0, 0.15)'
} as const;

interface BookingDetailModalProps {
  booking: BookingResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

export default function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  onBookingUpdated,
}: BookingDetailModalProps) {
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: 'Chờ xác nhận',
      PENDING_PAYMENT: 'Chờ thanh toán',
      CONFIRMED: 'Đã xác nhận',
      CHECKED_IN: 'Đã nhận phòng',
      CHECKED_OUT: 'Đã trả phòng',
      CANCELLED: 'Đã hủy',
      NO_SHOW: 'Không xuất hiện'
    };
    return statusMap[status] || status;
  };

  const getPaymentMethodName = (method?: string) => {
    const upperMethod = method?.toUpperCase() || '';
    switch (upperMethod) {
      case 'HOTEL':
        return 'Thanh toán tại khách sạn';
      case 'VNPAY':
        return 'Thanh toán qua VNPay';
      default:
        return method || 'Không xác định';
    }
  };

  const canConfirmPayment = () => {
    return (
      booking.paymentMethod?.toUpperCase() === 'HOTEL' &&
      (booking.status === 'PENDING_PAYMENT' || booking.status === 'PENDING')
    );
  };

  const canChangeStatus = () => {
    if (!['CONFIRMED', 'CHECKED_IN'].includes(booking.status)) return false;

    if (booking.status === 'CONFIRMED') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(booking.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);

      return checkInDate <= today;
    }

    return true;
  };

  const getNextStatus = () => {
    if (booking.status === 'CONFIRMED') return 'CHECKED_IN';
    if (booking.status === 'CHECKED_IN') return 'CHECKED_OUT';
    return null;
  };

  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    setPaymentError(null);
    setSuccessMessage(null);
    try {
      await bookingApi.confirmPayment(booking.id);
      setSuccessMessage('Xác nhận thanh toán thành công!');
      setTimeout(() => {
        onBookingUpdated?.();
        onClose();
      }, 1500);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Lỗi khi xác nhận thanh toán');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleChangeStatus = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return;

    setIsChangingStatus(true);
    setStatusError(null);
    setSuccessMessage(null);
    try {
      await bookingApi.updateBookingStatus(booking.id, nextStatus);
      setSuccessMessage('Cập nhật trạng thái thành công!');
      setTimeout(() => {
        onBookingUpdated?.();
        onClose();
      }, 1500);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Lỗi khi cập nhật trạng thái');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const debtAmount = (booking.totalAmount || 0) - (booking.paidAmount || 0);
  const nextStatus = getNextStatus();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={backdropStyle}
          onClick={onClose}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#0F172A] to-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#E8E9F1] flex-shrink-0">
              <h2 className="text-lg font-bold text-white">Chi tiết đơn đặt phòng</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                aria-label="Đóng"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-6 space-y-6">
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700">
                    {successMessage}
                  </div>
                )}

                {(paymentError || statusError) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700">
                    {paymentError || statusError}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-[#8B94A4] uppercase mb-3">Thông tin đặt phòng</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#8B94A4]">Mã đặt phòng</p>
                      <p className="font-semibold text-[#0F172A]">{booking.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B94A4]">Trạng thái</p>
                      <p className="font-semibold text-[#0F172A]">{getStatusName(booking.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B94A4]">Ngày nhận phòng</p>
                      <p className="font-semibold text-[#0F172A]">{formatDate(booking.checkInDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B94A4]">Ngày trả phòng</p>
                      <p className="font-semibold text-[#0F172A]">{formatDate(booking.checkOutDate)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#8B94A4] uppercase mb-3">Thông tin khách</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#8B94A4]">Tên khách</p>
                      <p className="font-semibold text-[#0F172A]">{booking.contactName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B94A4]">Số người</p>
                      <p className="font-semibold text-[#0F172A]">
                        {booking.adults} người lớn{booking.children > 0 ? `, ${booking.children} trẻ em` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B94A4]">Email</p>
                      <p className="font-semibold text-[#0F172A]">{booking.contactEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B94A4]">Điện thoại</p>
                      <p className="font-semibold text-[#0F172A]">{booking.contactPhone}</p>
                    </div>
                  </div>
                </div>

                {booking.items && booking.items.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#8B94A4] uppercase mb-3">Phòng đã đặt</h3>
                    <div className="space-y-3">
                      {booking.items.map((item, idx) => (
                        <div key={idx} className="border border-[#E8E9F1] rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-[#0F172A]">{item.roomTypeName}</p>
                              <p className="text-xs text-[#8B94A4]">{item.quantity} phòng x {item.nights} đêm</p>
                            </div>
                            <p className="font-semibold text-[#0F172A]">{item.subtotal?.toLocaleString('vi-VN')}đ</p>
                          </div>
                          {item.guestName && (
                            <p className="text-xs text-[#8B94A4]">Tên khách: {item.guestName}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-[#8B94A4] uppercase mb-3">Thông tin thanh toán</h3>
                  <div className="bg-[#F9FBFF] rounded-lg p-4 space-y-3 border border-[#E0F2FE]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#656F81]">Phương thức</span>
                      <span className="font-semibold text-[#0F172A]">{getPaymentMethodName(booking.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#656F81]">Tổng tiền</span>
                      <span className="font-semibold text-[#0F172A]">{booking.totalAmount?.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#656F81]">Đã thanh toán</span>
                      <span className="font-semibold text-[#0F172A]">{booking.paidAmount?.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {debtAmount > 0 && (
                      <div className="flex justify-between items-center border-t border-[#E0F2FE] pt-3">
                        <span className="text-[#E85D04] font-semibold">Còn nợ</span>
                        <span className="font-bold text-[#E85D04]">{debtAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                  </div>
                </div>

                {booking.specialRequests && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#8B94A4] uppercase mb-2">Yêu cầu đặc biệt</h3>
                    <p className="text-[#0F172A] bg-[#F9FBFF] rounded-lg p-3 border border-[#E8E9F1]">
                      {booking.specialRequests}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#E8E9F1] bg-white flex-shrink-0">
              {canConfirmPayment() && (
                <button
                  onClick={handleConfirmPayment}
                  disabled={isConfirmingPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {isConfirmingPayment ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
                </button>
              )}

              {canChangeStatus() && nextStatus && (
                <button
                  onClick={handleChangeStatus}
                  disabled={isChangingStatus}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {isChangingStatus
                    ? 'Đang cập nhật...'
                    : nextStatus === 'CHECKED_IN'
                      ? 'Nhận phòng'
                      : 'Trả phòng'}
                </button>
              )}

              <button
                onClick={onClose}
                className="flex-1 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0F172A] font-semibold py-2 px-4 rounded-lg transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
