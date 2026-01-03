'use client';

import { useState, useEffect } from 'react';
import { reviewApi, ReviewRatings } from '@/lib/api/reviews';
import { CheckCircle } from 'lucide-react';

interface ReviewFormProps {
  hotelId: string;
  bookingId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  userToken?: string;
}

interface CriteriaInfo {
  key: keyof ReviewRatings;
  label: string;
  icon: string;
}

const RATING_CRITERIA: CriteriaInfo[] = [
  { key: 'staff', label: 'Nhân viên phục vụ', icon: '👥' },
  { key: 'amenities', label: 'Tiện nghi', icon: '🏊' },
  { key: 'cleanliness', label: 'Sạch sẽ', icon: '✨' },
  { key: 'comfort', label: 'Thoải mái', icon: '🛏️' },
  { key: 'valueForMoney', label: 'Đáng giá tiền', icon: '💰' },
  { key: 'location', label: 'Địa điểm', icon: '📍' },
];

export default function ReviewForm({ 
  hotelId, 
  bookingId,
  onSuccess, 
  onCancel,
  userToken 
}: ReviewFormProps) {
  const [ratings, setRatings] = useState<ReviewRatings>({
    staff: 8,
    amenities: 8,
    cleanliness: 8,
    comfort: 8,
    valueForMoney: 8,
    location: 8,
  });
  const [averageRating, setAverageRating] = useState(8);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Tính điểm trung bình tự động
  useEffect(() => {
    const total = Object.values(ratings).reduce((sum, val) => sum + val, 0);
    const avg = Math.round((total / 6) * 10) / 10;
    setAverageRating(avg);
  }, [ratings]);

  const handleRatingChange = (criteria: keyof ReviewRatings, value: number) => {
    setRatings(prev => ({ ...prev, [criteria]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Tiêu đề và nội dung không được để trống');
      return;
    }

    if (title.length < 5) {
      setError('Tiêu đề phải ít nhất 5 ký tự');
      return;
    }

    if (content.length < 10) {
      setError('Nội dung phải ít nhất 10 ký tự');
      return;
    }

    if (!userToken) {
      setError('Vui lòng đăng nhập để đánh giá');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await reviewApi.createReview(
        {
          hotelId,
          rating: averageRating,
          staffRating: ratings.staff,
          amenitiesRating: ratings.amenities,
          cleanlinessRating: ratings.cleanliness,
          comfortRating: ratings.comfort,
          valueForMoneyRating: ratings.valueForMoney,
          locationRating: ratings.location,
          title: title.trim(),
          content: content.trim(),
          bookingId: bookingId || '',
        },
        userToken
      );

      setSuccess(true);
      // Don't clear form or auto-redirect, let user see the success modal
      // and click button to go back
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi đánh giá'
      );
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (value: number) => {
    if (value >= 9) return 'Xuất sắc';
    if (value >= 8) return 'Rất tốt';
    if (value >= 7) return 'Tốt';
    if (value >= 6) return 'Khá';
    if (value >= 5) return 'Trung bình';
    if (value >= 4) return 'Tệ';
    return 'Rất tệ';
  };

  const getRatingColor = (value: number) => {
    if (value >= 9) return 'text-green-600';
    if (value >= 8) return 'text-blue-600';
    if (value >= 7) return 'text-cyan-600';
    if (value >= 6) return 'text-yellow-600';
    if (value >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Đánh giá thành công!
            </h3>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã chia sẻ trải nghiệm. Đánh giá của bạn sẽ giúp người khác có lựa chọn tốt hơn.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                onSuccess?.();
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Quay lại lịch sử đặt phòng
            </button>
          </div>
        </div>
      )}

    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
        Chia sẻ đánh giá của bạn
      </h3>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-700 font-semibold">
            ✓ Cảm ơn bạn! Đánh giá của bạn đã được gửi thành công.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Điểm trung bình tổng thể */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-[#0F172A]">
              Điểm tổng thể
            </h4>
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-bold ${getRatingColor(averageRating)}`}>
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-gray-500">/10</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            <span className={`font-semibold ${getRatingColor(averageRating)}`}>
              {getRatingLabel(averageRating)}
            </span>
            {' - '}Điểm được tính tự động từ 6 tiêu chí bên dưới
          </p>
        </div>

        {/* Các tiêu chí đánh giá chi tiết */}
        <div className="space-y-5">
          <h4 className="text-base font-semibold text-[#0F172A] mb-3">
            Đánh giá chi tiết <span className="text-red-600">*</span>
          </h4>
          
          {RATING_CRITERIA.map((criteria) => (
            <div key={criteria.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#374151] flex items-center gap-2">
                  <span className="text-xl">{criteria.icon}</span>
                  {criteria.label}
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getRatingColor(ratings[criteria.key])}`}>
                    {ratings[criteria.key].toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">/10</span>
                </div>
              </div>
              
              {/* Discrete pill selector */}
              <div className="flex flex-wrap gap-2">
                {[...Array(10)].map((_, idx) => {
                  const value = idx + 1;
                  const isActive = Math.abs(ratings[criteria.key] - value) < 0.25;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRatingChange(criteria.key, value)}
                      className={`px-3 py-2 rounded-full text-sm font-semibold border transition-all shadow-sm
                        ${isActive
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-blue-600 scale-105'
                          : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-blue-400 hover:text-blue-600'}
                      `}
                      aria-label={`${criteria.label} ${value} điểm`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>

              {/* Nhãn mô tả */}
              <p className={`text-xs font-medium ${getRatingColor(ratings[criteria.key])}`}>
                {getRatingLabel(ratings[criteria.key])}
              </p>
            </div>
          ))}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-[#374151] mb-2">
            Tiêu đề <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Khách sạn tuyệt vời với dịch vụ tốt"
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
            maxLength={255}
          />
          <p className="text-xs text-[#9CA3AF] mt-1">
            {title.length}/255 ký tự
          </p>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-[#374151] mb-2">
            Nội dung <span className="text-red-600">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn tại khách sạn này..."
            rows={4}
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
            maxLength={5000}
          />
          <p className="text-xs text-[#9CA3AF] mt-1">
            {content.length}/5000 ký tự
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#0057FF] text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-[#E5E7EB] text-[#374151] font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          )}
        </div>

        <p className="text-xs text-[#9CA3AF] text-center">
          Các đánh giá giúp khác biệt chúng tôi về các khách sạn tốt nhất
        </p>
      </form>
    </div>
    </>
  );
}
