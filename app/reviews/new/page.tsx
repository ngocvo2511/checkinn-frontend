'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReviewForm from '@/components/ReviewForm';
import { ArrowLeft, Hotel, Calendar } from 'lucide-react';
import { bookingApi } from '@/lib/api/booking';
import { hotelApi } from '@/lib/api/hotels';

interface BookingInfo {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelImage?: string;
  checkInDate: string;
  checkOutDate: string;
  roomType?: string;
}

function NewReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  const bookingId = searchParams.get('bookingId');
  const hotelId = searchParams.get('hotelId');

  useEffect(() => {
    // Get user token from localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    setUserToken(token);

    if (!bookingId || !hotelId) {
      router.push('/booking/history');
      return;
    }

    // Fetch booking details from API
    const fetchBookingInfo = async () => {
      try {
        const bookingData = await bookingApi.getBooking(bookingId);
        
        // Fetch hotel details to get the actual image from database
        let hotelImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
        try {
          const hotelData = await hotelApi.getHotelById(String(bookingData.hotelId));
          // Get thumbnail or first image from mediaAssets
          const thumbnail = hotelData.mediaAssets?.find(asset => asset.isThumbnail);
          const firstImage = hotelData.mediaAssets?.[0];
          hotelImage = thumbnail?.url || firstImage?.url || hotelImage;
        } catch (hotelError) {
          console.error('Error fetching hotel details:', hotelError);
          // Continue with default image
        }
        
        setBookingInfo({
          id: bookingData.id,
          hotelId: String(bookingData.hotelId),
          hotelName: bookingData.hotelName || 'Khách sạn',
          hotelImage: hotelImage,
          checkInDate: bookingData.checkInDate as string,
          checkOutDate: bookingData.checkOutDate as string,
          roomType: bookingData.items?.[0]?.roomTypeName || 'Phòng tiêu chuẩn',
        });
      } catch (error) {
        console.error('Error fetching booking info:', error);
        // Fallback: redirect back if can't load
        router.push('/booking/history');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingInfo();
  }, [bookingId, hotelId, router]);

  const handleSuccess = () => {
    // Redirect to booking history after successful review
    setTimeout(() => {
      router.push('/booking/history');
    }, 1500);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bookingInfo || !userToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để đánh giá</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Quay lại</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Viết đánh giá của bạn
          </h1>
          <p className="text-gray-600">
            Chia sẻ trải nghiệm của bạn để giúp người khác có lựa chọn tốt hơn
          </p>
        </div>

        {/* Booking Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="md:flex">
            {/* Hotel Image */}
            {bookingInfo.hotelImage && (
              <div className="md:w-80 flex-shrink-0">
                <img
                  src={bookingInfo.hotelImage}
                  alt={bookingInfo.hotelName}
                  className="w-full h-48 md:h-56 object-cover"
                />
              </div>
            )}

            {/* Booking Details */}
            <div className="flex-1 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Hotel className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {bookingInfo.hotelName}
                  </h2>
                  {bookingInfo.roomType && (
                    <p className="text-sm text-gray-600">{bookingInfo.roomType}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar size={18} className="text-gray-400" />
                <span className="text-sm">
                  {formatDate(bookingInfo.checkInDate)} - {formatDate(bookingInfo.checkOutDate)}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Mã đặt phòng: <span className="font-mono font-semibold">{bookingInfo.id.slice(0, 8)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <ReviewForm
              hotelId={bookingInfo.hotelId}
              bookingId={bookingInfo.id}
              userToken={userToken}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {/* Tips Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Mẹo viết đánh giá hữu ích
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Mô tả cụ thể những gì bạn thích và không thích</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Đánh giá theo từng tiêu chí để người đọc dễ hiểu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Chia sẻ trung thực nhưng lịch sự và mang tính xây dựng</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <NewReviewContent />
    </Suspense>
  );
}
