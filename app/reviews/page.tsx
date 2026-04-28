"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserSidebar from "@/components/UserSidebar";
import { bookingApi, type BookingResponse } from "@/lib/api/booking";
import { reviewApi, type Review } from "@/lib/api/reviews";
import { type AuthResponse } from "@/lib/api/auth";
import hotelApi from "@/lib/api/hotels";
import { CustomerOnlyRoute } from "@/components/CustomerOnlyRoute";

function formatDate(value?: string | Date) {
  if (!value) return "--";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getRatingColor(value: number) {
  if (value >= 9) return 'text-green-600';
  if (value >= 8) return 'text-blue-600';
  if (value >= 7) return 'text-cyan-600';
  if (value >= 6) return 'text-yellow-600';
  if (value >= 5) return 'text-orange-600';
  return 'text-red-600';
}

const statusBadgeColor: Record<string, string> = {
  'PENDING': 'bg-amber-100 text-amber-800',
  'PUBLISHED': 'bg-green-100 text-green-800',
  'REJECTED': 'bg-red-100 text-red-800',
};

export default function ReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'unreviewed' | 'reviewed'>('unreviewed');
  
  // Unreviewed bookings
  const [unreviewedBookings, setUnreviewedBookings] = useState<BookingResponse[]>([]);
  const [hotelImages, setHotelImages] = useState<Record<string, string>>({});
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewHotelImages, setReviewHotelImages] = useState<Record<string, string>>({});
  const [reviewHotelNames, setReviewHotelNames] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage
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

  // Load bookings and reviews
  useEffect(() => {
    if (!user?.userId) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Get all bookings
        const allBookings = await bookingApi.getUserBookings(String(user.userId));
        
        // Filter CHECKED_OUT bookings
        const checkedOutBookings = allBookings.filter(b => b.status === 'CHECKED_OUT');
        
        // Check which have reviews
        const unreviewed: BookingResponse[] = [];
        for (const booking of checkedOutBookings) {
          if (token) {
            const hasReview = await reviewApi.hasBookingBeenReviewed(booking.id, token);
            if (!hasReview) {
              unreviewed.push(booking);
            }
          }
        }
        
        setUnreviewedBookings(unreviewed);
        
        // Fetch hotel images for unreviewed bookings
        const images: Record<string, string> = {};
        for (const booking of unreviewed) {
          if (booking.hotelId) {
            try {
              const hotel = await hotelApi.getHotelById(booking.hotelId);
              if (hotel.mediaAssets && hotel.mediaAssets.length > 0) {
                images[booking.hotelId] = hotel.mediaAssets[0].url;
              }
            } catch (err) {
              console.error(`Error fetching hotel ${booking.hotelId}:`, err);
            }
          }
        }
        setHotelImages(images);
        
        // Fetch all reviews from hotels user has booked
        const allReviews: Review[] = [];
        const hotelIds = new Set(allBookings.map(b => b.hotelId).filter(Boolean));
        
        for (const hotelId of hotelIds) {
          try {
            const response = await reviewApi.getHotelReviews(String(hotelId), 0, 100);
            if (response.content) {
              allReviews.push(...response.content);
            }
          } catch (err) {
            console.error(`Error fetching reviews for hotel ${hotelId}:`, err);
          }
        }
        
        // Enrich each review with owner response
        const responses = await Promise.all(
          allReviews.map(async (r) => {
            try {
              return await reviewApi.getReviewResponse(r.id);
            } catch {
              return null;
            }
          })
        );
        const enriched = allReviews.map((r, idx) => ({
          ...r,
          ownerResponse: responses[idx] ?? r.ownerResponse,
        }));

        setReviews(enriched);
        
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.userId]);

  // Load hotel images for reviews
  useEffect(() => {
    if (reviews.length === 0) return;

    const loadReviewHotelInfo = async () => {
      const images: Record<string, string> = {};
      const names: Record<string, string> = {};
      
      for (const review of reviews) {
        if (review.hotelId) {
          try {
            const hotel = await hotelApi.getHotelById(review.hotelId);
            if (hotel.mediaAssets && hotel.mediaAssets.length > 0) {
              images[review.hotelId] = hotel.mediaAssets[0].url;
            }
            if (hotel.name) {
              names[review.hotelId] = hotel.name;
            }
          } catch (err) {
            console.error(`Error fetching hotel ${review.hotelId}:`, err);
          }
        }
      }
      if (Object.keys(images).length > 0) {
        setReviewHotelImages(prev => ({ ...prev, ...images }));
      }
      if (Object.keys(names).length > 0) {
        setReviewHotelNames(prev => ({ ...prev, ...names }));
      }
    };

    loadReviewHotelInfo();
  }, [reviews, reviewHotelImages, reviewHotelNames]);

  const handleEditProfile = () => {
    router.push("/personal-data");
  };

  if (!mounted) return null;

  return (
    <CustomerOnlyRoute>
      <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header 
        onLogin={() => {}}
        onSignup={() => {}}
        onEditProfile={handleEditProfile}
      />
      <main className="flex-1 bg-[#f9f9f9]">
        <div className="flex-1 max-w-[1440px] mx-auto w-full px-[104px] py-8">
          <div className="flex gap-6">
            <UserSidebar fullName={user?.fullName} activeMenu="reviews" />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {!user && (
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <p className="text-sm text-[#4B5563]">Bạn cần đăng nhập để xem đánh giá.</p>
                  <button
                    onClick={() => router.push("/")}
                    className="mt-3 rounded-lg bg-[#2563EB] px-4 py-2 text-white text-sm font-semibold hover:bg-[#1D4ED8]"
                  >
                    Đăng nhập
                  </button>
                </div>
              )}

              {user && (
                <>
                  {/* Tabs */}
                  <div className="bg-white rounded-2xl mb-6 p-2 min-w-[920px]">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('unreviewed')}
                        className={`flex-1 px-6 py-3 rounded-xl font-medium text-base transition-colors ${
                          activeTab === 'unreviewed'
                            ? 'bg-[#e8effc] text-[#0057ff]'
                            : 'text-[#383e48] hover:bg-gray-50'
                        }`}
                      >
                        Chưa đánh giá ({unreviewedBookings.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('reviewed')}
                        className={`flex-1 px-6 py-3 rounded-xl font-medium text-base transition-colors ${
                          activeTab === 'reviewed'
                            ? 'bg-[#e8effc] text-[#0057ff]'
                            : 'text-[#383e48] hover:bg-gray-50'
                        }`}
                      >
                        Đã đánh giá ({reviews.length})
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div>
                    {loading && <p className="text-sm text-[#6B7280]">Đang tải...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {/* Unreviewed Tab */}
                    {activeTab === 'unreviewed' && (
                      <div className="space-y-4">
                        {!loading && unreviewedBookings.length === 0 && (
                          <p className="text-sm text-[#6B7280]">Không có đặt phòng nào cần đánh giá.</p>
                        )}
                        
                        {unreviewedBookings.map((booking) => (
                          <div key={booking.id} className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-5">
                            <div className="flex flex-col lg:flex-row lg:gap-6">
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
                                <h3 className="text-lg font-semibold text-[#0F172A]">{(booking.hotelName || 'Khách sạn').replace(/"/g, '')}</h3>
                                <p className="text-sm text-[#4B5563]">{(booking.items?.[0]?.roomTypeName || 'Loại phòng').replace(/"/g, '')}</p>
                                <p className="text-sm text-[#6B7280]">
                                  Nhận phòng: {formatDate(booking.checkInDate)} | Trả phòng: {formatDate(booking.checkOutDate)}
                                </p>
                                
                                <button
                                  onClick={() => router.push(`/reviews/new?bookingId=${booking.id}&hotelId=${booking.hotelId}`)}
                                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                >
                                  Viết đánh giá
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reviewed Tab */}
                    {activeTab === 'reviewed' && (
                      <div className="space-y-4">
                        {!loading && reviews.length === 0 && (
                          <p className="text-sm text-[#6B7280]">Chưa có đánh giá nào.</p>
                        )}
                        
                        {reviews.map((review) => (
                          <div key={review.id} className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-5 relative">
                            <div className="flex flex-col lg:flex-row lg:gap-6">
                              {/* Hotel Image */}
                              <div className="w-full lg:w-48 lg:h-40 flex-shrink-0">
                                <div className="relative w-full h-48 lg:h-40 rounded-xl overflow-hidden bg-gray-200">
                                  {reviewHotelImages[review.hotelId] ? (
                                    <img 
                                      src={reviewHotelImages[review.hotelId]} 
                                      alt="Khách sạn"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      Đang tải ảnh...
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 3-dot menu */}
                              <div className="absolute top-4 right-4">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                  </svg>
                                </button>
                                {openMenuId === review.id && (
                                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-10">
                                    <button
                                      onClick={() => {
                                        // TODO: Handle delete
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Review Content */}
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeColor[review.status] || 'bg-gray-100'}`}>
                                    {review.status === 'PENDING' ? 'Chờ duyệt' : review.status === 'PUBLISHED' ? 'Đã công bố' : 'Bị từ chối'}
                                  </span>
                                </div>

                                <p className="text-lg font-bold text-[#0F172A]">{reviewHotelNames[review.hotelId] || 'Khách sạn'}</p>
                                
                                <p className="text-sm text-[#6B7280]">{formatDate(review.createdAt)}</p>
                                
                                <div className={`text-2xl font-bold ${getRatingColor(review.rating)}`}>
                                  {review.rating}
                                </div>
                                
                                <h3 className="text-base font-semibold text-[#0F172A]">{review.title}</h3>

                                <p className="text-sm text-[#4B5563]">{review.content}</p>

                                {review.ownerResponse && (
                                  <div className="mt-4 bg-[#F9FAFB] rounded-lg p-4 border-l-4 border-[#0057FF]">
                                    <p className="text-xs font-semibold text-[#0057FF] uppercase mb-2">
                                      Phản hồi từ chủ khách sạn
                                    </p>
                                    <div className="flex items-start gap-2 mb-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-sm font-bold">
                                        {(review.ownerResponse.ownerName?.[0]?.toUpperCase() || 'O')}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-semibold text-sm text-[#111827]">
                                          {review.ownerResponse.ownerName || 'Chủ khách sạn'}
                                        </p>
                                        <p className="text-xs text-[#9CA3AF]">
                                          {formatDate(review.ownerResponse.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-[#4B5563]">{review.ownerResponse.content}</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-3">
                                  <button className="flex items-center gap-1 text-[#6B7280] hover:text-[#0057ff] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                                    </svg>
                                    <span className="text-sm font-medium">{review.helpfulCount} người thấy đánh giá này có ích</span>
                                  </button>
                                </div>

                                <div className="flex gap-2 text-xs">
                                  <span className="text-[#6B7280]">Bởi {review.guestName || 'Khách'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      </div>
    </CustomerOnlyRoute>
  );
}
