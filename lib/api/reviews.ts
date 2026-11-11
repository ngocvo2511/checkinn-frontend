const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Transform flat rating fields from API into nested ratings object
function normalizeReviewRatings(review: any): Review {
  if (!review.ratings && (review.staffRating || review.amenitiesRating || review.cleanlinessRating || review.comfortRating || review.valueForMoneyRating || review.locationRating)) {
    return {
      ...review,
      ratings: {
        staff: review.staffRating,
        amenities: review.amenitiesRating,
        cleanliness: review.cleanlinessRating,
        comfort: review.comfortRating,
        valueForMoney: review.valueForMoneyRating,
        location: review.locationRating,
      },
    };
  }
  return review;
}

// ==========================================
// TYPES
// ==========================================

export interface ReviewRatings {
  staff: number;           // Nhân viên phục vụ
  amenities: number;       // Tiện nghi
  cleanliness: number;     // Sạch sẽ
  comfort: number;         // Thoải mái
  valueForMoney: number;   // Đáng giá tiền
  location: number;        // Địa điểm
}

export interface Review {
  id: string;
  hotelId: string;
  guestId: string;
  bookingId?: string;
  rating: number;  // Điểm trung bình từ 1-10
  ratings?: ReviewRatings;  // Các tiêu chí chi tiết từ 1-10
  title: string;
  content: string;
  helpfulCount: number;
  unhelpfulCount: number;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  guestName?: string;
  guestAvatar?: string;
  userFeedback?: 'HELPFUL' | 'UNHELPFUL' | null; // Current user's feedback
  ownerResponse?: ReviewResponse; // Owner's response to this review
  hotelName?: string; // For owner's view of all their hotels' reviews
}

export interface ReviewStats {
  hotelId: string;
  averageRating: number;  // Điểm trung bình tổng thể (1-10)
  totalReviews: number;
  // Phân bố theo điểm từ 1-10
  ratingDistribution1: number;
  ratingDistribution2: number;
  ratingDistribution3: number;
  ratingDistribution4: number;
  ratingDistribution5: number;
  ratingDistribution6: number;
  ratingDistribution7: number;
  ratingDistribution8: number;
  ratingDistribution9: number;
  ratingDistribution10: number;
  // Điểm trung bình cho từng tiêu chí
  averageStaffRating?: number;
  averageAmenitiesRating?: number;
  averageCleanlinessRating?: number;
  averageComfortRating?: number;
  averageValueForMoneyRating?: number;
  averageLocationRating?: number;
  recentReviews: Review[];
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  ownerId: string;
  content: string;
  ownerName?: string;
  ownerAvatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  hotelId: string;
  rating: number;  // Điểm tổng thể 1-10
  staffRating?: number;
  amenitiesRating?: number;
  cleanlinessRating?: number;
  comfortRating?: number;
  valueForMoneyRating?: number;
  locationRating?: number;
  title: string;
  content: string;
  bookingId: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  ratings?: ReviewRatings;
  title?: string;
  content?: string;
}

export interface CreateReviewResponseRequest {
  content: string;
}

// ==========================================
// API CLIENT
// ==========================================

export interface ReviewPage { content: Review[]; totalPages: number; totalElements: number }

export class ReviewApiError extends Error {
  readonly status: number | null;
  constructor(status: number | null) {
    super(status === 401 ? 'Vui lòng đăng nhập để thao tác với đánh giá.'
      : status === 403 ? 'Bạn không có quyền thao tác với đánh giá này.'
      : status === 404 ? 'Không tìm thấy đánh giá.'
      : status === 409 ? 'Đánh giá hoặc phản hồi đã thay đổi. Vui lòng tải lại.'
      : status === 400 ? 'Thông tin đánh giá không hợp lệ.'
      : 'Không thể xác nhận dữ liệu đánh giá lúc này. Vui lòng tải lại trước khi gửi tiếp.');
    this.name = 'ReviewApiError'; this.status = status;
  }
}

