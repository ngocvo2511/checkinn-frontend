'use client';

import Header from '@/components/Header';
import AdminMenu from '@/components/admin/menu/AdminMenu';

export default function AdminPendingPage() {
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
                <h1 className="text-3xl font-semibold leading-[38px]">Hàng đợi ưu tiên</h1>
                <p className="max-w-2xl text-sm text-white/85">
                  Trang mock: hiển thị danh sách yêu cầu duyệt, SLA, và phân bổ reviewer.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-sm text-[#383E48] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              Placeholder: thêm bảng yêu cầu, bộ lọc SLA, và thao tác gán người duyệt khi backend sẵn sàng.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
