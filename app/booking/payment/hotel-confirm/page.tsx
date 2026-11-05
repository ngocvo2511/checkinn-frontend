"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { bookingApi, type BookingResponse } from "@/lib/api/booking";
import { onsiteReservationMessage } from "@/lib/booking/payment-state";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HotelPaymentConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get("bookingId") || "--";
  const statusBadge = "bg-blue-100 text-blue-700"; // Đồng bộ với VNPay success
  const [result, setResult] = useState<{ id: string; booking: BookingResponse | null; error: string | null } | null>(null);
  const booking = result?.id === bookingId ? result.booking : null;
  const error = result?.id === bookingId ? result.error : null;
  const generation = useRef({ value: 0 });
  const refresh = useCallback(() => {
    const request = ++generation.current.value;
    return bookingApi.getBooking(bookingId).then(
      latest => {
        if (request === generation.current.value) setResult({ id: bookingId, booking: latest, error: null });
      },
      () => {
        if (request === generation.current.value) setResult({ id: bookingId, booking: null, error: "Không thể tải trạng thái đặt phòng. Vui lòng thử lại." });
      },
    );
  }, [bookingId]);
  useEffect(() => {
    const requests = generation.current;
    void refresh();
    return () => { requests.value++; };
  }, [refresh]);
  useEffect(() => {
    if (booking?.onsiteReservationStatus !== 'V1_PENDING') return;
    const timer = setInterval(() => { void refresh(); }, 3000);
    return () => clearInterval(timer);
  }, [booking?.onsiteReservationStatus, refresh]);
  const confirmed = !error && booking?.onsiteReservationStatus === 'V1_CONFIRMED' && ['CONFIRMED','CHECKED_IN','CHECKED_OUT'].includes(booking.status);

  return (
    <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[#F8FAFC]">
        <div className="mx-auto max-w-xl px-4 py-12">
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 border-blue-400 bg-blue-50`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold mb-2">Đặt phòng · thanh toán tại khách sạn</h1>
                <p className="text-sm" role="status">{error || onsiteReservationMessage(booking)}</p>
                <button type="button" className="underline" onClick={() => void refresh()}>Cập nhật trạng thái</button>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge}`}>{confirmed ? 'Đã xác nhận phòng' : 'Chưa xác nhận phòng'}</span>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Mã đặt phòng</span>
                <span className="font-semibold text-[#0F172A]">{bookingId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Phương thức</span>
                <span className="font-semibold text-[#0F172A]">{!error && booking?.paymentMethod === 'HOTEL' ? 'Thanh toán tại khách sạn' : 'Chưa xác minh phương thức'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Trạng thái</span>
                <span className="font-semibold text-[#0F172A]">{error || booking?.paidAmount == null ? 'Chưa xác minh số tiền đã thu' : Number(booking.paidAmount) > 0 ? 'Đã ghi nhận thu tiền' : 'Chưa ghi nhận thu tiền'}</span>
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
