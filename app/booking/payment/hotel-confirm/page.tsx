"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HotelPaymentConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get("bookingId") || "--";
  const statusBadge = "bg-blue-100 text-blue-700"; // Đồng bộ với VNPay success

  return (
    <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header user={null} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />
      <main className="flex-1 bg-[#F8FAFC]">
        <div className="mx-auto max-w-xl px-4 py-12">
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 border-blue-400 bg-blue-50`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold mb-2">Xác nhận thanh toán tại khách sạn</h1>
                <p className="text-sm">Đơn đặt phòng của bạn đã được xác nhận. Bạn sẽ thanh toán trực tiếp tại khách sạn khi nhận phòng.</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge}`}>Thành công</span>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Mã đặt phòng</span>
                <span className="font-semibold text-[#0F172A]">{bookingId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Phương thức</span>
                <span className="font-semibold text-[#0F172A]">Thanh toán tại khách sạn</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Trạng thái</span>
                <span className="font-semibold text-[#0F172A]">Chờ thanh toán tại khách sạn</span>
              </div>
              <div className="text-sm text-[#4B5563]">
                Vui lòng mang theo giấy tờ tùy thân và phương thức thanh toán phù hợp khi nhận phòng.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-white text-sm font-semibold hover:bg-[#1D4ED8]"
              >
                Về trang chủ
              </button>
              {bookingId && (
                <button
                  onClick={() => router.push(`/booking/${bookingId}`)}
                  className="rounded-lg border border-[#2563EB] px-4 py-2 text-sm font-semibold text-[#1D4ED8] bg-[#EEF2FF] hover:bg-[#E0E7FF]"
                >
                  Xem đơn của tôi
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
