"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserSidebar from "@/components/UserSidebar";
import { bookingApi, type BookingResponse } from "@/lib/api/booking";
import { type AuthResponse } from "@/lib/api/auth";
import { reviewApi } from "@/lib/api/reviews";
import hotelApi from "@/lib/api/hotels";
import { CustomerOnlyRoute } from "@/components/CustomerOnlyRoute";

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

function getRatingColor(value: number) {
  if (value >= 9) return 'text-green-600';
  if (value >= 8) return 'text-blue-600';
  if (value >= 7) return 'text-cyan-600';
  if (value >= 6) return 'text-yellow-600';
  if (value >= 5) return 'text-orange-600';
  return 'text-red-600';
}

export default function BookingHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupVariant, setSignupVariant] = useState<'user' | 'host'>('user');
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [hotelImages, setHotelImages] = useState<Record<string, string>>({});

  const handleViewReview = async (bookingId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      const review = await reviewApi.getReviewByBookingId(bookingId, token);
      if (review) {
        setSelectedReview(review);
      }
    } catch (err) {
      console.error('Error fetching review:', err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      setLoading(false);
      setMounted(true);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthResponse;
      setUser(parsed);
    } catch (err) {
      console.error("Failed to parse user", err);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    
    const loadBookings = async () => {
      try {
        const data = await bookingApi.getUserBookings(String(user.userId));
        setBookings(data);
        
        // Check which bookings have reviews
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
          const checkedOutBookings = data.filter(b => b.status === 'CHECKED_OUT');
          const reviewChecks = await Promise.all(
            checkedOutBookings.map(b => 
              reviewApi.hasBookingBeenReviewed(b.id, token)
                .then(hasReview => ({ id: b.id, hasReview }))
            )
          );
          
          const reviewed = new Set(
            reviewChecks.filter(r => r.hasReview).map(r => r.id)
          );
          setReviewedBookings(reviewed);
        }
      } catch (err: any) {
        setError(err?.message || "Không lấy được lịch sử đặt phòng");
      } finally {
        setLoading(false);
      }
    };
    
    loadBookings();
  }, [user?.userId]);

  // Fetch hotel images for all bookings
  useEffect(() => {
    if (bookings.length === 0) return;

    const fetchHotelImages = async () => {
      const images: Record<string, string> = {};
      
      // Get unique hotel IDs that need to be fetched
      const hotelIdsToFetch = bookings
        .filter(b => b.hotelId && !hotelImages[b.hotelId])
        .map(b => b.hotelId)
        .filter((id, idx, arr) => arr.indexOf(id) === idx); // Remove duplicates
      
      // Fetch all hotels in parallel
      const hotelPromises = hotelIdsToFetch.map(hotelId =>
        hotelApi.getHotelById(hotelId)
          .then(hotel => {
            if (hotel.mediaAssets && hotel.mediaAssets.length > 0) {
              images[hotelId] = hotel.mediaAssets[0].url;
            }
          })
          .catch(err => console.error(`Error fetching hotel ${hotelId}:`, err))
      );
      
      await Promise.all(hotelPromises);
      
      if (Object.keys(images).length > 0) {
        setHotelImages(prev => ({ ...prev, ...images }));
      }
    };

    fetchHotelImages();
  }, [bookings.length, hotelImages]);

  const handleEditProfile = () => {
    router.push("/personal-data");
  };

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  }, [bookings]);

  if (!mounted) return null;

  return (
    <CustomerOnlyRoute>
      <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header 
        onLogin={() => setShowLogin(true)} 
        onSignup={() => { setSignupVariant('user'); setShowSignup(true); }} 
        onEditProfile={handleEditProfile}
      />
      <main className="flex-1 bg-[#f9f9f9]">
        <div className="flex-1 max-w-[1440px] mx-auto w-full px-[104px] py-8">
          <div className="flex gap-6">
            <UserSidebar fullName={user?.fullName} activeMenu="bookings" />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
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
                  <div key={booking.id}>
                    <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:justify-between lg:items-start">
                        {/* Hotel Image */}
                        <div className="w-full lg:w-48 lg:h-40 flex-shrink-0">
                          <div className="relative w-full h-48 lg:h-40 rounded-xl overflow-hidden bg-gray-200">
                            {hotelImages[booking.hotelId] ? (
                              <img 
                                src={hotelImages[booking.hotelId]} 
                                alt={booking.hotelName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                Đang tải ảnh...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
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

                        <div className="flex flex-col gap-3 w-full lg:w-auto lg:items-end">
                          <div className="flex flex-col gap-1 min-w-max text-right">
                            <div className="text-base font-semibold text-[#0F172A]">Tổng: {formatCurrency(Number(booking.totalAmount))}</div>
                            <div className="text-sm text-[#6B7280]">Đã thanh toán: {formatCurrency(Number(booking.paidAmount))}</div>
                          </div>
                          <div className="flex gap-2 flex-wrap lg:flex-nowrap mt-9">
                            {booking.status === "PENDING" || booking.status === "PENDING_PAYMENT" ? (
                              <button
                                onClick={() => router.push(`/booking/payment?bookingId=${booking.id}`)}
                                className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] flex-1 lg:flex-none lg:w-28 whitespace-nowrap"
                              >
                                Thanh toán
                              </button>
                            ) : null}
                            {booking.status === "CHECKED_OUT" && !reviewedBookings.has(booking.id) ? (
                              <button
                                onClick={() => router.push(`/reviews/new?bookingId=${booking.id}&hotelId=${booking.hotelId}`)}
                                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 flex-1 lg:flex-none lg:w-28 whitespace-nowrap"
                              >
                                Viết đánh giá
                              </button>
                            ) : null}
                            {booking.status === "CHECKED_OUT" && reviewedBookings.has(booking.id) ? (
                              <button
                                onClick={() => handleViewReview(booking.id)}
                                className="px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex-1 lg:flex-none lg:w-28 whitespace-nowrap border border-blue-200"
                              >
                                Xem đánh giá
                              </button>
                            ) : null}
                            <button
                              onClick={() => router.push(`/booking/${booking.id}`)}
                              className="rounded-lg border border-[#2563EB] px-3 py-2 text-sm font-semibold text-[#1D4ED8] bg-[#EEF2FF] hover:bg-[#E0E7FF] flex-1 lg:flex-none whitespace-nowrap"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Close Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Đánh giá của bạn</h2>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Overall Rating */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-4xl font-bold ${getRatingColor(selectedReview.rating)}`}>
                  {selectedReview.rating}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Điểm đánh giá tổng thể</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedReview.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Title and Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedReview.title}</h3>
              <p className="text-gray-700 leading-relaxed">{selectedReview.content}</p>
            </div>

            {/* Detailed Ratings */}
            {selectedReview.staffRating || selectedReview.amenitiesRating || selectedReview.cleanlinessRating || selectedReview.comfortRating || selectedReview.valueForMoneyRating || selectedReview.locationRating ? (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Đánh giá chi tiết</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReview.staffRating && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">👥 Nhân viên</span>
                      <span className="font-semibold text-gray-900">{selectedReview.staffRating}</span>
                    </div>
                  )}
                  {selectedReview.amenitiesRating && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">🏊 Tiện nghi</span>
                      <span className="font-semibold text-gray-900">{selectedReview.amenitiesRating}</span>
                    </div>
                  )}
                  {selectedReview.cleanlinessRating && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">✨ Sạch sẽ</span>
                      <span className="font-semibold text-gray-900">{selectedReview.cleanlinessRating}</span>
                    </div>
                  )}
                  {selectedReview.comfortRating && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">🛏️ Thoải mái</span>
                      <span className="font-semibold text-gray-900">{selectedReview.comfortRating}</span>
                    </div>
                  )}
                  {selectedReview.valueForMoneyRating && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">💰 Giá trị</span>
                      <span className="font-semibold text-gray-900">{selectedReview.valueForMoneyRating}</span>
                    </div>
                  )}
                  {selectedReview.locationRating && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">📍 Địa điểm</span>
                      <span className="font-semibold text-gray-900">{selectedReview.locationRating}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Close Button */}
            <button
              onClick={() => setSelectedReview(null)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      </div>
    </CustomerOnlyRoute>
  );
}
