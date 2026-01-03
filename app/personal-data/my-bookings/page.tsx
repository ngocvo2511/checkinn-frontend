'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReviewForm from '@/components/ReviewForm';
import ReviewSection from '@/components/ReviewSection';

interface Booking {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelImage: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: string; // COMPLETED, CANCELLED, PENDING
  createdAt: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');
    
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    setUserToken(token);
    setUserId(storedUserId || '');
    fetchMyBookings(token);
  }, [router]);

  const fetchMyBookings = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/bookings/my-bookings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.content || data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Đang tải đơn đặt phòng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn đặt phòng của tôi</h1>

        {completedBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Bạn chưa có đơn đặt phòng nào đã hoàn thành</p>
            <button
              onClick={() => router.push('/search')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Tìm kiếm khách sạn
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {completedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                  {/* Hotel Image */}
                  <div className="md:col-span-1">
                    <img
                      src={booking.hotelImage || '/placeholder-hotel.jpg'}
                      alt={booking.hotelName}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {booking.hotelName}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Check-in:</span> {new Date(booking.checkInDate).toLocaleDateString('vi-VN')}
                      </p>
                      <p>
                        <span className="font-medium">Check-out:</span> {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                      </p>
                      <p>
                        <span className="font-medium">Tổng tiền:</span> {booking.totalPrice.toLocaleString('vi-VN')} ₫
                      </p>
                      <p>
                        <span className="font-medium">Trạng thái:</span>{' '}
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Đã hoàn thành
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex flex-col justify-center gap-2">
                    <button
                      onClick={() => setSelectedBookingForReview(booking.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Viết đánh giá
                    </button>
                    <button
                      onClick={() => router.push(`/hotel/${booking.hotelId}`)}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                    >
                      Xem khách sạn
                    </button>
                  </div>
                </div>

                {/* Review Form Modal/Section */}
                {selectedBookingForReview === booking.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Viết đánh giá</h4>
                      <button
                        onClick={() => setSelectedBookingForReview(null)}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        ×
                      </button>
                    </div>
                    <ReviewForm
                      hotelId={booking.hotelId}
                      bookingId={booking.id}
                      userToken={userToken}
                      onSuccess={() => {
                        setSelectedBookingForReview(null);
                        // Có thể refresh danh sách hoặc navigate
                      }}
                      onCancel={() => setSelectedBookingForReview(null)}
                    />
                  </div>
                )}

                {/* Reviews Section */}
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Đánh giá cho khách sạn này</h4>
                  <ReviewSection
                    hotelId={booking.hotelId}
                    userToken={userToken}
                    userId={userId}
                    userRole="CUSTOMER"
                    ownerId=""
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
