/** Unknown or timezone-less timestamps never establish a payment deadline. */
export function holdSecondsRemaining(deadline: string | null | undefined, now = Date.now()): number | null {
  if (!deadline || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(deadline)) return null;
  const timestamp = Date.parse(deadline);
  const day = Date.parse(`${deadline.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || !Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== deadline.slice(0, 10)) return null;
  return Math.max(0, Math.floor((timestamp - now) / 1000));
}

export function canStartPayment(booking: { status: string; paidAmount?: number | string | null; onsiteReservationStatus?: string | null } | null): boolean {
  if (!booking || booking.paidAmount == null || booking.onsiteReservationStatus != null) return false;
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

export function canRecordOnsiteReceipt(booking: {status:string; paymentMethod?:string; paidAmount?:number|string|null; onsiteReservationStatus?:string|null}): boolean {
  if (booking.paymentMethod?.toUpperCase() !== 'HOTEL' || booking.paidAmount == null || Number(booking.paidAmount) !== 0) return false;
  return booking.onsiteReservationStatus != null
    ? booking.onsiteReservationStatus === 'V1_CONFIRMED' && ['CONFIRMED','CHECKED_IN','CHECKED_OUT'].includes(booking.status)
    : ['PENDING','PENDING_PAYMENT'].includes(booking.status);
}
export function onsiteReservationMessage(booking: {status:string; onsiteReservationStatus?:string|null} | null): string {
  if (!booking) return 'Đang tải trạng thái đặt phòng…';
  if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') return 'Đặt phòng đã hủy hoặc được ghi nhận không đến. Vui lòng xem chi tiết đơn.';
  if (booking.onsiteReservationStatus === 'V1_CONFIRMED' && ['CONFIRMED','CHECKED_IN','CHECKED_OUT'].includes(booking.status))
    return 'Đặt phòng đã được xác nhận. Thanh toán được ghi nhận riêng khi khách sạn thực thu tiền.';
  if (booking.onsiteReservationStatus === 'V1_REVIEW_REQUIRED') return 'Chưa thể xác nhận phòng. Đơn cần được đối soát; vui lòng không tạo thanh toán mới.';
  return 'Đang xác nhận tồn phòng. Chưa thể thông báo đặt phòng thành công; vui lòng cập nhật trạng thái.';
}
