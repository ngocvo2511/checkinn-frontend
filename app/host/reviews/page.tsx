'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useRouter } from 'next/navigation';
import { reviewApi, Review } from '@/lib/api/reviews';
import { hotelApi, Hotel } from '@/lib/api/hotels';
import { HostReviewCard } from '@/components/HostReviewCard';
import { Loader2, Star, MessageSquare, Filter, ChevronLeft, ChevronRight, List, LineChart, Sparkles, TrendingDown, Mail } from 'lucide-react';
import HostMenu from '@/components/host/menu/HostMenu';

export default function HostReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('all');
  const [responseFilter, setResponseFilter] = useState<'all' | 'responded' | 'pending'>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Load hotels on mount
  useEffect(() => {
    loadHostHotels();
  }, []);

  // Load reviews when hotel filter or page changes
  useEffect(() => {
    if (hotels.length > 0) {
      loadReviews();
    }
  }, [selectedHotelId, currentPage, hotels]);

  const loadHostHotels = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/host/login');
        return;
      }

      const hostHotels = await hotelApi.getHotelsByOwner(token);
      setHotels(hostHotels);
    } catch (err) {
      console.error('Error loading hotels:', err);
      setError('Không thể tải danh sách khách sạn');
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/host/login');
        return;
      }

      let response;
      if (selectedHotelId === 'all') {
        // Load all reviews for all hotels
        response = await reviewApi.getOwnerReviews(token, currentPage, pageSize);
      } else {
        // Load reviews for specific hotel
        response = await reviewApi.getOwnerHotelReviews(selectedHotelId, token, currentPage, pageSize);
      }

      // Enrich reviews with hotel names
      const enrichedReviews = response.content.map(review => {
        const hotel = hotels.find(h => h.id === review.hotelId);
        return {
          ...review,
          hotelName: hotel?.name || 'Unknown Hotel',
        };
      });

      setReviews(enrichedReviews);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseAdded = () => {
    // Reload reviews when a response is added
    loadReviews();
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + Number(review.rating), 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getResponseCount = () => {
    return reviews.filter(review => review.ownerResponse).length;
  };

  const getPendingCount = () => {
    return reviews.filter(review => !review.ownerResponse).length;
  };

  const getAverageCriterionRatings = () => {
    if (reviews.length === 0) {
      return {
        staff: 0,
        amenities: 0,
        cleanliness: 0,
        comfort: 0,
        valueForMoney: 0,
        location: 0,
      };
    }

    const sum = {
      staff: 0,
      amenities: 0,
      cleanliness: 0,
      comfort: 0,
      valueForMoney: 0,
      location: 0,
    };

    reviews.forEach(review => {
      if (review.ratings) {
        sum.staff += review.ratings.staff || 0;
        sum.amenities += review.ratings.amenities || 0;
        sum.cleanliness += review.ratings.cleanliness || 0;
        sum.comfort += review.ratings.comfort || 0;
        sum.valueForMoney += review.ratings.valueForMoney || 0;
        sum.location += review.ratings.location || 0;
      }
    });

    return {
      staff: (sum.staff / reviews.length),
      amenities: (sum.amenities / reviews.length),
      cleanliness: (sum.cleanliness / reviews.length),
      comfort: (sum.comfort / reviews.length),
      valueForMoney: (sum.valueForMoney / reviews.length),
      location: (sum.location / reviews.length),
    };
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return 'Xuất sắc';
    if (rating >= 8) return 'Rất tốt';
    if (rating >= 7) return 'Tốt';
    if (rating >= 6) return 'Khá';
    if (rating >= 5) return 'Trung bình';
    if (rating >= 4) return 'Tệ';
    return 'Rất tệ';
  };

  const getFilteredReviews = () => {
    if (responseFilter === 'responded') {
      return reviews.filter(r => !!r.ownerResponse);
    }
    if (responseFilter === 'pending') {
      return reviews.filter(r => !r.ownerResponse);
    }
    return reviews;
  };

  const getRatingDistribution = () => {
    const distribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      distribution[i] = reviews.filter(r => Math.round(r.rating) === i).length;
    }
    return distribution;
  };

  const getCriterionPerformance = () => {
    const avgRatings = getAverageCriterionRatings();
    return [
      { name: 'Sạch sẽ', value: avgRatings.cleanliness },
      { name: 'Thoải mái', value: avgRatings.comfort },
      { name: 'Vị trí', value: avgRatings.location },
      { name: 'Dịch vụ', value: avgRatings.staff },
      { name: 'Tiện nghi', value: avgRatings.amenities },
      { name: 'Đáng tiền', value: avgRatings.valueForMoney },
    ].sort((a, b) => b.value - a.value);
  };

  const getResponseMetrics = () => {
    const responded = getResponseCount();
    const total = reviews.length;
    const responseRate = total > 0 ? ((responded / total) * 100).toFixed(1) : '0';
    
    // Calculate average response time (days)
    const responseTimes: number[] = [];
    reviews.forEach(review => {
      if (review.ownerResponse?.createdAt) {
        const reviewDate = new Date(review.createdAt).getTime();
        const responseDate = new Date(review.ownerResponse.createdAt).getTime();
        const daysDiff = (responseDate - reviewDate) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 0) {
          responseTimes.push(daysDiff);
        }
      }
    });
    
    const avgResponseDays = responseTimes.length > 0 
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
      : '—';
    
    return { responseRate, avgResponseDays, responded, total };
  };

  const getRatingTrend = () => {
    if (reviews.length === 0) return [];
    
    // Group reviews by month
    const monthlyData: Record<string, { total: number; sum: number; count: number }> = {};
    
    reviews.forEach(review => {
      const date = new Date(review.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, sum: 0, count: 0 };
      }
      monthlyData[monthKey].sum += Number(review.rating);
      monthlyData[monthKey].count += 1;
    });
    
    // Convert to array and sort by date
    const trend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        average: data.sum / data.count,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
    
    return trend;
  };

  const getTrendDirection = () => {
    const trend = getRatingTrend();
    if (trend.length < 2) return { direction: 'stable', change: 0 };
    
    const latest = trend[trend.length - 1].average;
    const previous = trend[trend.length - 2].average;
    const change = ((latest - previous) / previous) * 100;
    
    if (Math.abs(change) < 2) return { direction: 'stable', change: 0 };
    return { direction: change > 0 ? 'up' : 'down', change };
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <HostMenu />
      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl">
          
          <div className="space-y-6">
            {/* Compact Header with Tabs */}
            <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
                    Quản lý đánh giá
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold">Đánh giá khách hàng</h1>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-2 border-t border-white/20 pt-4">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'list'
                      ? 'bg-white text-[#0B1B3F]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Danh sách</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-white text-[#0B1B3F]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LineChart className="w-4 h-4" />
                  <span>Thống kê & Phân tích</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-[#E8E9F1] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8B94A4]">Tổng đánh giá</p>
                    <p className="text-2xl font-semibold text-[#1F2226] mt-2">{totalElements}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8E9F1] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8B94A4]">Điểm trung bình</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-2xl font-semibold text-[#1F2226]">{getAverageRating()}</p>
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8E9F1] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8B94A4]">Đã phản hồi</p>
                    <p className="text-2xl font-semibold text-green-600 mt-2">{getResponseCount()}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8E9F1] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8B94A4]">Chờ phản hồi</p>
                    <p className="text-2xl font-semibold text-orange-600 mt-2">{getPendingCount()}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Average Rating Summary */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  {/* Score */}
                  <div className="text-center md:text-left flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl md:text-6xl font-bold text-[#0F172A]">
                        {Number(getAverageRating()).toFixed(1)}
                      </div>
                      <div className="text-left">
                        <p className="text-3xl font-semibold text-green-600">
                          {getRatingLabel(Number(getAverageRating()))}
                        </p>
                        <p className="text-base font-semibold text-[#6B7280]">
                          Dựa trên {reviews.length} đánh giá
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Ratings */}
                  <div className="flex-1 max-w-2xl">
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { key: 'cleanliness', label: 'Sạch sẽ', value: getAverageCriterionRatings().cleanliness },
                        { key: 'comfort', label: 'Thoải mái', value: getAverageCriterionRatings().comfort },
                        { key: 'location', label: 'Vị trí', value: getAverageCriterionRatings().location },
                        { key: 'staff', label: 'Dịch vụ', value: getAverageCriterionRatings().staff },
                        { key: 'amenities', label: 'Tiện nghi', value: getAverageCriterionRatings().amenities },
                        { key: 'valueForMoney', label: 'Đáng tiền', value: getAverageCriterionRatings().valueForMoney },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[#4B5563] w-20 flex-shrink-0">{item.label}</span>
                          <div className="flex-1 bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.value ? (item.value / 10) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-[#0F172A] w-8 text-right flex-shrink-0">{item.value?.toFixed(1) || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Section (shared) */}
            {!loading && !error && (
              <div className="bg-white rounded-xl border border-[#E8E9F1] p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <label htmlFor="hotel-filter" className="text-sm font-medium text-gray-700">
                      Chọn khách sạn:
                    </label>
                  </div>
                  <select
                    id="hotel-filter"
                    value={selectedHotelId}
                    onChange={(e) => {
                      setSelectedHotelId(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="flex-1 min-w-[220px] max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả khách sạn</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>

                  {activeTab === 'list' && (
                    <>
                      <div className="hidden sm:block h-6 w-px bg-gray-200" />
                      <label htmlFor="response-filter" className="text-sm font-medium text-gray-700">
                        Trạng thái phản hồi:
                      </label>
                      <select
                        id="response-filter"
                        value={responseFilter}
                        onChange={(e) => setResponseFilter(e.target.value as 'all' | 'responded' | 'pending')}
                        className="max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">Tất cả</option>
                        <option value="responded">Đã phản hồi ({getResponseCount()})</option>
                        <option value="pending">Chờ phản hồi ({getPendingCount()})</option>
                      </select>
                    </>
                  )}
                </div>
                {activeTab === 'analytics' && (
                  <p className="mt-3 text-xs text-gray-500">Bộ lọc này áp dụng cho toàn bộ thống kê (xu hướng, điểm mạnh/yếu, phản hồi).</p>
                )}
              </div>
            )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Reviews List */}
        {!loading && !error && activeTab === 'list' && reviews.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có đánh giá nào
            </h3>
            <p className="text-gray-600">
              Các đánh giá từ khách hàng sẽ hiển thị ở đây
            </p>
          </div>
        )}

        {!loading && !error && activeTab === 'list' && reviews.length > 0 && (
          <>
            <div className="space-y-4">
              {getFilteredReviews().map((review) => (
                <HostReviewCard
                  key={review.id}
                  review={review}
                  onResponseAdded={handleResponseAdded}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{currentPage * pageSize + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * pageSize, totalElements)}
                  </span>{' '}
                  trong tổng số <span className="font-medium">{totalElements}</span> đánh giá
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {!loading && !error && activeTab === 'analytics' && (
          <>
            {/* Rating Trend */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                    <LineChart className="w-4 h-4" />
                    <span>Xu hướng đánh giá</span>
                  </h3>
                  <p className="text-sm text-[#6B7280] mt-1">6 tháng gần đây</p>
                </div>
                {getRatingTrend().length >= 2 && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    getTrendDirection().direction === 'up' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : getTrendDirection().direction === 'down'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    {getTrendDirection().direction === 'up' && <span>↗ +{Math.abs(getTrendDirection().change).toFixed(1)}%</span>}
                    {getTrendDirection().direction === 'down' && <span>↘ -{Math.abs(getTrendDirection().change).toFixed(1)}%</span>}
                    {getTrendDirection().direction === 'stable' && <span>→ Ổn định</span>}
                  </div>
                )}
              </div>
              
              {getRatingTrend().length > 0 ? (
                <>
                  {/* Chart Area (Recharts) */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart
                        data={getRatingTrend().map((item) => ({
                          date: new Date(item.month + '-01').toLocaleDateString('vi-VN', { month: 'short' }),
                          avg: Number(item.average.toFixed(2)),
                        }))}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip formatter={(value) => `${value}/10`} labelFormatter={(label) => `Tháng ${label}`} />
                        <Line type="monotone" dataKey="avg" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Tháng này</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getRatingTrend()[getRatingTrend().length - 1]?.average.toFixed(1)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Cao nhất</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.max(...getRatingTrend().map(t => t.average)).toFixed(1)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Thấp nhất</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.min(...getRatingTrend().map(t => t.average)).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Chưa có đủ dữ liệu</p>
                </div>
              )}
            </div>

            {/* Criterion Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Điểm mạnh</span>
                </h3>
                <div className="space-y-4">
                  {getCriterionPerformance().slice(0, 3).map((criterion, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-[#0F172A]">{criterion.name}</span>
                      <span className="text-lg font-bold text-green-600">{criterion.value.toFixed(1)}/10</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs Improvement */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  <span>Cần cải thiện</span>
                </h3>
                <div className="space-y-4">
                  {getCriterionPerformance().slice(-3).reverse().map((criterion, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-[#0F172A]">{criterion.name}</span>
                      <span className="text-lg font-bold text-orange-600">{criterion.value.toFixed(1)}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Response Metrics */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Số liệu phản hồi</span>
              </h3>
              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-[#6B7280] mb-2">Tỷ lệ phản hồi</p>
                    <p className="text-4xl font-bold text-blue-600">{getResponseMetrics().responseRate}%</p>
                    <p className="text-xs text-[#6B7280] mt-2">{getResponseMetrics().responded}/{getResponseMetrics().total} đánh giá</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-[#6B7280] mb-2">Thời gian phản hồi trung bình</p>
                    <p className="text-4xl font-bold text-green-600">{getResponseMetrics().avgResponseDays}</p>
                    <p className="text-xs text-[#6B7280] mt-2">ngày</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-[#6B7280] mb-2">Tổng đánh giá</p>
                    <p className="text-4xl font-bold text-purple-600">{reviews.length}</p>
                    <p className="text-xs text-[#6B7280] mt-2">trên trang hiện tại</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-[#6B7280]">Chưa có đánh giá để hiển thị thống kê</p>
              )}
            </div>
          </>
        )}
      </div>
        </div>
      </main>
    </div>
  );
}
