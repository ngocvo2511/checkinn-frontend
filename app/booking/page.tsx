"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { bookingApi, type CreateBookingPayload } from "@/lib/api/booking";
import { type AuthResponse } from "@/lib/api/auth";

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return "Liên hệ";
  return `${value.toLocaleString("vi-VN")} VND`;
};

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hotelId = searchParams.get("hotelId") || "";
  const hotelName = searchParams.get("hotelName") || "";
  const roomId = searchParams.get("roomId") || "";
  const roomName = searchParams.get("roomName") || "";
  const roomPrice = searchParams.get("roomPrice") || "0";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";
  const rooms = searchParams.get("rooms") || "1";
  const quantity = Number(searchParams.get("quantity") || "1");

  const [guestName, setGuestName] = useState("");
  const [guestInfoName, setGuestInfoName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookForSelf, setBookForSelf] = useState(true);
  const [isEditingGuestName, setIsEditingGuestName] = useState(false);
  const [hasManuallyEditedGuestName, setHasManuallyEditedGuestName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    try {
      setUser(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to parse user", err);
    }
  }, []);

  // Validation states
  const [errors, setErrors] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
  });

  const basePrice = Number(roomPrice);
  const taxAndFees = 0;
  const subtotalPerRoom = basePrice;
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkIn, checkOut]);
  const totalPrice = subtotalPerRoom * quantity * nights;

  // Validation functions
  const validateName = (value: string) => {
    if (!value.trim()) {
      return "Họ tên là phần bắt buộc";
    }
    if (value.trim().length < 2) {
      return "Họ tên tối thiểu là 2";
    }
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(value.trim())) {
      return "Rất tiếc, vui lòng chỉ nhập chữ (a-z)";
    }
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Email là phần bắt buộc";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return "Email không hợp lệ";
    }
    return "";
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) {
      return "Điện thoại là phần bắt buộc";
    }
    const phoneDigits = value.replace(/\D/g, "");
    if (phoneDigits.length !== 9) {
      return "Điện thoại phải là 9 ký tự số";
    }
    return "";
  };

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    // Auto remove leading 0 if 10 digits
    if (cleaned.length === 10 && cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    // Only allow up to 9 digits
    cleaned = cleaned.substring(0, 9);
    setGuestPhone(cleaned);
  };

  const handleContactBlur = () => {
    const newErrors = {
      guestName: validateName(guestName),
      guestEmail: validateEmail(guestEmail),
      guestPhone: validatePhone(guestPhone),
    };
    setErrors(newErrors);
  };

  // Sync guest info name from contact name initially
  const handleContactNameChange = (value: string) => {
    setGuestName(value);
    if (!hasManuallyEditedGuestName) {
      setGuestInfoName(value);
    }
  };

  const runValidation = () => {
    const newErrors = {
      guestName: validateName(guestName),
      guestEmail: validateEmail(guestEmail),
      guestPhone: validatePhone(guestPhone),
    };
    setErrors(newErrors);
    return !newErrors.guestName && !newErrors.guestEmail && !newErrors.guestPhone;
  };

  const handleProceed = async () => {
    const isValid = runValidation();
    if (!isValid) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: CreateBookingPayload = {
        userId: user ? String(user.userId) : undefined,
        hotelId,
        hotelName,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: Number(adults),
        children: Number(children),
        contactName: guestName,
        contactEmail: guestEmail,
        contactPhone: guestPhone,
        specialRequests,
        items: [
          {
            roomTypeId: roomId,
            roomTypeName: roomName,
            ratePlanId: roomId,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            quantity,
            unitPrice: Number(roomPrice),
            nights,
            guestName: guestInfoName || guestName,
            cancellationPolicy: "",
          },
        ],
      };

      const booking = await bookingApi.createBooking(payload);
      const params = new URLSearchParams({ bookingId: booking.id });
      router.push(`/booking/payment?${params.toString()}`);
    } catch (error: any) {
      setSubmitError(error?.message || "Không thể tạo đơn đặt phòng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white text-[#111827]">
      <Header user={null} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />

      <main className="bg-[#F8FAFC] pb-12">
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0F172A]">{hotelName}</h1>
            <p className="text-sm text-[#6B7280] mt-1">Hoàn tất đặt phòng của bạn</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            {/* Left: Booking Form */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">✉️</span>
                  <h2 className="text-lg font-semibold text-[#0F172A]">Liên hệ đặt chỗ</h2>
                </div>
                <p className="text-sm text-[#6B7280] mb-4">
                  Thêm liên hệ để nhận xác nhận đặt chỗ.
                </p>

                <form className="space-y-4" onBlur={handleContactBlur}>
                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                      Họ tên<span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => handleContactNameChange(e.target.value)}
                      className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none ${
                        errors.guestName
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E7EB] focus:border-[#2563EB]"
                      }`}
                    />
                    {errors.guestName && (
                      <p className="text-xs text-red-600 mt-1">{errors.guestName}</p>
                    )}
                    {!errors.guestName && (
                      <p className="text-xs text-[#9CA3AF] mt-1">như trên CMND (không dấu)</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                      Điện thoại di động<span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none">
                        <option>🇻🇳 +84</option>
                      </select>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm focus:outline-none ${
                          errors.guestPhone
                            ? "border-red-500 focus:border-red-500"
                            : "border-[#E5E7EB] focus:border-[#2563EB]"
                        }`}
                      />
                    </div>
                    {errors.guestPhone && (
                      <p className="text-xs text-red-600 mt-1">{errors.guestPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                      Email<span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none ${
                        errors.guestEmail
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E7EB] focus:border-[#2563EB]"
                      }`}
                    />
                    {errors.guestEmail && (
                      <p className="text-xs text-red-600 mt-1">{errors.guestEmail}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="bookForSelf"
                      checked={bookForSelf}
                      onChange={(e) => setBookForSelf(e.target.checked)}
                      className="h-4 w-4 rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <label htmlFor="bookForSelf" className="text-sm text-[#4B5563]">
                      Tôi đặt chỗ cho chính mình
                    </label>
                  </div>
                </form>
              </div>

              {/* Guest Info */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">👤</span>
                  <h2 className="text-lg font-semibold text-[#0F172A]">Thông tin Khách hàng</h2>
                </div>
                <p className="text-sm text-[#6B7280] mb-4">
                  Vui lòng điền đầy đủ các thông tin để nhận xác nhận đơn hàng
                </p>
                {submitError && (
                  <p className="text-sm text-red-600 mb-2">{submitError}</p>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                      Họ tên
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={guestInfoName}
                        onChange={(e) => {
                          setGuestInfoName(e.target.value);
                          if (isEditingGuestName) {
                            setHasManuallyEditedGuestName(true);
                          }
                        }}
                        readOnly={!isEditingGuestName}
                        className={`flex-1 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm ${
                          isEditingGuestName ? "bg-white focus:border-[#2563EB] focus:outline-none" : "bg-[#F9FAFB]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingGuestName(!isEditingGuestName)}
                        className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#2563EB] font-semibold hover:bg-[#F0F9FF] transition"
                      >
                        {isEditingGuestName ? "Lưu" : "Chỉnh sửa"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">😊</span>
                  <h2 className="text-lg font-semibold text-[#0F172A]">Yêu cầu đặc biệt</h2>
                </div>
                <p className="text-sm text-[#6B7280] mb-4">
                  Bạn cần thêm giường phụ hoặc có yêu cầu đặc biệt? Gửi yêu cầu của bạn và khách sạn sẽ cố gắng đáp ứng nguyện vọng của bạn (Xin lưu ý: yêu cầu đặc biệt không được đảm bảo và có thể bị tính phí thêm)
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="nonSmoking" className="h-4 w-4 rounded border-[#E5E7EB]" />
                    <label htmlFor="nonSmoking" className="text-sm text-[#4B5563]">Phòng không hút thuốc</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="adjoining" className="h-4 w-4 rounded border-[#E5E7EB]" />
                    <label htmlFor="adjoining" className="text-sm text-[#4B5563]">Phòng liền thông</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="floor" className="h-4 w-4 rounded border-[#E5E7EB]" />
                    <label htmlFor="floor" className="text-sm text-[#4B5563]">Tầng lầu</label>
                  </div>

                  <button className="text-sm text-[#2563EB] font-semibold hover:text-[#1D4ED8]">
                    Đọc tất cả
                  </button>
                </div>
              </div>

              {/* Policies */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📋</span>
                  <h2 className="text-lg font-semibold text-[#0F172A]">Chính sách Chỗ ở</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#F0F9FF] p-4">
                    <p className="text-sm font-semibold text-[#0F172A] mb-2">💡 Lưu ý quan trọng</p>
                    <p className="text-sm text-[#4B5563]">
                      Chính sách này Khí nhận phòng, bạn phải mang theo Chứng minh thư. Các tài liệu cần thiết có thể ở dạng bản mềm. Thông bào về có sẽ vật của Sánh Phòng chợ / Quầy bar, Hồ bơi nội của Khách sạn cho lương khách hạn chế tối đa từ 15-3-2025...
                    </p>
                    <button className="text-sm text-[#2563EB] font-semibold mt-2">Đọc tất cả</button>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-2">📄 Giấy Tờ Bắt Buộc</p>
                    <p className="text-sm text-[#4B5563]">
                      Khí nhận phòng, bạn cần cung cấp CMND/CCCD. Các tài liệu có thể ở dạng bản mềm.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Price Summary */}
              <div className="space-y-6">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6 sticky top-20">
                <div className="mb-4 rounded-lg bg-[#E0F2FE] p-3 text-sm text-[#075985]">
                  ⏰ Đừng khoảnh chứng là 2 giây! Chỉ còn <span className="font-bold">1 phòng</span> có giá thấp nhất này!
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-[#0F172A]">({quantity}x) {roomName}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Chỉ còn 1 phòng</p>
                </div>

                <div className="space-y-3 border-t border-[#E5E7EB] pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Nhận phòng</span>
                    <span className="font-semibold text-[#0F172A]">{checkIn || "Chưa chọn"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Trả phòng</span>
                    <span className="font-semibold text-[#0F172A]">{checkOut || "Chưa chọn"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Khách</span>
                    <span className="font-semibold text-[#0F172A]">{adults} người lớn · {children} trẻ em</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Phòng</span>
                    <span className="font-semibold text-[#0F172A]">{quantity} phòng</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#E5E7EB] pt-4 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Đặt phòng chờ hoàn tiền</span>
                    <span className="text-[#0F172A]">✅</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">🚭 Non-reschedulable</span>
                    <span className="text-[#0F172A]">ℹ️</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#E5E7EB] pt-4 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Giá phòng/đêm</span>
                    <span className="text-[#0F172A]">{formatPrice(subtotalPerRoom)}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="flex items-center justify-between text-sm text-[#6B7280]">
                      <span className="text-[#6B7280]">Số phòng</span>
                      <span className="text-[#0F172A]">× {quantity}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Thuế và phí</span>
                    <span className="text-[#0F172A]">{formatPrice(taxAndFees)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4 mt-4">
                  <span className="text-base font-semibold text-[#0F172A]">Tổng cộng</span>
                  <div className="text-right">
                    <p className="text-xs text-[#9CA3AF] line-through">{formatPrice(Math.round(totalPrice * 1.15))}</p>
                    <p className="text-xl font-bold text-[#DC2626]">{formatPrice(totalPrice)}</p>
                  </div>
                </div>

                <p className="text-xs text-[#6B7280] mt-2">{quantity} phòng, {nights} đêm</p>

                <button
                  onClick={handleProceed}
                  disabled={submitting}
                  className={`w-full mt-6 rounded-lg px-4 py-3 text-white font-semibold shadow transition ${
                    submitting ? "bg-[#93C5FD]" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                  }`}
                >
                  {submitting ? "Đang xử lý..." : "Tiếp tục"}
                </button>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-1 text-xs text-[#6B7280]">
                  <span>Nhấn Tiếp tục nghĩa là bạn đồng ý</span>
                  <a href="#" className="text-[#2563EB] underline">Điều khoản và Điều kiện</a>
                  <span>,</span>
                  <a href="#" className="text-[#2563EB] underline">Chính sách Bảo mật</a>
                  <span>và</span>
                  <a href="#" className="text-[#2563EB] underline">Quy trình Hoàn tiền Lưu trú</a>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-xs text-amber-600">🪙 Earn 5.656 Points</span>
                  <span className="text-xs text-[#9CA3AF]">⭐ Kiếm 1.939.224 Sao Priority</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
