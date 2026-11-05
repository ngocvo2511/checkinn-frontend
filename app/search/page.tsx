"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HotelCard } from "@/components/HotelCard";
import { SearchFilters } from "@/components/SearchFilters";
import { HotelSearchBar } from "@/components/HotelSearchBar";
import { hotelApi, Hotel as ApiHotel } from "@/lib/api/hotels";
import { amenityTitles, guestReviewFacts, matchesHotelAmenities } from "@/lib/search/hotel-facts";
import { reviewApi } from "@/lib/api/reviews";
import { parseSearchFilters, patchSearchFilters, type SearchFilterValues } from "@/lib/search/criteria";
import { CustomerOnlyRoute } from "@/components/CustomerOnlyRoute";

interface Hotel {
  accommodationTypeLabel?: string | null;
  id: string;
  name: string;
  location: string;
  rating: number | null;
  reviewCount: number | null;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  amenities: string[];
  availableRooms?: number;
  starRating?: number;
  loyaltyPoints?: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error && error.message ? error.message : fallback;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Search params
  const cityName = searchParams.get("cityName") || "Destination";
  const cityId = searchParams.get("cityId") || "";
  const provinceId = searchParams.get("provinceId") || "";
  const hotelName = searchParams.get("hotelName") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const rooms = searchParams.get("rooms") || "1";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";

  const query = searchParams.toString();
  const filterValues = useMemo(() => parseSearchFilters(new URLSearchParams(query)),[query]);
  const {priceRange, amenities: selectedAmenities, starRatings: selectedStarRatings, guestRatings: selectedGuestRatings} = filterValues;

  // Track header visibility for sticky search bar position
  useEffect(() => {
    const handleScrollVisibility = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScrollVisibility);
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, [lastScrollY]);

