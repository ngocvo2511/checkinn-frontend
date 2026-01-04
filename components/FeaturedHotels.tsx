'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { hotelApi } from '@/lib/api/hotels';
import { reviewApi } from '@/lib/api/reviews';
import type { Hotel, ReviewStats } from '@/lib/api/hotels';

interface HotelWithRating extends Hotel {
  averageRating?: number;
  totalReviews?: number;
}

export function FeaturedHotels() {
  const router = useRouter();
  const [hotels, setHotels] = useState<HotelWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      try {
        setLoading(true);
        
        // Fetch all cities from database
        const cities = await hotelApi.getCities();
        
        let allHotels: HotelWithRating[] = [];
        
        // Fetch hotels from all cities
        for (const city of cities) {
          try {
            const cityHotels = await hotelApi.searchHotelsByCity(city.id);
            allHotels = allHotels.concat(cityHotels as HotelWithRating[]);
          } catch (err) {
            // Skip cities that have errors, continue with others
            console.log(`Error fetching hotels from city ${city.name}, skipping...`);
          }
        }

        // Fetch review stats for each hotel to get ratings
        const hotelsWithRatings = await Promise.all(
          allHotels.map(async (hotel) => {
            try {
              const stats = await reviewApi.getReviewStats(hotel.id);
              return {
                ...hotel,
                averageRating: stats.averageRating,
                totalReviews: stats.totalReviews,
              };
            } catch (err) {
              return hotel;
            }
          })
        );

        // Sort by rating and take top 6
        const topHotels = hotelsWithRatings
          .filter((h) => h.averageRating && h.averageRating >= 4.0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 6);

        setHotels(topHotels);
        setError(null);
      } catch (err) {
        console.error('Error fetching featured hotels:', err);
        setError('Không thể tải khách sạn');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedHotels();
  }, []);

  if (loading) {
    return (
      <section>
        <h2 className="mb-8 text-3xl font-bold text-[#1F2226]">Tripto Chọn Lọc</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-gray-200 h-72" />
          ))}
        </div>
      </section>
    );
  }

  if (error || hotels.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-8 text-3xl font-bold text-[#1F2226]">Tripto Chọn Lọc</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/hotel/${hotel.id}`)}
            className="group overflow-hidden rounded-2xl border border-[#E0E2E7] bg-white shadow-md transition hover:shadow-xl cursor-pointer"
          >
            {/* Hotel Image */}
            <div className="relative h-48 w-full overflow-hidden bg-gray-200">
              {hotel.mediaAssets && hotel.mediaAssets.length > 0 ? (
                <img
                  src={hotel.mediaAssets[0].url}
                  alt={hotel.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0057FF] to-[#0f1829] text-white">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
              )}
            </div>

            {/* Hotel Info */}
            <div className="p-4">
              <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-[#1F2226]">
                {hotel.name}
              </h3>
              <p className="mb-3 line-clamp-1 text-sm text-[#656F81]">
                {hotel.city?.name}, {hotel.city?.parentName}
              </p>

              {/* Rating */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {hotel.averageRating && (
                    <>
                      <span className="text-sm font-semibold text-[#1F2226]">
                        {hotel.averageRating.toFixed(1)}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-yellow-400"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </>
                  )}
                </div>
                {hotel.totalReviews && (
                  <span className="text-xs text-[#8B94A4]">
                    ({hotel.totalReviews} đánh giá)
                  </span>
                )}
              </div>

              {/* Price */}
              {hotel.lowestPrice && (
                <div className="text-base font-bold text-[#0057FF]">
                  {hotel.lowestPrice.toLocaleString('vi-VN')} ₫
                  <span className="text-xs text-[#656F81]"> /đêm</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
