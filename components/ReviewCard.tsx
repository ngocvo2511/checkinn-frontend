'use client';

import { useEffect, useState } from 'react';
import { Review, ReviewResponse, reviewApi, ReviewRatings } from '@/lib/api/reviews';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReviewCardProps {
  review: Review;
  ownerResponse?: ReviewResponse | null;
  onHelpful?: () => void;
  onUnhelpful?: () => void;
  canEdit?: boolean;
  canReply?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReplyAdded?: () => void;
}

const CRITERIA_LABELS = {
  staff: { label: 'Nhân viên', icon: '👥' },
  amenities: { label: 'Tiện nghi', icon: '🏊' },
  cleanliness: { label: 'Sạch sẽ', icon: '✨' },
  comfort: { label: 'Thoải mái', icon: '🛏️' },
  valueForMoney: { label: 'Giá trị', icon: '💰' },
  location: { label: 'Địa điểm', icon: '📍' },
};

const getRatingColor = (value: number) => {
  if (value >= 9) return 'text-green-600 bg-green-50';
  if (value >= 8) return 'text-blue-600 bg-blue-50';
  if (value >= 7) return 'text-cyan-600 bg-cyan-50';
  if (value >= 6) return 'text-yellow-600 bg-yellow-50';
  if (value >= 5) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
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

export default function ReviewCard({
  review,
  ownerResponse,
  onHelpful,
  onUnhelpful,
  canEdit = false,
  canReply = false,
  onEdit,
  onDelete,
  onReplyAdded,
}: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [response, setResponse] = useState<ReviewResponse | null>(ownerResponse ?? null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpfulCount);
  const [voted, setVoted] = useState<'helpful' | 'unhelpful' | null>(null);

  const handleMarkHelpful = async () => {
    if (voted === 'helpful') return;
    try {
      await reviewApi.markReviewHelpful(review.id);
      setHelpfulCount((prev) => prev + 1);
      if (voted === 'unhelpful') setUnhelpfulCount((prev) => prev - 1);
      setVoted('helpful');
      onHelpful?.();
    } catch (err) {
      console.error('Error marking helpful:', err);
    }
  };

  const handleMarkUnhelpful = async () => {
    if (voted === 'unhelpful') return;
    try {
      await reviewApi.markReviewUnhelpful(review.id);
      setUnhelpfulCount((prev) => prev + 1);
      if (voted === 'helpful') setHelpfulCount((prev) => prev - 1);
      setVoted('unhelpful');
      onUnhelpful?.();
    } catch (err) {
      console.error('Error marking unhelpful:', err);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      setReplyError('Nội dung trả lời không được để trống');
      return;
    }

    if (replyContent.length < 5) {
      setReplyError('Nội dung phải ít nhất 5 ký tự');
      return;
    }

    setLoadingReply(true);
    setReplyError(null);

    try {
      const newResponse = await reviewApi.addReviewResponse(
        review.id,
        { content: replyContent.trim() },
        '' // Token would be passed from parent
      );
      setResponse(newResponse);
      setReplyContent('');
      setShowReplyForm(false);
      onReplyAdded?.();
    } catch (err) {
      setReplyError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi trả lời'
      );
    } finally {
      setLoadingReply(false);
    }
  };

  // Sync local response state when prop updates (e.g., after async fetch of ownerResponse)
  useEffect(() => {
    setResponse(ownerResponse ?? null);
  }, [ownerResponse]);

  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Review Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {review.guestAvatar ? (
              <img
                src={review.guestAvatar}
                alt={review.guestName || 'Guest'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0057FF] to-[#003ABD] flex items-center justify-center text-white font-bold text-sm">
                {review.guestName?.[0]?.toUpperCase() || 'G'}
              </div>
            )}
            <div>
              <p className="font-semibold text-[#111827]">
                {review.guestName || 'Khách'}
              </p>
              <p className="text-xs text-[#9CA3AF]">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Overall Rating Badge */}
        <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl ${getRatingColor(review.rating)} border border-current/20`}>
          <span className="text-2xl font-bold">{review.rating.toFixed(1)}</span>
          <span className="text-xs font-semibold">{getRatingLabel(review.rating)}</span>
        </div>
      </div>

      {/* Detailed Ratings (if available) */}
      {review.ratings && (
        <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
          <p className="text-xs font-semibold text-[#6B7280] mb-3">ĐÁNH GIÁ CHI TIẾT</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(review.ratings).map(([key, value]) => {
              const criteria = CRITERIA_LABELS[key as keyof ReviewRatings];
              if (!criteria) return null;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-lg">{criteria.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#6B7280] truncate">{criteria.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-sm font-bold ${getRatingColor(value).split(' ')[0]}`}>
                        {value.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">/10</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Content */}
      <div className="mb-4">
        <h4 className="font-semibold text-[#111827] mb-2">{review.title}</h4>
        <p className="text-sm text-[#4B5563] leading-relaxed">{review.content}</p>
      </div>

      {/* Review Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-[#E5E7EB]">
        <button
          onClick={handleMarkHelpful}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            voted === 'helpful'
              ? 'text-[#0057FF]'
              : 'text-[#6B7280] hover:text-[#0057FF]'
          }`}
        >
          <span>👍</span>
          <span>Hữu ích ({helpfulCount})</span>
        </button>
        <button
          onClick={handleMarkUnhelpful}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            voted === 'unhelpful'
              ? 'text-[#EF4444]'
              : 'text-[#6B7280] hover:text-[#EF4444]'
          }`}
        >
          <span>👎</span>
          <span>Không hữu ích ({unhelpfulCount})</span>
        </button>

        {canEdit && (
          <>
            <button
              onClick={onEdit}
              className="text-sm font-medium text-[#0057FF] hover:underline"
            >
              Sửa
            </button>
            <button
              onClick={onDelete}
              className="text-sm font-medium text-[#EF4444] hover:underline"
            >
              Xóa
            </button>
          </>
        )}
      </div>

      {/* Owner Response */}
      {response ? (
        <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4 border-l-4 border-[#0057FF]">
          <p className="text-xs font-semibold text-[#0057FF] uppercase mb-2">
            Phản hồi từ chủ khách sạn
          </p>
          <div className="flex items-start gap-2 mb-2">
            {response.ownerAvatar ? (
              <img
                src={response.ownerAvatar}
                alt={response.ownerName || 'Owner'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-sm font-bold">
                {response.ownerName?.[0]?.toUpperCase() || 'O'}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#111827]">
                {response.ownerName || 'Chủ khách sạn'}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {response.updatedAt && response.updatedAt !== response.createdAt ? (
                  <>Đã cập nhật {formatDistanceToNow(new Date(response.updatedAt), { addSuffix: true, locale: vi })}</>
                ) : (
                  <>{formatDistanceToNow(new Date(response.createdAt), { addSuffix: true, locale: vi })}</>
                )}
              </p>
            </div>
          </div>
          <p className="text-sm text-[#4B5563]">{response.content}</p>
        </div>
      ) : canReply ? (
        <div className="bg-[#F9FAFB] rounded-lg p-4">
          {showReplyForm ? (
            <form onSubmit={handleSubmitReply} className="space-y-3">
              {replyError && (
                <p className="text-sm text-[#EF4444]">{replyError}</p>
              )}
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Viết phản hồi của bạn..."
                rows={3}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                maxLength={5000}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loadingReply}
                  className="flex-1 bg-[#0057FF] text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loadingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                    setReplyError(null);
                  }}
                  className="flex-1 border border-[#E5E7EB] text-[#374151] text-sm font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowReplyForm(true)}
              className="text-sm font-semibold text-[#0057FF] hover:underline w-full text-left"
            >
              Phản hồi đánh giá này
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