  // Fetch hotels from API
  useEffect(() => {
    let current = true;
    const fetchHotels = async () => {
      setError(null);
      const requestedRooms = Math.max(1, Number.parseInt(rooms, 10) || 1);
      const requestedAdults = Math.max(1, Number.parseInt(adults, 10) || 1);
      const requestedChildren = Math.max(0, Number.parseInt(children, 10) || 0);

      // Handle hotel name search - redirect to hotel detail page
      if (hotelName) {
        setLoading(true);
        try {
          const apiHotels = await hotelApi.searchHotelOffers({
            hotelName: hotelName,
            checkIn, checkOut, rooms: requestedRooms, adults: requestedAdults, children: requestedChildren,
            accommodationTypes: filterValues.accommodationTypes,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
          });

          const eligibleHotels = apiHotels;

          if (!current) return;
          if (eligibleHotels.length > 0) {
            // Redirect to the first hotel found
            const hotelId = eligibleHotels[0].id;
            const params = new URLSearchParams();
            if (checkIn) params.set("checkIn", checkIn);
            if (checkOut) params.set("checkOut", checkOut);
            params.set("rooms", rooms);
            params.set("adults", adults);
            params.set("children", children);
            
            const queryString = params.toString();
            router.push(`/hotel/${hotelId}${queryString ? '?' + queryString : ''}`);
          } else {
            setError("Không tìm thấy khách sạn");
            setLoading(false);
          }
        } catch (err: unknown) {
          if (!current) return;
          console.error("Error searching hotel:", err);
          setError(getErrorMessage(err, "Lỗi khi tìm khách sạn"));
          setLoading(false);
        }
        return;
      }

      // Handle city/location search - show list of hotels
      if (!cityId && !provinceId && (!cityName || cityName === "Destination")) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const apiHotels = await hotelApi.searchHotelOffers({
          cityName: cityId || provinceId ? undefined : cityName,
          cityId: cityId || undefined, provinceId: provinceId || undefined,
          checkIn, checkOut, rooms: requestedRooms, adults: requestedAdults, children: requestedChildren,
          accommodationTypes: filterValues.accommodationTypes,
            minPrice: priceRange[0],
          maxPrice: priceRange[1],
        });

        // Helper function to clean extra quotes from API response
        const cleanQuotes = (str: string | undefined): string => {
          if (!str) return "";
          // Remove escaped quotes from JSON response
          return str.replace(/^"(.*)"$/, '$1').trim();
        };

        // Prices and dated inventory belong to the same server-selected room offer.
        const transformedHotels: Hotel[] = await Promise.all(apiHotels.map(async (hotel) => {
          const minPrice = hotel.matchedOffer.unitPrice;

          // Fetch review stats for this hotel
          let reviewStats = null;
          try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            reviewStats = await reviewApi.getReviewStats(hotel.id, token || undefined);
          } catch (err) {
            console.error(`Error fetching review stats for hotel ${hotel.id}:`, err);
          }

          const address = hotel.address as ApiHotel["address"] & {
            ward?: string;
            district?: string;
          };

          const locationParts = [
            address?.ward,
            address?.district,
            hotel.city?.name,
          ].filter(Boolean);

          const primaryImage = hotel.mediaAssets?.[0]?.url
            || hotel.roomTypes?.[0]?.mediaAssets?.[0]?.url
            || "/placeholder-hotel.jpg";

          const allImages = [
            ...(hotel.mediaAssets?.map(m => m.url) || []),
            ...((hotel.roomTypes?.flatMap(rt => rt.mediaAssets?.map(m => m.url) || []) || []))
          ];

          const hotelAmenities = amenityTitles(hotel.amenityCategories);
          const reviews = guestReviewFacts(reviewStats);

          return {
            id: hotel.id,
            accommodationTypeLabel: hotel.accommodationTypeLabel,
            name: cleanQuotes(hotel.name),
            location: locationParts.join(", ") || "Chưa cung cấp vị trí",
            rating: reviews.rating,
            reviewCount: reviews.reviewCount,
            price: minPrice,
            image: primaryImage,
            images: allImages,
            amenities: hotelAmenities,
            availableRooms: hotel.matchedOffer.availableRooms ?? undefined,
            starRating: hotel.starRating,
          };
        }));

        if (!current) return;
        setHotels(transformedHotels);
        setFilteredHotels(transformedHotels);
      } catch (err: unknown) {
        if (!current) return;
        console.error("Error fetching hotels:", err);
        setError(getErrorMessage(err, "Không thể tải danh sách khách sạn"));
      } finally {
        if (current) setLoading(false);
      }
    };

