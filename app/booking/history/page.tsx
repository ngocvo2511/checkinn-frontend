"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { bookingApi, type BookingResponse } from "@/lib/api/booking";
import { type AuthResponse } from "@/lib/api/auth";

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

export default function BookingHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthResponse;
      setUser(parsed);
    } catch (err) {
      console.error("Failed to parse user", err);
    }
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    bookingApi
      .getUserBookings(String(user.userId))
      .then((data) => setBookings(data))
      .catch((err: any) => setError(err?.message || "Không lấy được lịch sử đặt phòng"))
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  }, [bookings]);

  return (
    <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header user={null} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />
      <main className="flex-1 bg-[#F8FAFC] py-10">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#6B7280]">Lịch sử đặt phòng</p>
              <h1 className="text-2xl font-semibold text-[#0F172A]">Các đặt phòng của bạn</h1>
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2563EB] font-semibold hover:bg-[#F3F4F6]"
            >
              Về trang chủ
            </button>
          </div>

          {!user && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <p className="text-sm text-[#4B5563]">Bạn cần đăng nhập để xem lịch sử đặt phòng.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-3 rounded-lg bg-[#2563EB] px-4 py-2 text-white text-sm font-semibold hover:bg-[#1D4ED8]"
              >
                Đăng nhập
              </button>
            </div>
          )}

          {user && (
            <div className="space-y-4">
              {loading && <p className="text-sm text-[#6B7280]">Đang tải...</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!loading && !error && sorted.length === 0 && (
                <p className="text-sm text-[#6B7280]">Bạn chưa có đặt phòng nào.</p>
              )}

              {sorted.map((booking) => {
                const badge = statusColor[booking.status] || "bg-gray-100 text-gray-700";
                const firstItem = booking.items?.[0];
                return (
                  <div key={booking.id} className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>{booking.status}</span>
                        <span className="text-xs text-[#6B7280]">Mã đơn: {booking.id}</span>
                      </div>
                      <div className="text-sm text-[#0F172A] font-semibold">{booking.hotelName}</div>
                      <div className="text-sm text-[#4B5563]">{firstItem?.roomTypeName || "--"}</div>
                      <div className="text-sm text-[#4B5563] flex flex-wrap gap-2">
                        <span>Nhận phòng: {formatDate(booking.checkInDate as any)}</span>
                        <span>·</span>
                        <span>Trả phòng: {formatDate(booking.checkOutDate as any)}</span>
                        <span>·</span>
                        <span>Khách: {booking.adults} người lớn, {booking.children} trẻ em</span>
                      </div>
                      <div className="text-sm text-[#4B5563]">Tạo lúc: {formatDate(booking.createdAt as any)}</div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2">
                      <div className="text-base font-semibold text-[#0F172A]">Tổng: {formatCurrency(Number(booking.totalAmount))}</div>
                      <div className="text-sm text-[#6B7280]">Đã thanh toán: {formatCurrency(Number(booking.paidAmount))}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/booking/${booking.id}`)}
                          className="rounded-lg border border-[#2563EB] px-3 py-2 text-sm font-semibold text-[#1D4ED8] bg-[#EEF2FF] hover:bg-[#E0E7FF]"
                        >
                          Xem chi tiết
                        </button>
                        {booking.status === "PENDING" || booking.status === "PENDING_PAYMENT" ? (
                          <button
                            onClick={() => router.push(`/booking/payment?bookingId=${booking.id}`)}
                            className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                          >
                            Thanh toán
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
