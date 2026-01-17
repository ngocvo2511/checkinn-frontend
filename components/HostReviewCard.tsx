'use client';

import { useState } from 'react';
import { Review, reviewApi } from '@/lib/api/reviews';
import { Star, User, MessageSquare, Send, Edit2, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface HostReviewCardProps {
  review: Review;
  onResponseAdded: () => void;
}

export function HostReviewCard({ review, onResponseAdded }: HostReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(review.ownerResponse?.content || '');

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-100';
    if (rating >= 6) return 'text-blue-600 bg-blue-100';
    if (rating >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return 'Xuất sắc';
    if (rating >= 8) return 'Tuyệt vời';
    if (rating >= 7) return 'Rất tốt';
    if (rating >= 6) return 'Tốt';
    if (rating >= 5) return 'Khá';
    return 'Trung bình';
  };

  const handleSubmitResponse = async () => {
    if (!responseContent.trim()) {
      setError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập lại');
        return;
      }

      await reviewApi.addReviewResponse(
        review.id,
        { content: responseContent },
        token
      );

      setResponseContent('');
      setShowResponseForm(false);
      onResponseAdded();
    } catch (err: any) {
      console.error('Error submitting response:', err);
      setError(err.message || 'Không thể gửi phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateResponse = async () => {
    if (!editContent.trim()) {
      setError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token || !review.ownerResponse) {
        setError('Vui lòng đăng nhập lại');
        return;
      }

      await reviewApi.updateReviewResponse(
        review.ownerResponse.id,
        { content: editContent },
        token
      );

      setIsEditing(false);
      onResponseAdded();
    } catch (err: any) {
      console.error('Error updating response:', err);
      setError(err.message || 'Không thể cập nhật phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResponse = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token || !review.ownerResponse) {
        setError('Vui lòng đăng nhập lại');
        return;
      }

      await reviewApi.deleteReviewResponse(review.ownerResponse.id, token);
      onResponseAdded();
    } catch (err: any) {
      console.error('Error deleting response:', err);
      setError(err.message || 'Không thể xóa phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {/* Review Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Guest Avatar */}
            <div className="flex-shrink-0">
              {review.guestAvatar ? (
                <img
                  src={review.guestAvatar}
                  alt={review.guestName || 'Guest'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              )}
            </div>

            {/* Guest Info and Hotel */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {review.guestName || 'Khách hàng'}
                </h3>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
              </div>
              {review.hotelName && (
                <p className="text-sm text-gray-600 mb-2">
                  Khách sạn: <span className="font-medium">{review.hotelName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Rating Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getRatingColor(Number(review.rating))}`}>
            <span className="text-lg font-bold">{Number(review.rating).toFixed(1)}</span>
            <Star className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Rating Label */}
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(Number(review.rating))}`}>
            {getRatingLabel(Number(review.rating))}
          </span>
        </div>

        {/* Review Title */}
        {review.title && (
          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
        )}

        {/* Review Content */}
        <p className="text-gray-700 leading-relaxed">{review.content}</p>

        {/* Detailed Ratings (per criterion bars) */}
        {review.ratings && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-[#6B7280] mb-3">ĐÁNH GIÁ CHI TIẾT</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'cleanliness', label: 'Sạch sẽ', value: review.ratings.cleanliness },
                { key: 'comfort', label: 'Thoải mái', value: review.ratings.comfort },
                { key: 'location', label: 'Vị trí', value: review.ratings.location },
                { key: 'staff', label: 'Dịch vụ', value: review.ratings.staff },
                { key: 'amenities', label: 'Tiện nghi', value: review.ratings.amenities },
                { key: 'valueForMoney', label: 'Đáng tiền', value: review.ratings.valueForMoney },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#4B5563] w-24 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.value ? (item.value / 10) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-[#0F172A] w-10 text-right flex-shrink-0">{item.value?.toFixed(1) || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Owner Response Section */}
      <div className="p-6 bg-gray-50">
        {review.ownerResponse && !isEditing ? (
          // Existing Response
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Phản hồi của bạn</span>
                <span className="text-sm text-gray-500">
                  {review.ownerResponse.updatedAt && review.ownerResponse.updatedAt !== review.ownerResponse.createdAt
                    ? <>• đã cập nhật {formatDate(review.ownerResponse.updatedAt)}</>
                    : <>• {formatDate(review.ownerResponse.createdAt)}</>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(review.ownerResponse!.content);
                  }}
                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteResponse}
                  disabled={isSubmitting}
                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{review.ownerResponse.content}</p>
          </div>
        ) : isEditing ? (
          // Edit Response Form
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Chỉnh sửa phản hồi</span>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Nhập nội dung phản hồi..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdateResponse}
                disabled={isSubmitting || !editContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(review.ownerResponse!.content);
                  setError(null);
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
            </div>
          </div>
        ) : showResponseForm ? (
          // New Response Form
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Phản hồi đánh giá này</span>
            </div>
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder="Cảm ơn quý khách đã chia sẻ trải nghiệm. Chúng tôi rất trân trọng ý kiến của bạn..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !responseContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
              <button
                onClick={() => {
                  setShowResponseForm(false);
                  setResponseContent('');
                  setError(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          // Show Response Button
          <button
            onClick={() => setShowResponseForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Phản hồi đánh giá này
          </button>
        )}
      </div>
    </div>
  );
}