async function request<T>(path: string, token?: string, method = 'GET', body?: unknown, absent = false): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/reviews${path}`, {
      method, headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
      body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      if (absent && response.status === 404) return null as T;
      throw new ReviewApiError(response.status);
    }
    if (method === 'DELETE' || path.endsWith('/helpful') || path.endsWith('/unhelpful') || response.status === 204) return undefined as T;
    const data = await response.json();
    if (path.startsWith('/check-booking/') && data == null) throw new ReviewApiError(null);
    return data;
  } catch (error) { throw error instanceof ReviewApiError ? error : new ReviewApiError(null); }
  finally { clearTimeout(timer); }
}
async function reviewPage(path: string, token?: string): Promise<ReviewPage> {
  const data = await request<ReviewPage>(path, token);
  if (!data || !Array.isArray(data.content) || !Number.isInteger(data.totalPages) || data.totalPages < 0
      || !Number.isInteger(data.totalElements) || data.totalElements < 0) throw new ReviewApiError(null);
  return {...data, content: data.content.map(normalizeReviewRatings)};
}
const id = encodeURIComponent;
export const reviewApi = {
  getHotelReviews(hotelId: string, page = 0, size = 10): Promise<ReviewPage> {
    return reviewPage(`/hotel/${id(hotelId)}?page=${page}&size=${size}`);
  },
  async getReviewById(reviewId: string): Promise<Review> {
    return normalizeReviewRatings(await request<Review>(`/${id(reviewId)}`));
  },
  getReviewStats(hotelId: string, token?: string): Promise<ReviewStats> {
    return request(`/stats/hotel/${id(hotelId)}`, token);
  },
  async getReviewByBookingId(bookingId: string, token: string): Promise<Review | null> {
    const result = await request<Review | null>(`/check-booking/${id(bookingId)}`, token, 'GET', undefined, true);
    if (result && (typeof result.id !== 'string' || result.bookingId !== bookingId)) throw new ReviewApiError(null);
    return result ? normalizeReviewRatings(result) : null;
  },
  getMyReviewPage(token: string, page = 0, size = 10): Promise<ReviewPage> {
    return reviewPage(`/me?page=${page}&size=${size}`, token);
  },
  async getUserReviews(token: string, page = 0, size = 10): Promise<Review[]> {
    return (await this.getMyReviewPage(token, page, size)).content;
  },
  async hasBookingBeenReviewed(bookingId: string, token: string): Promise<boolean> {
    return (await this.getReviewByBookingId(bookingId, token)) !== null;
  },
  async createReview(body: CreateReviewRequest, token: string): Promise<Review> {
    if (!body.bookingId?.trim()) throw new Error('Booking is required to create a review');
    return normalizeReviewRatings(await request<Review>('', token, 'POST', body));
  },
  async updateReview(reviewId: string, body: UpdateReviewRequest, token: string): Promise<Review> {
    const {ratings, ...fields} = body;
    const payload = {...fields, ...(ratings ? {staffRating: ratings.staff, amenitiesRating: ratings.amenities,
      cleanlinessRating: ratings.cleanliness, comfortRating: ratings.comfort,
      valueForMoneyRating: ratings.valueForMoney, locationRating: ratings.location} : {})};
    return normalizeReviewRatings(await request<Review>(`/${id(reviewId)}`, token, 'PUT', payload));
  },
  deleteReview(reviewId: string, token: string): Promise<void> { return request(`/${id(reviewId)}`, token, 'DELETE'); },
  markReviewHelpful(reviewId: string, token?: string): Promise<void> { return request(`/${id(reviewId)}/helpful`, token, 'POST'); },
  markReviewUnhelpful(reviewId: string, token?: string): Promise<void> { return request(`/${id(reviewId)}/unhelpful`, token, 'POST'); },
  addReviewResponse(reviewId: string, body: CreateReviewResponseRequest, token: string): Promise<ReviewResponse> {
    return request(`/${id(reviewId)}/response`, token, 'POST', body);
  },
  getReviewResponse(reviewId: string): Promise<ReviewResponse | null> {
    return request(`/${id(reviewId)}/response`, undefined, 'GET', undefined, true);
  },
  updateReviewResponse(responseId: string, body: CreateReviewResponseRequest, token: string): Promise<ReviewResponse> {
    return request(`/response/${id(responseId)}`, token, 'PUT', body);
  },
  deleteReviewResponse(responseId: string, token: string): Promise<void> { return request(`/response/${id(responseId)}`, token, 'DELETE'); },
  getOwnerReviews(token: string, page = 0, size = 10): Promise<ReviewPage> {
    return reviewPage(`/owner/all?page=${page}&size=${size}`, token);
  },
  getOwnerHotelReviews(hotelId: string, token: string, page = 0, size = 10): Promise<ReviewPage> {
    return reviewPage(`/owner/hotel/${id(hotelId)}?page=${page}&size=${size}`, token);
  },
};
