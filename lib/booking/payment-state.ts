export function canStartPayment(booking: { status: string; paidAmount?: number | string | null } | null): boolean {
  if (!booking || booking.paidAmount == null) return false;
  const paid = Number(booking.paidAmount);
  return ['PENDING', 'PENDING_PAYMENT'].includes(booking.status) && Number.isFinite(paid) && paid === 0;
}

export function paymentOutcome(paymentStatus: string, bookingStatus?: string): {
  status: 'pending' | 'success' | 'failed'; message: string;
} {
  if (paymentStatus === 'COMPLETED') {
    if (['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(bookingStatus ?? '')) {
      return { status: 'success', message: 'Thanh toán VNPay thành công. Đơn đặt phòng đã được xác nhận.' };
    }
    return { status: 'pending', message: bookingStatus === 'CANCELLED'
      ? 'Đã ghi nhận thanh toán cho booking đã hủy. Vui lòng theo dõi yêu cầu hoàn tiền hoặc liên hệ hỗ trợ.'
      : 'Đã ghi nhận thanh toán nhưng đặt phòng chưa được xác nhận. Vui lòng chờ đối soát hoặc liên hệ hỗ trợ; không thanh toán lại.' };
  }
  if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
    return { status: 'failed', message: 'Giao dịch không thành công hoặc đã bị hủy.' };
  }
  return { status: 'pending', message: 'Chưa có kết quả xác nhận thanh toán cuối cùng. Vui lòng kiểm tra trạng thái booking.' };
}
