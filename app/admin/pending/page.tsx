'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import AdminStatCard from '@/components/AdminStatCard';
import { hotelApi, Hotel } from '@/lib/api/hotels';

const metrics = [
  {
    label: 'Khách sạn chờ duyệt',
    value: '0', // Will be updated dynamically
    helper: 'Cần xử lý trong 24h',
    trendLabel: 'Ưu tiên cao',
    trendPositive: false,
    icon: PendingIcon(),
  },
];

export default function AdminPendingPage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricsState, setMetricsState] = useState(metrics);

  useEffect(() => {
    fetchPendingHotels();
  }, []);

  const fetchPendingHotels = async () => {
    try {
      setLoading(true);
      const data = await hotelApi.getPendingHotels();
      setHotels(data);
      setMetricsState([
        {
          ...metrics[0],
          value: data.length.toString(),
        },
      ]);
    } catch (err) {
      setError('Failed to load pending hotels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (hotelId: string) => {
    router.push(`/admin/pending/${hotelId}`);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <AdminMenu />

          <div className="flex-1 space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                Yêu cầu chờ duyệt
              </div>
              <div className="mt-4 space-y-2">
                <h1 className="text-3xl font-semibold leading-[38px]">Khách sạn chờ duyệt</h1>
                <p className="max-w-2xl text-sm text-white/85">
                  Danh sách các khách sạn đang chờ phê duyệt từ admin.
                </p>
              </div>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metricsState.map((metric) => (
                <AdminStatCard key={metric.label} {...metric} />
              ))}
            </section>

            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-sm text-[#383E48] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              {loading && <p>Loading...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {!loading && !error && hotels.length === 0 && <p>Không có khách sạn nào chờ duyệt.</p>}
              {!loading && !error && hotels.length > 0 && (
                <div className="space-y-4">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="border border-[#E8E9F1] rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-[#0B1B3F]">{hotel.name}</h3>
                          <p className="text-gray-600 mt-1">{hotel.description}</p>
                          <p className="text-gray-600 text-sm mt-2">{hotel.address.street}, {hotel.address.city}, {hotel.address.country}</p>
                          <p className="text-xs text-gray-500 mt-2">Đăng ký: {new Date(hotel.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <button
                          onClick={() => handleViewDetail(hotel.id)}
                          className="px-4 py-2 bg-[#0B1B3F] text-white rounded-lg hover:bg-[#0E264F] transition-colors"
                        >
                          Xem chi tiết
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

function PendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 22C6.486 22 2 17.514 2 12C2 6.486 6.486 2 12 2C17.514 2 22 6.486 22 12C22 17.514 17.514 22 12 22ZM12 3.5C7.589 3.5 4 7.089 4 11.5C4 15.911 7.589 19.5 12 19.5C16.411 19.5 20 15.911 20 11.5C20 7.089 16.411 3.5 12 3.5ZM13 12V7H11V13.25L16.25 16.25L17.25 14.5L13 12Z"
        fill="currentColor"
      />
    </svg>
  );
}
