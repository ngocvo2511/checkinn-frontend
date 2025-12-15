'use client';

import Header from '@/components/Header';
import HostMenu from '@/components/host/menu/HostMenu';

const hotels = [
  { id: 1, name: 'Sea Breeze Resort', bookings: 42, status: 'Đang mở đặt phòng' },
  { id: 2, name: 'Mountain View Lodge', bookings: 18, status: 'Đang bảo trì' },
  { id: 3, name: 'City Light Hotel', bookings: 27, status: 'Đang mở đặt phòng' },
];

const metrics = [
  { label: 'Booking hôm nay', value: '26', helper: '+5 so với hôm qua' },
  { label: 'Tỉ lệ lấp đầy', value: '78%', helper: '3 khách sạn đang mở' },
  { label: 'Doanh thu tuần', value: '$12,430', helper: 'Giả lập để xem layout' },
];

export default function HostDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <HostMenu />

          <div className="flex-1 flex flex-col gap-8">
            <section className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                Chủ khách sạn
              </div>
              <div className="mt-4 space-y-2">
                <h1 className="text-3xl font-semibold leading-[38px]">Tổng quan khách sạn của bạn</h1>
                <p className="max-w-2xl text-sm text-white/85">
                  Dữ liệu đang giả lập để bạn duyệt layout: booking, trạng thái khách sạn và liên kết xem chi tiết.
                </p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex flex-col gap-2 rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">{metric.label}</p>
                  <div className="text-2xl font-semibold text-[#1F2226]">{metric.value}</div>
                  <p className="text-sm text-[#656F81]">{metric.helper}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Khách sạn</p>
                  <h2 className="text-xl font-semibold text-[#1F2226]">Danh sách bạn quản lí</h2>
                </div>
                <a className="text-sm font-semibold text-[#0057FF]" href="/host/hotels">
                  Xem tất cả
                </a>
              </div>
              <div className="divide-y divide-[#E8E9F1]">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-[#1F2226]">{hotel.name}</p>
                      <p className="text-sm text-[#656F81]">Booking: {hotel.bookings}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          hotel.status.includes('bảo trì')
                            ? 'bg-[#FFF4E5] text-[#B45309]'
                            : 'bg-[#E8FFF3] text-[#0F5132]'
                        }`}
                      >
                        {hotel.status}
                      </span>
                      <a
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0057FF] hover:gap-3 transition"
                        href={`/host/hotels/${hotel.id}`}
                      >
                        Xem chi tiết
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
