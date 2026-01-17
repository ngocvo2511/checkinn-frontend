'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import HostMenu from '@/components/host/menu/HostMenu';
import BookingsList from '@/components/host/BookingsList';
import { bookingApi, BookingResponse } from '@/lib/api/booking';
import { hotelApi, Hotel as ApiHotel } from '@/lib/api/hotels';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function HostBookingsPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated, hasAccess } = useProtectedRoute('OWNER');

  const [hotels, setHotels] = useState<ApiHotel[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or no access
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push('/host');
        return;
      }
      if (!hasAccess) {
        router.push('/');
        return;
      }
    }
  }, [isAuthLoading, isAuthenticated, hasAccess, router]);

  // Fetch hotels
  useEffect(() => {
    if (isAuthLoading || !hasAccess) return;

    const fetchHotels = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập để xem danh sách đặt phòng.');
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const data = await hotelApi.getHotelsByOwner(token);
        const hotelList = Array.isArray(data) ? data : [];
        setHotels(hotelList);

        // Set default hotel
        if (hotelList.length > 0) {
          setSelectedHotelId(hotelList[0].id);
        }
      } catch (err: any) {
        console.error('Failed to fetch hotels:', err);
        setError(err.message || 'Không thể tải danh sách khách sạn.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, [isAuthLoading, hasAccess]);

  // Fetch bookings when hotel changes
  useEffect(() => {
    if (!selectedHotelId) return;

    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const data = await bookingApi.getHotelBookings(selectedHotelId);
        setBookings(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to fetch bookings:', err);
        setError(err.message || 'Không thể tải danh sách booking.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [selectedHotelId]);

  const handleBookingUpdated = () => {
    // Reload bookings when payment confirmed
    if (selectedHotelId) {
      const fetchBookings = async () => {
        try {
          const data = await bookingApi.getHotelBookings(selectedHotelId);
          setBookings(Array.isArray(data) ? data : []);
        } catch (err: any) {
          console.error('Failed to fetch bookings:', err);
        }
      };
      fetchBookings();
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status?.toUpperCase() === 'CONFIRMED').length,
      pending: bookings.filter(b => b.status?.toUpperCase() === 'PENDING').length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };
  }, [bookings]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#656F81]">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // Don't render if no access or not authenticated
  if (!isAuthenticated || !hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <HostMenu />
      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
                Quản lý đặt phòng
              </div>
              <h1 className="mt-2 text-2xl font-semibold">Danh sách đặt phòng</h1>
            </div>

            {/* Hotel Selector */}
            {hotels.length > 0 && (
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4] block mb-2">
                  Chọn khách sạn
                </label>
                <select
                  value={selectedHotelId}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  className="w-full sm:w-80 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] transition focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]"
                >
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Statistics */}
            {bookings.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">
                    Tổng đơn đặt phòng
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#1F2226]">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0369A1]">
                    Đã xác nhận
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#0369A1]">{stats.confirmed}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#92400E]">
                    Chờ xử lý
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#92400E]">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">
                    Tổng doanh thu
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#1F2226]">
                    {stats.totalRevenue.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Bookings List */}
            {hotels.length === 0 ? (
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-8 text-center shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <svg
                  className="mx-auto mb-4 h-12 w-12 text-[#D1D5DB]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-base font-semibold text-[#1F2226]">Chưa có khách sạn nào</p>
                <p className="text-sm text-[#656F81]">
                  Hãy tạo khách sạn trước để quản lý booking.
                </p>
                <button
                  onClick={() => router.push('/host/hotels/newHotel')}
                  className="mt-4 rounded-lg bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0046CC]"
                >
                  Tạo khách sạn
                </button>
              </div>
            ) : (
              <BookingsList bookings={bookings} isLoading={isLoading} onBookingUpdated={handleBookingUpdated} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
