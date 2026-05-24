"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  BedDouble,
  Building2,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  Soup,
  Wifi,
  XCircle,
  Info,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { bookingApi, type BookingResponse } from "@/lib/api/booking";
import { useAuth } from "@/hooks/useAuth";

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return "Liên hệ";
  return `${value.toLocaleString("vi-VN")} VND`;
};

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const hotelName = searchParams.get("hotelName") || "";
  const roomName = searchParams.get("roomName") || "";
  const roomPrice = Number(searchParams.get("roomPrice") || 0);
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";
  const rooms = searchParams.get("rooms") || "1";
  const quantity = Number(searchParams.get("quantity") || 1);

  const contactName = searchParams.get("contactName") || "";
  const contactEmail = searchParams.get("contactEmail") || "";
  const contactPhone = searchParams.get("contactPhone") || "";
  const guestInfoName = searchParams.get("guestInfoName") || contactName;
  const specialRequests = searchParams.get("specialRequests") || "";
  const bookingId = searchParams.get("bookingId") || "";

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingBooking, setFetchingBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"hotel" | "vnpay">("hotel");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // default 15 minutes
  const expiresAtRef = useRef<number | null>(null);
  const HOLD_TTL_SECONDS = 15 * 60;
  const payableStatuses = useMemo(() => new Set(["PENDING", "PENDING_PAYMENT"]), []);
  const isPayableStatus = booking ? payableStatuses.has(booking.status) : true;

  const taxAndFees = 0;
  const derivedItem = booking?.items?.[0];
  const displayQuantity = derivedItem?.quantity ?? quantity;
  const displaySubtotalPerRoom = derivedItem?.unitPrice ?? roomPrice;
  
  // Calculate nights from dates
  const nights = useMemo(() => {
    const cin = booking?.checkInDate ?? checkIn;
    const cout = booking?.checkOutDate ?? checkOut;
    if (!cin || !cout) return 1;
    const start = new Date(cin);
    const end = new Date(cout);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [booking?.checkInDate, booking?.checkOutDate, checkIn, checkOut]);
  
  const displayTotalPrice = booking?.totalAmount ?? (displaySubtotalPerRoom * displayQuantity * nights);
  const displayHotelName = booking?.hotelName ?? hotelName;
  const displayRoomName = derivedItem?.roomTypeName ?? roomName;
  const displayCheckIn = booking?.checkInDate ?? checkIn;
  const displayCheckOut = booking?.checkOutDate ?? checkOut;
  const displayAdults = String(booking?.adults ?? adults);
  const displayChildren = String(booking?.children ?? children);
  const displayContactName = booking?.contactName ?? contactName;
  const displayContactEmail = booking?.contactEmail ?? contactEmail;
  const displayContactPhone = booking?.contactPhone ?? contactPhone;
  const displayGuestInfoName = derivedItem?.guestName ?? guestInfoName;
  const displaySpecialRequests = booking?.specialRequests ?? specialRequests;

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user is authenticated
    if (!user) {
      router.push("/");
      return;
    }

    if (!bookingId) return;

    // Client-side auth check: if no token, force login before fetching booking details
    const token = typeof window !== "undefined"
      ? (localStorage.getItem("token") || localStorage.getItem("accessToken") || sessionStorage.getItem("token") || sessionStorage.getItem("accessToken") || (() => {
          const m = document.cookie.match(/(?:^|; )(?:token|accessToken)=([^;]+)/);
          return m ? decodeURIComponent(m[1]) : null;
        })())
      : null;
    if (!token) {
      const redirect = encodeURIComponent(`/booking/payment?bookingId=${bookingId}`);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    setFetchingBooking(true);
    bookingApi
      .getBooking(bookingId)
      .then((data) => setBooking(data))
      .catch((err) => {
        const msg = err?.message || "Không lấy được thông tin đặt phòng";
        setError(msg);
        // If backend enforces auth and we hit 401/403, send user to login instead of showing booking info
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized") || msg.includes("403")) {
          const redirect = encodeURIComponent(`/booking/payment?bookingId=${bookingId}`);
          router.replace(`/login?redirect=${redirect}`);
        }
      })
      .finally(() => setFetchingBooking(false));
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;
    if (!isPayableStatus) {
      const statusMsg = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(booking.status)
        ? "Đơn đã được xác nhận/thanh toán, trang thanh toán này không còn hiệu lực."
        : ["CANCELLED", "NO_SHOW"].includes(booking.status)
        ? "Đơn đã bị hủy hoặc hết hiệu lực. Vui lòng đặt lại."
        : "Trang thanh toán không khả dụng cho trạng thái đơn hiện tại.";
      setError(statusMsg);
      router.replace(`/booking/${booking.id}`);
    } else if (booking.status === "PENDING" && !error) {
      // Show info message for retry scenario
    }
  }, [booking, isPayableStatus, router, error]);

  useEffect(() => {
    // Initialize remaining time from server expiry
    const expiresAtIso = booking?.holdExpiresAt;
    if (expiresAtIso) {
      expiresAtRef.current = new Date(expiresAtIso).getTime();
    } else if (booking?.createdAt) {
      // Fallback: compute expiry from booking creation time + TTL
      const createdMs = new Date(booking.createdAt).getTime();
      expiresAtRef.current = createdMs + HOLD_TTL_SECONDS * 1000;
    }

    if (expiresAtRef.current) {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((expiresAtRef.current - now) / 1000));
      setTimeRemaining(diffSec);
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const expiresMs = expiresAtRef.current;
      if (expiresMs) {
        const diffSec = Math.max(0, Math.floor((expiresMs - now) / 1000));
        setTimeRemaining(diffSec);
        if (diffSec === 0) {
          setError("Hết thời gian giữ chỗ. Vui lòng đặt lại.");
        }
      } else {
        // No server expiry available: fallback local countdown
        setTimeRemaining((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setError("Hết thời gian giữ chỗ. Vui lòng đặt lại.");
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.holdExpiresAt, booking?.createdAt]);

  useEffect(() => {
    const refreshAndRecompute = async () => {
      // If we have a bookingId, refresh booking from server to get latest expiry
      if (bookingId) {
        try {
          const latest = await bookingApi.getBooking(bookingId);
          setBooking(latest);
          const expiresAtIso = latest.holdExpiresAt;
          if (expiresAtIso) {
            expiresAtRef.current = new Date(expiresAtIso).getTime();
          } else if (latest.createdAt) {
            const createdMs = new Date(latest.createdAt).getTime();
            expiresAtRef.current = createdMs + HOLD_TTL_SECONDS * 1000;
          }
        } catch (e) {
          // Swallow refresh errors; fallback to local recompute below
        }
      }
      const expiresMs = expiresAtRef.current;
      if (expiresMs) {
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((expiresMs - now) / 1000));
        setTimeRemaining(diffSec);
        if (diffSec === 0) {
          setError("Hết thời gian giữ chỗ. Vui lòng đặt lại.");
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshAndRecompute();
    };
    window.addEventListener("focus", refreshAndRecompute);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refreshAndRecompute);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleConfirm = async () => {
    if (!bookingId) {
      setError("Thiếu mã đơn đặt phòng");
      return;
    }

    if (timeRemaining <= 0) {
      setError("Hết thời gian giữ chỗ. Vui lòng tạo lại đơn hoặc chọn phương thức khác.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (paymentMethod === "hotel") {
        await bookingApi.createPayment(bookingId, displayTotalPrice, "HOTEL");
        router.push(`/booking/payment/hotel-confirm?bookingId=${bookingId}`);
      } else {
        const resp = await bookingApi.initVnPay(bookingId);
        window.location.href = resp.redirectUrl;
      }
    } catch (err: any) {
      setError(err?.message || "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      setVoucherMessage("Vui lòng nhập mã giảm giá");
      return;
    }
    setVoucherMessage("Dịch vụ mã giảm giá hiện chưa khả dụng");
  };

  const summaryRows = useMemo(
    () => [
      { label: "Khách sạn", value: displayHotelName || "--" },
      { label: "Hạng phòng", value: displayRoomName || "--" },
      { label: "Nhận phòng", value: displayCheckIn || "--" },
      { label: "Trả phòng", value: displayCheckOut || "--" },
      { label: "Khách", value: `${displayAdults} người lớn · ${displayChildren} trẻ em` },
      { label: "Số phòng", value: `${displayQuantity} phòng` },
      { label: "Khách lưu trú", value: displayGuestInfoName || "--" },
      { label: "Liên hệ", value: displayContactName || "--" },
      { label: "Điện thoại", value: displayContactPhone || "--" },
      { label: "Email", value: displayContactEmail || "--" },
      { label: "Yêu cầu", value: displaySpecialRequests || "Không" },
      { label: "Số lượng", value: `${displayQuantity} phòng` },
    ],
    [displayHotelName, displayRoomName, displayCheckIn, displayCheckOut, displayAdults, displayChildren, displayQuantity, displayGuestInfoName, displayContactName, displayContactPhone, displayContactEmail, displaySpecialRequests]
  );

  return (
    <div className="bg-white text-[#111827]">
      <Header />

      <main className="bg-[#F8FAFC] pb-12">
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#6B7280]">Thanh toán</p>
              <h1 className="text-2xl font-semibold text-[#0F172A]">Chọn phương thức thanh toán</h1>
            </div>
            <button
              onClick={() => router.back()}
              className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2563EB] font-semibold hover:bg-[#F3F4F6]"
            >
              Quay lại
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left: Payment methods */}
            <div className="space-y-4">
              <div className="rounded-2xl shadow-sm p-4 flex items-center justify-between bg-gradient-to-r from-[#0A6CDC] to-[#0B8FF9] text-white">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <p className="text-sm font-semibold">Đừng lo lắng, giá vẫn giữ nguyên. Hoàn tất thanh toán của bạn bằng</p>
                </div>
                <div className="flex items-center gap-2 font-bold text-lg text-[#C3FF5A]">
                  <span>{formatTime(timeRemaining)}</span>
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Phương thức thanh toán</h2>

                <div className="space-y-3">
                  <label className={`flex items-center gap-3 rounded-xl border px-5 py-5 cursor-pointer transition ${
                    paymentMethod === "hotel" ? "border-[#2563EB] bg-[#EEF2FF]" : "border-[#E5E7EB] bg-white"
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="hotel"
                      checked={paymentMethod === "hotel"}
                      onChange={() => setPaymentMethod("hotel")}
                      className="h-4 w-4 text-[#2563EB]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Thanh toán tại khách sạn</p>
                      <p className="text-xs text-[#6B7280]">Thanh toán khi nhận phòng, không cần thẻ ngay bây giờ</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 rounded-xl border px-5 py-5 cursor-pointer transition ${
                    paymentMethod === "vnpay" ? "border-[#2563EB] bg-[#EEF2FF]" : "border-[#E5E7EB] bg-white"
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={paymentMethod === "vnpay"}
                      onChange={() => setPaymentMethod("vnpay")}
                      className="h-4 w-4 text-[#2563EB]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Thanh toán qua VNPay</p>
                      <p className="text-xs text-[#6B7280]">Hỗ trợ thẻ quốc tế và nội địa, mã QR</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Lưu ý</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[#4B5563]">
                  <li>Thay đổi / hủy phòng tùy vào chính sách khách sạn.</li>
                  <li>Thông tin liên hệ sẽ được dùng để gửi xác nhận đặt phòng.</li>
                  <li>Bạn có thể kiểm tra lại tóm tắt đơn ở khung bên phải.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6 space-y-3">
                <h3 className="text-lg font-semibold text-[#0F172A]">Mã giảm giá</h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã giảm giá"
                    className="flex-1 rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    className="rounded-lg bg-[#2563EB] px-5 py-3 text-white font-semibold shadow hover:bg-[#1D4ED8] transition"
                  >
                    Áp dụng
                  </button>
                </div>
                {voucherMessage && <p className="text-sm text-[#2563EB]">{voucherMessage}</p>}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
              <button
                onClick={handleConfirm}
                disabled={loading || fetchingBooking || !isPayableStatus}
                className={`w-full rounded-lg px-4 py-3 text-white font-semibold shadow transition ${
                  loading || fetchingBooking ? "bg-[#93C5FD]" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                }`}
              >
                {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </button>
            </div>

            {/* Right: Summary card styled like provided design */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-lg sticky top-20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1C6AE4] to-[#1E90FF] text-white px-4 py-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Tóm tắt khách sạn</p>
                  <p className="text-sm opacity-90">Mã đặt chỗ <span className="font-semibold">{booking?.id || bookingId || "--"}</span></p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{displayHotelName || "Khách sạn"}</h2>
                </div>

                {/* Check-in / Check-out */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFF] p-3">
                    <p className="text-sm font-semibold text-[#0F172A]">Nhận phòng</p>
                    <p className="text-sm text-[#0F172A] mt-1">{displayCheckIn || "--"}</p>
                    <p className="text-xs text-[#6B7280]">Từ 14:00</p>
                  </div>
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFF] p-3">
                    <p className="text-sm font-semibold text-[#0F172A]">Trả phòng</p>
                    <p className="text-sm text-[#0F172A] mt-1">{displayCheckOut || "--"}</p>
                    <p className="text-xs text-[#6B7280]">Trước 12:00</p>
                  </div>
                </div>

                {/* Room info */}
                <div className="space-y-2 text-sm text-[#0F172A]">
                  <p className="font-semibold">({displayQuantity}x) {displayRoomName || "Hạng phòng"}</p>
                  <ul className="space-y-1 text-[#374151]">
                    <li className="flex items-center gap-2"><Users className="h-4 w-4" /> {displayAdults} khách</li>
                    <li className="flex items-center gap-2"><BedDouble className="h-4 w-4" /> 1 giường</li>
                    <li className="flex items-center gap-2"><Soup className="h-4 w-4" /> Bữa sáng cho 2 người</li>
                    <li className="flex items-center gap-2"><Wifi className="h-4 w-4" /> WiFi miễn phí</li>
                  </ul>
                </div>


                {/* Guest & policies */}
                <div className="space-y-2 text-sm text-[#0F172A]">
                  <p className="font-semibold">Tên khách</p>
                  <p className="text-[#374151]">{displayGuestInfoName || displayContactName || "--"}</p>
                  <div className="flex items-center gap-2 text-[#374151]">
                    <XCircle className="h-4 w-4 text-red-500" /> Không hoàn tiền
                  </div>
                  <div className="flex items-center gap-2 text-[#374151]">
                    <Ban className="h-4 w-4 text-[#9CA3AF]" /> Không đổi lịch
                  </div>
                </div>

                {/* Contact */}
                <div className="pt-2 border-t border-dashed border-[#E5E7EB] space-y-2 text-sm text-[#0F172A]">
                  <p className="font-semibold">Chi tiết người liên lạc</p>
                  <p className="text-[#374151]">{displayContactName || "--"}</p>
                  <div className="flex items-center gap-2 text-[#374151]">
                    <Phone className="h-4 w-4" />
                    <span>{displayContactPhone || "--"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#374151]">
                    <Mail className="h-4 w-4" />
                    <span>{displayContactEmail || "--"}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="pt-3 border-t border-dashed border-[#E5E7EB] space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Giá phòng/đêm</span>
                    <span className="text-[#0F172A] font-semibold">{formatPrice(displaySubtotalPerRoom)}</span>
                  </div>
                  {displayQuantity > 1 && (
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Số lượng phòng</span>
                      <span className="text-[#0F172A]">× {displayQuantity}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Thuế và phí</span>
                    <span className="text-[#0F172A] font-semibold">{formatPrice(taxAndFees)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                    <span className="text-base font-semibold text-[#0F172A]">Tổng cộng</span>
                    <span className="text-lg font-bold text-[#DC2626]">{formatPrice(displayTotalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom banner */}
              <div className="bg-gradient-to-r from-[#5CD15C] to-[#8BE18B] text-[#0B3B0B] text-center text-sm font-semibold py-3 px-4">
                Sự lựa chọn tuyệt vời cho kỳ nghỉ của bạn!
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
