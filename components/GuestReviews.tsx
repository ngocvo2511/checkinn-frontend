'use client';

import { useState, useEffect } from 'react';
import { hotelApi } from '@/lib/api/hotels';
import { reviewApi } from '@/lib/api/reviews';
import type { Review } from '@/lib/api/reviews';
import type { Hotel } from '@/lib/api/hotels';

interface ReviewWithHotel extends Review {
  hotelName?: string;
  hotelCity?: string;
}

export function GuestReviews() {
  const [reviews, setReviews] = useState<ReviewWithHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuestReviews = async () => {
      try {
        setLoading(true);
        
        // Fetch all cities from database
        const cities = await hotelApi.getCities();
        
        let allReviews: ReviewWithHotel[] = [];
        
        // Fetch hotels from all cities and get their reviews
        for (const city of cities) {
          try {
            const hotels = await hotelApi.searchHotelsByCity(city.id);
            
            // Fetch reviews for each hotel (max 2 per city to limit API calls)
            for (const hotel of hotels.slice(0, 2)) {
              try {
                const response = await reviewApi.getHotelReviews(hotel.id, 0, 3);
                const reviewsWithHotel = response.content
                  .filter((r) => r.status === 'PUBLISHED' && r.rating >= 4)
                  .map((r) => ({
                    ...r,
                    hotelName: hotel.name,
                    hotelCity: hotel.city?.name,
                  }));
                allReviews = allReviews.concat(reviewsWithHotel);
              } catch (err) {
                // Skip hotels with no reviews
              }
            }
          } catch (err) {
            // Skip cities with errors
            console.log(`Error fetching hotels from city ${city.name}, skipping...`);
          }
        }

        // Sort by date and take top 5
        const topReviews = allReviews
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setReviews(topReviews);
        setError(null);
      } catch (err) {
        console.error('Error fetching guest reviews:', err);
        setError('Không thể tải đánh giá');
      } finally {
        setLoading(false);
      }
    };

    fetchGuestReviews();
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-10">
        <h2 className="mb-8 text-3xl font-bold text-[#1F2226]">Đánh Giá Từ Khách Hàng</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-gray-200 h-32" />
          ))}
        </div>
      </section>
    );
  }

  if (error || reviews.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-10">
      <h2 className="mb-8 text-3xl font-bold text-[#1F2226]">Đánh Giá Từ Khách Hàng</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-[#E0E2E7] bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0057FF] text-sm font-bold text-white">
                  {review.guestName?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F2226]">
                    {review.guestName || 'Khách'}
                  </p>
                  <p className="text-xs text-[#8B94A4]">{review.hotelName}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={i < Math.round(review.rating) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    className={i < Math.round(review.rating) ? 'text-yellow-400' : 'text-[#E0E2E7]'}
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              {review.title && (
                <h4 className="mb-2 font-semibold text-[#1F2226]">{review.title}</h4>
              )}
              <p className="line-clamp-3 text-sm text-[#656F81]">{review.content}</p>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-[#E0E2E7] pt-3">
              <span className="text-xs text-[#8B94A4]">
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-xs text-[#8B94A4] transition hover:text-[#0057FF]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3v0a3 3 0 0 0-3 3v4M12 12v9m-6-9v9M3 18h18" />
                  </svg>
                  <span>Hữu ích ({review.helpfulCount})</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
