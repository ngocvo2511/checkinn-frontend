'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HostMenu from '@/components/host/menu/HostMenu';
import { Hotel as ApiHotel, hotelApi } from '@/lib/api/hotels';

export default function HostHotelsPage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<ApiHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vui lòng đăng nhập để xem danh sách khách sạn.');
      setLoading(false);
      return;
    }

    const fetchHotels = async () => {
      try {
        const data = await hotelApi.getHotelsByOwner(token);
        setHotels(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách khách sạn.');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const stats = useMemo(() => {
    const total = hotels.length;
    const active = hotels.filter((h) => h.isActive).length;
    return { total, active };
  }, [hotels]);

  const formatAddress = (address?: ApiHotel['address']) => {
    if (!address) return '';
    return [address.street, address.city, address.country].filter(Boolean).join(', ');
  };

  const formatStatus = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Đã duyệt';
      case 'PENDING':
        return 'Chờ duyệt';
      case 'REJECTED':
        return 'Từ chối';
      default:
        return status ?? 'Không xác định';
    }
  };

  const statusBadgeClass = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-[#E8FFF3] text-[#0F5132]';
      case 'PENDING':
        return 'bg-[#FFF8E1] text-[#8B6E00]';
      case 'REJECTED':
        return 'bg-[#FFE8E6] text-[#9C1F23]';
      default:
        return 'bg-[#E8E9F1] text-[#383E48]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <HostMenu />
      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl">
          <div className="space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
                Quản lý khách sạn
              </div>
              <h1 className="mt-2 text-2xl font-semibold">Danh sách khách sạn</h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Tổng số khách sạn</p>
                <p className="mt-2 text-2xl font-semibold text-[#1F2226]">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Đang hoạt động</p>
                <p className="mt-2 text-2xl font-semibold text-[#1F2226]">{stats.active}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-sm text-[#383E48] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Khách sạn</p>
                  <h2 className="text-xl font-semibold text-[#1F2226]">Danh sách quản lý</h2>
                </div>
                <button
                  onClick={() => router.push('/host/hotels/newHotel')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#0057FF] px-3 py-2 text-sm font-semibold text-[#0057FF] transition hover:bg-[#0057FF] hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Thêm mới
                </button>
              </div>

              {loading ? (
                <div className="py-10 text-center text-[#656F81]">Đang tải danh sách...</div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : hotels.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-base font-semibold text-[#1F2226]">Chưa có khách sạn nào</p>
                  <p className="text-sm text-[#656F81]">Hãy thêm khách sạn mới để bắt đầu quản lý.</p>
                  <button
                    onClick={() => router.push('/host/hotels/newHotel')}
                    className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC]"
                  >
                    Thêm khách sạn
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#E8E9F1]">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-[#1F2226]">{hotel.name}</p>
                        <p className="text-sm text-[#656F81]">
                          {formatAddress(hotel.address)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(hotel.approvedStatus)}`}
                        >
                          {formatStatus(hotel.approvedStatus)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${hotel.isActive ? 'bg-[#E8FFF3] text-[#0F5132]' : 'bg-[#FFE8E6] text-[#9C1F23]'}`}
                        >
                          {hotel.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                        <button
                          onClick={() => router.push(`/host/hotels/${hotel.id}`)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0057FF] hover:gap-3 transition"
                        >
                          Xem chi tiết
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
