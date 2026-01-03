'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import { Review, ReviewStats, reviewApi } from '@/lib/api/reviews';

interface ReviewSectionProps {
  hotelId: string;
  userToken?: string;
  userId?: string;
  userRole?: string;
  ownerId?: string;
}

export default function ReviewSection({
  hotelId,
  userToken,
  userId,
  userRole,
  ownerId,
}: ReviewSectionProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const router = useRouter();

  const isOwner = ownerId && userId === ownerId;

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch stats
        const statsData = await reviewApi.getReviewStats(hotelId);
        setStats(statsData);

        // Fetch paginated reviews
        const reviewsData = await reviewApi.getHotelReviews(hotelId, currentPage, 10);
        let sortedReviews = [...reviewsData.content];

        // Apply sorting
        if (sortBy === 'helpful') {
          sortedReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
        } else if (sortBy === 'rating') {
          sortedReviews.sort((a, b) => b.rating - a.rating);
        } else {
          sortedReviews.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        setReviews(sortedReviews);
        setTotalPages(reviewsData.totalPages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải đánh giá'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [hotelId, currentPage, sortBy]);

  const handleRefresh = async () => {
    setCurrentPage(0);
    // Refresh will happen via useEffect
  };

  const getRatingPercentage = (count: number, total: number) => {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  };

  const getRatingColor = (value: number) => {
    if (value >= 9) return 'from-green-500 to-green-600';
    if (value >= 8) return 'from-blue-500 to-blue-600';
    if (value >= 7) return 'from-cyan-500 to-cyan-600';
    if (value >= 6) return 'from-yellow-500 to-yellow-600';
    if (value >= 5) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
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

  // Rating distribution for 10-point scale
  const ratingDistribution = stats
    ? [
        { score: 10, count: stats.ratingDistribution10 || 0 },
        { score: 9, count: stats.ratingDistribution9 || 0 },
        { score: 8, count: stats.ratingDistribution8 || 0 },
        { score: 7, count: stats.ratingDistribution7 || 0 },
        { score: 6, count: stats.ratingDistribution6 || 0 },
        { score: 5, count: stats.ratingDistribution5 || 0 },
        { score: 4, count: stats.ratingDistribution4 || 0 },
        { score: 3, count: stats.ratingDistribution3 || 0 },
        { score: 2, count: stats.ratingDistribution2 || 0 },
        { score: 1, count: stats.ratingDistribution1 || 0 },
      ].map(item => ({
        ...item,
        percentage: getRatingPercentage(item.count, stats.totalReviews)
      }))
    : [];

  if (loading && !stats) {
    return (
      <section className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 py-10">
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-8">
        Đánh giá khách sạn
      </h2>

      {/* Rating Overview */}
      {stats && stats.totalReviews > 0 && (
        <div className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left: Main Rating */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#F0F5FF] to-[#E0EAFF] rounded-2xl p-8 shadow-lg">
              <div className={`text-6xl md:text-7xl font-bold bg-gradient-to-r ${getRatingColor(stats.averageRating)} bg-clip-text text-transparent mb-3`}>
                {stats.averageRating.toFixed(1)}
              </div>
              <p className={`text-xl font-semibold mb-3 ${getRatingColor(stats.averageRating).includes('green') ? 'text-green-600' : 
                getRatingColor(stats.averageRating).includes('blue') ? 'text-blue-600' : 
                getRatingColor(stats.averageRating).includes('cyan') ? 'text-cyan-600' : 
                getRatingColor(stats.averageRating).includes('yellow') ? 'text-yellow-600' : 
                getRatingColor(stats.averageRating).includes('orange') ? 'text-orange-600' : 'text-red-600'}`}>
                {getRatingLabel(stats.averageRating)}
              </p>
              <p className="text-sm text-[#6B7280] font-semibold">
                Dựa trên {stats.totalReviews} đánh giá
              </p>
            </div>

            {/* Right: Rating Distribution */}
            <div className="lg:col-span-2 space-y-2.5">
              <p className="text-sm font-bold text-[#374151] mb-4">PHÂN BỐ ĐIỂM ĐÁNH GIÁ</p>
              {ratingDistribution.map(({ score, count, percentage }) => (
                <div key={score} className="flex items-center gap-3">
                  <div className="w-16 text-right">
                    <p className="text-sm font-semibold text-[#374151]">
                      {score} điểm
                    </p>
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getRatingColor(score)} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-16 flex items-center gap-1.5">
                    <p className="text-sm text-[#6B7280] font-medium">{percentage}%</p>
                    <span className="text-xs text-gray-400">({count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Criteria Averages */}
          {stats.averageStaffRating && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <p className="text-sm font-bold text-[#374151] mb-4">ĐIỂM TRUNG BÌNH THEO TIÊU CHÍ</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { key: 'averageStaffRating', label: 'Nhân viên', icon: '👥' },
                  { key: 'averageAmenitiesRating', label: 'Tiện nghi', icon: '🏊' },
                  { key: 'averageCleanlinessRating', label: 'Sạch sẽ', icon: '✨' },
                  { key: 'averageComfortRating', label: 'Thoải mái', icon: '🛏️' },
                  { key: 'averageValueForMoneyRating', label: 'Giá trị', icon: '💰' },
                  { key: 'averageLocationRating', label: 'Địa điểm', icon: '📍' },
                ].map((criteria) => {
                  const value = stats[criteria.key as keyof ReviewStats] as number || 0;
                  if (value === 0) return null;
                  return (
                    <div key={criteria.key} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{criteria.icon}</span>
                        <p className="text-xs font-medium text-[#6B7280]">{criteria.label}</p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${getRatingColor(value).includes('green') ? 'text-green-600' : 
                          getRatingColor(value).includes('blue') ? 'text-blue-600' : 
                          getRatingColor(value).includes('cyan') ? 'text-cyan-600' : 
                          getRatingColor(value).includes('yellow') ? 'text-yellow-600' : 
                          getRatingColor(value).includes('orange') ? 'text-orange-600' : 'text-red-600'}`}>
                          {value.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400">/10</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {userToken && !isOwner && (
        <button
          onClick={() => router.push(`/reviews/new?hotelId=${hotelId}`)}
          className="mb-8 px-6 py-3 bg-[#0057FF] text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Viết đánh giá
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-8 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Sort Controls */}
      {reviews.length > 0 && (
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-semibold text-[#374151]">
            Sắp xếp:
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'recent' | 'helpful' | 'rating');
              setCurrentPage(0);
            }}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
          >
            <option value="recent">Mới nhất</option>
            <option value="helpful">Hữu ích nhất</option>
            <option value="rating">Xếp hạng cao nhất</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <>
          <div className="space-y-4 mb-8">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                canReply={isOwner || false}
                onReplyAdded={handleRefresh}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-[#E5E7EB] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trang trước
              </button>
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                      currentPage === i
                        ? 'bg-[#0057FF] text-white'
                        : 'border border-[#E5E7EB] hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 border border-[#E5E7EB] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-[#6B7280] mb-4">
            Chưa có đánh giá nào cho khách sạn này
          </p>
          {userToken && (
            <p className="text-sm text-[#9CA3AF]">
              Hãy là người đầu tiên để lại đánh giá
            </p>
          )}
        </div>
      )}
    </section>
  );
}
