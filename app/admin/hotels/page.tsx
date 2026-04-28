'use client';

import AdminMenu from '@/components/admin/menu/AdminMenu';

export default function AdminHotelsPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />

      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
                CheckInn Admin
              </div>
              <h1 className="mt-2 text-2xl font-semibold">Duyệt & chỉnh sửa listing</h1>
            </div>

            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-sm text-[#383E48] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              Nội dung trang này đang là placeholder. Khi có API, danh sách khách sạn cần duyệt sẽ hiển thị tại đây.
            </div>
        </div>
      </main>
    </div>
  );
}
