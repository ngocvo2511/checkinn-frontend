const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
  bookingId?: string;
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

export const reviewApi = {
  // Get all reviews for a hotel
  async getHotelReviews(hotelId: string, page: number = 0, size: number = 10): Promise<{
    content: Review[];
    totalPages: number;
    totalElements: number;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/hotel/${hotelId}?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }

    return response.json();
  },

  // Get review by ID
  async getReviewById(reviewId: string): Promise<Review> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/${reviewId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch review: ${response.statusText}`);
    }

    return response.json();
  },

  // Get review statistics for a hotel
  async getReviewStats(hotelId: string, token?: string): Promise<ReviewStats> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add userId if token is provided
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const userId = decodedPayload.userId || decodedPayload.sub;
        headers['X-User-Id'] = userId;
      } catch (e) {
        // Ignore token decode errors
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/stats/hotel/${hotelId}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch review stats: ${response.statusText}`);
    }

    return response.json();
  },

  // Check if booking has been reviewed and get review details
  async getReviewByBookingId(bookingId: string, token: string): Promise<Review | null> {
    try {
      // Decode JWT to get userId
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const userId = decodedPayload.userId || decodedPayload.sub;

      const response = await fetch(
        `${API_BASE_URL}/api/v1/reviews/check-booking/${bookingId}?userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        return null; // No review exists
      }

      if (!response.ok) {
        return null; // On error, assume no review
      }

      return response.json(); // Return full review details
    } catch (error) {
      console.error('Error fetching review:', error);
      return null;
    }
  },

  // Get user's own reviews by decoding JWT and filtering
  async getUserReviews(token: string, page: number = 0, size: number = 10): Promise<Review[]> {
    try {
      // Decode JWT to get userId
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(base64));
      const userId = decodedPayload.userId || decodedPayload.sub;

      if (!userId) {
        throw new Error('Cannot extract userId from token');
      }

      // Fetch reviews with userId filter - call backend with userId as query param
      const response = await fetch(
        `${API_BASE_URL}/api/v1/reviews/user/${userId}?page=${page}&size=${size}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to fetch user reviews:', response.statusText);
        return [];
      }

      const data = await response.json();
      return data.content || [];
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return [];
    }
  },

  // Check if booking has been reviewed
  async hasBookingBeenReviewed(bookingId: string, token: string): Promise<boolean> {
    const review = await this.getReviewByBookingId(bookingId, token);
    return review !== null;
  },

  // Create a new review
  async createReview(request: CreateReviewRequest, token: string): Promise<Review> {
    // Decode JWT to get userId
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const userId = decodedPayload.userId || decodedPayload.sub;

    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create review: ${error}`);
    }

    return response.json();
  },

  // Update review
  async updateReview(reviewId: string, request: UpdateReviewRequest, token: string): Promise<Review> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/${reviewId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update review: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete review
  async deleteReview(reviewId: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/${reviewId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete review: ${response.statusText}`);
    }
  },

  // Mark review as helpful
  async markReviewHelpful(reviewId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add userId if token is provided
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const userId = decodedPayload.userId || decodedPayload.sub;
        headers['X-User-Id'] = userId;
      } catch (e) {
        // Ignore token decode errors
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/${reviewId}/helpful`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark review helpful: ${response.statusText}`);
    }
  },

  // Mark review as unhelpful
  async markReviewUnhelpful(reviewId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add userId if token is provided
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const userId = decodedPayload.userId || decodedPayload.sub;
        headers['X-User-Id'] = userId;
      } catch (e) {
        // Ignore token decode errors
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/${reviewId}/unhelpful`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark review unhelpful: ${response.statusText}`);
    }
  },

  // Add response to review (owner)
  async addReviewResponse(reviewId: string, request: CreateReviewResponseRequest, token: string): Promise<ReviewResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/${reviewId}/response`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add response: ${response.statusText}`);
    }

    return response.json();
  },

  // Get response for a review
  async getReviewResponse(reviewId: string): Promise<ReviewResponse | null> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/${reviewId}/response`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data || null;
  },

  // Update response
  async updateReviewResponse(responseId: string, request: CreateReviewResponseRequest, token: string): Promise<ReviewResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/response/${responseId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update response: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete response
  async deleteReviewResponse(responseId: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reviews/response/${responseId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete response: ${response.statusText}`);
    }
  },
};