    fetchHotels();
    return () => { current = false; };
  }, [cityId, provinceId, cityName, hotelName, checkIn, checkOut, rooms, adults, children, priceRange, filterValues.accommodationTypes, router, retry]);

  const handleSelectHotel = (hotel: Hotel) => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("rooms", rooms);
    params.set("adults", adults);
    params.set("children", children);
    router.push(`/hotel/${hotel.id}?${params.toString()}`);
  };

  // Apply filters
  useEffect(() => {
    let filtered = hotels;

    // Price filter
    filtered = filtered.filter(
      (h) => h.price >= priceRange[0] && h.price <= priceRange[1]
    );

    // Star rating filter
    if (selectedStarRatings.length > 0) {
      filtered = filtered.filter((h) => 
        h.starRating && selectedStarRatings.includes(h.starRating)
      );
    }

    // Guest rating filter (any selected threshold matches)
    if (selectedGuestRatings.length > 0) {
      filtered = filtered.filter((h) =>
        h.rating !== null && selectedGuestRatings.some((threshold) => h.rating! >= threshold)
      );
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((h) =>
        matchesHotelAmenities(h.amenities, selectedAmenities)
      );
    }

    setFilteredHotels(filtered);
  }, [hotels, priceRange, selectedAmenities, selectedStarRatings, selectedGuestRatings]);

  const handleFilterChange = (filters: Partial<SearchFilterValues>) => {
    const next = patchSearchFilters(new URLSearchParams(searchParams.toString()), filters);
    router.push(`/search?${next}`, {scroll:false});
  };

  const resultError = error || (selectedGuestRatings.length > 0 && hotels.some(h => h.rating === null && h.reviewCount !== 0)
    ? "Không thể xác minh đánh giá để lọc kết quả. Vui lòng thử lại." : null);

  return (
    <CustomerOnlyRoute>
      <div className="bg-white text-[#121316] min-h-screen flex flex-col">
        <Header />

      <main className="flex-1">
        {/* Search Bar */}
        <div className={`bg-white border-b border-[#E5E7EB] sticky z-30 transition-all duration-300 ${headerVisible ? 'top-24' : 'top-0'}`}>
          <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 py-4">
            <HotelSearchBar
              initialHotelName={cityName}
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialAdults={adults}
              initialChildren={children}
              initialRooms={rooms}
              onSearch={(data) => {
                if (!data.checkIn || !data.checkOut) {
                  return;
                }

                const formatDateLocal = (date: Date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                };
                
                const params = new URLSearchParams(searchParams.toString());
                for (const key of ["cityId","provinceId","cityName","hotelName"]) params.delete(key);
                params.set('checkIn', formatDateLocal(data.checkIn));
                params.set('checkOut', formatDateLocal(data.checkOut));
                params.set('rooms', data.rooms.toString());
                params.set('adults', data.adults.toString());
                params.set('children', data.children.toString());
                
                const queryString = params.toString();
                
                // If selected hotel, route through hotel-name search so availability and capacity filters still apply
                if (data.hotelId && data.hotelName) {
                  router.push(`/search?hotelName=${encodeURIComponent(data.hotelName)}&${queryString}`);
                }
                // If selected city, redirect to search with city filter
                else if ((data.cityId || data.provinceId) && data.cityName) {
                  router.push(`/search?${data.provinceId ? `provinceId=${data.provinceId}` : `cityId=${data.cityId}`}&cityName=${encodeURIComponent(data.cityName)}&${queryString}`);
                }
                // If no new city selected but we're already on search page, refresh with current city
                else if (cityId || provinceId || (cityName && cityName !== "Destination")) {
                  if (provinceId) {
                    router.push(`/search?provinceId=${provinceId}&cityName=${encodeURIComponent(cityName)}&${queryString}`);
                  } else if (cityId) {
                    router.push(`/search?cityId=${cityId}&cityName=${encodeURIComponent(cityName)}&${queryString}`);
                  } else {
                    router.push(`/search?cityName=${encodeURIComponent(cityName)}&${queryString}`);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-10 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
            {/* Sidebar Filters */}
            <SearchFilters
              value={filterValues}
              onFilterChange={handleFilterChange}
              totalResults={loading || resultError ? null : filteredHotels.length}
              hotels={hotels}
            />

            {/* Hotels Grid */}
            <div>
              {!loading && !resultError && <div className="mb-6 flex items-center justify-between">
                <p className="text-lg font-semibold text-[#2B3037]">
                  Tìm thấy {filteredHotels.length} khách sạn
                </p>
                <select className="rounded-lg border border-[#E4E6EB] bg-white px-4 py-2 text-sm text-[#2B3037] hover:border-[#0057FF]">
                  <option>Xếp theo: Được ưa thích</option>
                  <option>Giá: Thấp đến cao</option>
                  <option>Giá: Cao đến thấp</option>
                  <option>Đánh giá: Cao nhất</option>
                </select>
              </div>}

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-[#8B94A4]">Đang tải...</p>
                </div>
              ) : resultError ? (
                <div role="alert" data-testid="search-error" className="text-center py-12">
                  <p className="text-red-600 mb-2">{resultError}</p>
                  <button className="text-blue-600 underline" onClick={() => setRetry(value => value + 1)}>Thử lại</button>
                </div>
              ) : filteredHotels.length > 0 ? (
                <div className="space-y-4">
                  {filteredHotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} onSelect={handleSelectHotel} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#8B94A4]">Không tìm thấy khách sạn phù hợp</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </CustomerOnlyRoute>
  );
}
