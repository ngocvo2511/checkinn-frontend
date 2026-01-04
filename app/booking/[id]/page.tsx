"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { bookingApi, type BookingResponse } from "@/lib/api/booking";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CHECKED_OUT: "bg-slate-200 text-slate-800",
  CANCELLED: "bg-rose-100 text-rose-700",
  NO_SHOW: "bg-gray-200 text-gray-700",
};

function formatDate(value?: string | Date) {
  if (!value) return "--";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(amount?: number | null) {
  if (amount === null || amount === undefined) return "--";
  return amount.toLocaleString("vi-VN") + " VND";
}

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    bookingApi
      .getBooking(id)
      .then((data) => setBooking(data))
      .catch((err: any) => setError(err?.message || "Không lấy được thông tin đặt phòng"))
      .finally(() => setLoading(false));
  }, [id]);

  const firstItem = useMemo(() => booking?.items?.[0], [booking]);
  const badge = statusColor[booking?.status || ""] || "bg-gray-100 text-gray-700";

  return (
    <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[#F8FAFC] py-10">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#6B7280]">Chi tiết đặt phòng</p>
              <h1 className="text-2xl font-semibold text-[#0F172A]">Mã đơn: {booking?.id || id}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/booking/history")}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2563EB] font-semibold hover:bg-[#F3F4F6]"
              >
                Về lịch sử
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2563EB] font-semibold hover:bg-[#F3F4F6]"
              >
                Trang chủ
              </button>
            </div>
          </div>

          {loading && <p className="text-sm text-[#6B7280]">Đang tải...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && booking && (
            <div className="space-y-6">
              {/* Status + Hotel */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>{booking.status}</span>
                  <span className="text-xs text-[#6B7280]">Tạo lúc: {formatDate(booking.createdAt as any)}</span>
                </div>
                <h2 className="text-lg font-semibold text-[#0F172A]">{booking.hotelName}</h2>
                <p className="text-sm text-[#4B5563]">{firstItem?.roomTypeName || "--"}</p>
              </div>

              {/* Dates/guests */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                  <p className="text-sm font-semibold text-[#0F172A]">Thời gian lưu trú</p>
                  <div className="mt-2 text-sm text-[#4B5563] flex flex-wrap gap-2">
                    <span>Nhận phòng: {formatDate(booking.checkInDate as any)}</span>
                    <span>·</span>
                    <span>Trả phòng: {formatDate(booking.checkOutDate as any)}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                  <p className="text-sm font-semibold text-[#0F172A]">Khách và phòng</p>
                  <div className="mt-2 text-sm text-[#4B5563] flex flex-wrap gap-2">
                    <span>Khách: {booking.adults} người lớn, {booking.children} trẻ em</span>
                    <span>·</span>
                    <span>Số phòng: {firstItem?.quantity ?? 1}</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <p className="text-sm font-semibold text-[#0F172A]">Liên hệ</p>
                <div className="mt-2 text-sm text-[#4B5563] grid gap-1">
                  <span>Họ tên: {booking.contactName}</span>
                  <span>Điện thoại: {booking.contactPhone}</span>
                  <span>Email: {booking.contactEmail}</span>
                  <span>Yêu cầu: {booking.specialRequests || "Không"}</span>
                </div>
              </div>

              {/* Amounts */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <p className="text-sm font-semibold text-[#0F172A]">Thanh toán</p>
                <div className="mt-2 text-sm text-[#4B5563] grid gap-1">
                  <span>Tổng tiền: {formatCurrency(Number(booking.totalAmount))}</span>
                  <span>Đã thanh toán: {formatCurrency(Number(booking.paidAmount))}</span>
                  {booking.voucherCode && (
                    <span>Mã giảm giá: {booking.voucherCode}</span>
                  )}
                </div>
                {(booking.status === "PENDING" || booking.status === "PENDING_PAYMENT") && (
                  <button
                    onClick={() => router.push(`/booking/payment?bookingId=${booking.id}`)}
                    className="mt-3 rounded-lg bg-[#2563EB] px-4 py-2 text-white text-sm font-semibold hover:bg-[#1D4ED8]"
                  >
                    Thanh toán
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
