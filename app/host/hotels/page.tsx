'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import HostMenu from '@/components/host/menu/HostMenu';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

type Hotel = {
  id: string | number;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  status?: string;
  rooms?: number;
};

export default function HostHotelsPage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
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
        const response = await fetch(`${API_BASE_URL}/hotels/owner`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Không thể tải danh sách khách sạn.');
        }

        const data = await response.json();
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
    const active = hotels.filter((h) => (h.status ?? '').toLowerCase().includes('active')).length;
    return { total, active };
  }, [hotels]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <HostMenu />
          <div className="flex-1 space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                Quản lý khách sạn
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold leading-[38px]">Danh sách khách sạn</h1>
                  <p className="max-w-2xl text-sm text-white/85">
                    Xem nhanh các khách sạn bạn đang quản lý, trạng thái hoạt động và thao tác thêm mới.
                  </p>
                </div>
                
              </div>
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
                  onClick={() => router.push('/host/hotels/new')}
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
                    onClick={() => router.push('/host/hotels/new')}
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
                          {hotel.address ? `${hotel.address} · ` : ''}
                          {[hotel.city, hotel.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {hotel.status ? (
                          <span className="rounded-full bg-[#E8FFF3] px-3 py-1 text-xs font-semibold text-[#0F5132]">{hotel.status}</span>
                        ) : null}
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
