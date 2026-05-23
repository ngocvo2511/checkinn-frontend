'use client';

import { useState, useMemo } from 'react';
import { BookingResponse } from '@/lib/api/booking';
import BookingDetailModal from './BookingDetailModal';

interface BookingsListProps {
  bookings: BookingResponse[];
  isLoading: boolean;
  onBookingUpdated?: () => void;
}

export default function BookingsList({ bookings, isLoading, onBookingUpdated }: BookingsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const mapStatusForDisplay = (status: string) => {
    const upperStatus = status?.toUpperCase() || '';
    if (upperStatus === 'PENDING' || upperStatus === 'PENDING_PAYMENT') {
      return 'AWAITING_PAYMENT';
    }
    return upperStatus;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      if (filterStatus !== 'ALL') {
        const displayStatus = mapStatusForDisplay(booking.status);
        if (displayStatus !== filterStatus) {
          return false;
        }
      }

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        booking.id.toLowerCase().includes(query) ||
        booking.contactEmail.toLowerCase().includes(query) ||
        booking.contactName.toLowerCase().includes(query) ||
        booking.contactPhone.includes(query);

      return matchesSearch;
    });
  }, [bookings, searchQuery, filterStatus]);

  const getStatusBadge = (status: string) => {
    const displayStatus = mapStatusForDisplay(status);
    switch (displayStatus) {
      case 'CONFIRMED':
        return 'bg-[#E0F2FE] text-[#0369A1]';
      case 'AWAITING_PAYMENT':
        return 'bg-[#FEF3C7] text-[#92400E]';
      case 'CHECKED_IN':
        return 'bg-[#F0FDF4] text-[#16A34A]';
      case 'CHECKED_OUT':
        return 'bg-[#DCFCE7] text-[#15803D]';
      case 'CANCELLED':
        return 'bg-[#FEE2E2] text-[#991B1B]';
      case 'NO_SHOW':
        return 'bg-[#FFE4E6] text-[#9F1239]';
      default:
        return 'bg-[#F3F4F6] text-[#1F2937]';
    }
  };

  const getStatusName = (status: string, paymentMethod?: string) => {
    const displayStatus = mapStatusForDisplay(status);
    let statusName = '';
    switch (displayStatus) {
      case 'CONFIRMED':
        statusName = 'Đã xác nhận';
        break;
      case 'AWAITING_PAYMENT':
        statusName = 'Chờ thanh toán';
        if (paymentMethod?.toUpperCase() === 'HOTEL') {
          statusName += ' (tại khách sạn)';
        } else if (paymentMethod?.toUpperCase() === 'VNPAY') {
          statusName += ' (VNPay)';
        }
        break;
      case 'CHECKED_IN':
        statusName = 'Đã nhận phòng';
        break;
      case 'CHECKED_OUT':
        statusName = 'Đã trả phòng';
        break;
      case 'CANCELLED':
        statusName = 'Đã hủy';
        break;
      case 'NO_SHOW':
        statusName = 'Không xuất hiện';
        break;
      default:
        statusName = status || 'Không xác định';
    }
    return statusName;
  };

  const allStatuses = ['ALL', 'AWAITING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E8E9F1] bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <svg
                className="absolute left-3 top-3 h-5 w-5 text-[#9CA3AF]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm theo mã đặt phòng, email, tên hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-10 pr-3 text-sm text-[#374151] placeholder-[#9CA3AF] transition focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#374151] transition focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF] cursor-pointer whitespace-nowrap"
          >
            {allStatuses.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Tất cả trạng thái' : getStatusName(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8E9F1] bg-white shadow-[0_14px_30px_rgba(0,0,0,0.08)] overflow-hidden">
        {isLoading ? (
          <div className="py-10 text-center text-[#656F81]">Đang tải danh sách đơn đặt phòng...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <svg
              className="h-12 w-12 text-[#D1D5DB]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="text-base font-semibold text-[#1F2226]">Không có đơn đặt phòng nào</p>
              <p className="text-sm text-[#656F81]">
                {searchQuery || filterStatus !== 'ALL'
                  ? 'Không tìm thấy đơn đặt phòng phù hợp với tiêu chí tìm kiếm'
                  : 'Hiện tại chưa có đơn đặt phòng nào'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-scroll" style={{ height: 'calc(100vh - 350px)', maxHeight: '600px' }}>
            <table className="w-full text-left text-sm text-[#1F2226] table-fixed">
              <thead className="bg-[#F7F8FA] text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4] border-b border-[#E8E9F1]">
                <tr>
                  <th className="px-6 py-4">Mã đặt phòng</th>
                  <th className="px-6 py-4">Khách</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Nhận phòng</th>
                  <th className="px-6 py-4">Trả phòng</th>
                  <th className="px-6 py-4">Tổng tiền</th>
                  <th className="px-6 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E9F1]">
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition hover:bg-[#F9FBFF] cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[#0F172A]">{booking.id}</span>
                        <span className="text-xs text-[#8B94A4]">
                          {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-[#0F172A]">{booking.contactName}</p>
                        <p className="text-xs text-[#8B94A4]">
                          {booking.adults} người lớn
                          {booking.children > 0 && `, ${booking.children} trẻ em`}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{booking.contactEmail}</span>
                        <span className="text-xs text-[#8B94A4]">{booking.contactPhone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{formatDate(booking.checkInDate)}</span>
                        <span className="text-xs text-[#8B94A4]">
                          {booking.items.length} phòng
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{formatDate(booking.checkOutDate)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#0F172A]">{booking.totalAmount?.toLocaleString('vi-VN')}đ</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                          booking.status
                        )}`}
                      >
                        {getStatusName(booking.status, booking.paymentMethod)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredBookings.length > 0 && (
          <div className="border-t border-[#E8E9F1] bg-[#F7F8FA] px-6 py-3">
            <p className="text-xs font-semibold text-[#8B94A4]">
              Hiển thị {filteredBookings.length} trong {bookings.length} đơn đặt phòng
            </p>
          </div>
        )}
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookingUpdated={() => {
          setIsModalOpen(false);
          onBookingUpdated?.();
        }}
      />
    </div>
  );
}
