"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HotelCard } from "@/components/HotelCard";
import { SearchFilters } from "@/components/SearchFilters";
import { HotelSearchBar } from "@/components/HotelSearchBar";
import { hotelApi, Hotel as ApiHotel } from "@/lib/api/hotels";
import { reviewApi } from "@/lib/api/reviews";
import { availabilityApi } from "@/lib/api/availability";
import { CustomerOnlyRoute } from "@/components/CustomerOnlyRoute";

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  amenities: string[];
  type: string;
  availableRooms?: number;
  starRating?: number;
  loyaltyPoints?: number;
}

interface SearchFilterValues {
  priceRange?: number[];
  amenities?: string[];
  types?: string[];
  starRatings?: number[];
  guestRatings?: number[];
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
  const [error, setError] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Search params
  const cityName = searchParams.get("cityName") || "Destination";
  const hotelName = searchParams.get("hotelName") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const rooms = searchParams.get("rooms") || "1";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStarRatings, setSelectedStarRatings] = useState<number[]>([]);
  const [selectedGuestRatings, setSelectedGuestRatings] = useState<number[]>([]);

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
    const fetchHotels = async () => {
      const requestedRooms = Math.max(1, Number.parseInt(rooms, 10) || 1);
      const requestedAdults = Math.max(1, Number.parseInt(adults, 10) || 1);
      const requestedChildren = Math.max(0, Number.parseInt(children, 10) || 0);

      const getRoomAdults = (roomType: NonNullable<ApiHotel["roomTypes"]>[number]) => {
        return roomType.capacity?.adults ?? roomType.maxOccupancy ?? 0;
      };

      const getRoomChildren = (roomType: NonNullable<ApiHotel["roomTypes"]>[number]) => {
        return roomType.capacity?.children ?? 0;
      };

      const getConfiguredRoomCount = (roomType: NonNullable<ApiHotel["roomTypes"]>[number]) => {
        return roomType.totalRooms ?? roomType.roomAmount ?? roomType.availableRooms ?? 10;
      };

      const evaluateHotelAvailability = async (hotel: ApiHotel): Promise<{ eligible: boolean; availableRooms?: number }> => {
        const activeRoomTypes = (hotel.roomTypes || []).filter((roomType) => {
          const adultCapacity = getRoomAdults(roomType);
          const childCapacity = getRoomChildren(roomType);
          return roomType.isActive !== false && adultCapacity > 0 && childCapacity >= 0;
        });

        if (activeRoomTypes.length === 0) {
          return { eligible: false };
        }

        let bestAvailableRooms: number | undefined;

        for (const roomType of activeRoomTypes) {
          let availableRooms = getConfiguredRoomCount(roomType);

          if (checkIn && checkOut) {
            try {
              const availabilityCheck = await availabilityApi.checkAvailability(
                roomType.id,
                checkIn,
                checkOut,
                1
              );
              availableRooms = availabilityCheck.availableRooms;
            } catch (err) {
              console.error(`Error fetching availability for room type ${roomType.id}:`, err);
              availableRooms = 0;
            }
          }

          if (availableRooms <= 0) {
            continue;
          }

          const adultCapacity = availableRooms * getRoomAdults(roomType);
          const childCapacity = availableRooms * getRoomChildren(roomType);
          const canSatisfyRequestedStay =
            availableRooms >= requestedRooms &&
            adultCapacity >= requestedAdults &&
            childCapacity >= requestedChildren;

          if (canSatisfyRequestedStay) {
            bestAvailableRooms = Math.max(bestAvailableRooms ?? 0, availableRooms);
          }
        }

        return {
          eligible: bestAvailableRooms !== undefined,
          availableRooms: bestAvailableRooms,
        };
      };

      // Handle hotel name search - redirect to hotel detail page
      if (hotelName) {
        setLoading(true);
        try {
          const apiHotels = await hotelApi.searchHotels({
            hotelName: hotelName,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
          });

          const eligibleHotels = (
            await Promise.all(apiHotels.map(async (hotel) => ({
              hotel,
              availability: await evaluateHotelAvailability(hotel),
            })))
          ).filter(({ availability }) => availability.eligible);

          if (eligibleHotels.length > 0) {
            // Redirect to the first hotel found
            const hotelId = eligibleHotels[0].hotel.id;
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
          console.error("Error searching hotel:", err);
          setError(getErrorMessage(err, "Lỗi khi tìm khách sạn"));
          setLoading(false);
        }
        return;
      }

      // Handle city/location search - show list of hotels
      if ((!cityName || cityName === "Destination")) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const apiHotels = await hotelApi.searchHotels({
          cityName: cityName,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
        });

        // Helper function to clean extra quotes from API response
        const cleanQuotes = (str: string | undefined): string => {
          if (!str) return "";
          // Remove escaped quotes from JSON response
          return str.replace(/^"(.*)"$/, '$1').trim();
        };

        const eligibleHotelResults = (
          await Promise.all(apiHotels.map(async (hotel) => ({
            hotel,
            availability: await evaluateHotelAvailability(hotel),
          })))
        ).filter(({ availability }) => availability.eligible);

        // Transform API data to UI format
        const transformedHotels: Hotel[] = await Promise.all(eligibleHotelResults.map(async ({ hotel, availability }) => {
          const minPrice = hotel.lowestPrice ?? (
            hotel.roomTypes && hotel.roomTypes.length > 0
              ? Math.min(...hotel.roomTypes.map(rt => rt.basePrice ?? rt.pricePerNight ?? 0))
              : 0
          );

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

          // Extract amenities from amenityCategories
          let hotelAmenities: string[] = [];
          if (hotel.amenityCategories && hotel.amenityCategories.length > 0) {
            // Flatten all items from all categories
            const allItems = hotel.amenityCategories.flatMap(cat => 
              (cat.items || []).map(item => item.title).filter(Boolean)
            );
            // Randomly select 3-4 amenities
            const count = Math.min(allItems.length, Math.floor(Math.random() * 2) + 3); // 3 or 4
            hotelAmenities = allItems
              .sort(() => Math.random() - 0.5)
              .slice(0, count);
          }
          // Fallback amenities if none found
          if (hotelAmenities.length === 0) {
            const fallbackAmenities = ["Free WiFi", "Bãi đỗ xe", "Nhà hàng", "Hồ bơi", "Gym"];
            const count = Math.floor(Math.random() * 2) + 3; // 3 or 4
            hotelAmenities = fallbackAmenities.slice(0, count);
          }

          return {
            id: hotel.id,
            name: cleanQuotes(hotel.name),
            location: locationParts.join(", ") || "Đà Nẵng",
            rating: reviewStats?.averageRating ?? hotel.starRating ?? 8.0,
            reviewCount: reviewStats?.totalReviews ?? 0,
            price: minPrice,
            originalPrice: minPrice > 0 ? Math.floor(minPrice * 1.2) : undefined,
            image: primaryImage,
            images: allImages,
            amenities: hotelAmenities,
            type: "Hotel",
            availableRooms: availability.availableRooms,
            starRating: hotel.starRating,
            loyaltyPoints: minPrice > 0 ? Math.floor(minPrice / 100000) : 0,
          };
        }));

        setHotels(transformedHotels);
        setFilteredHotels(transformedHotels);
      } catch (err: unknown) {
        console.error("Error fetching hotels:", err);
        setError(getErrorMessage(err, "Không thể tải danh sách khách sạn"));
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [cityName, hotelName, checkIn, checkOut, rooms, adults, children, priceRange, router]);

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
        selectedGuestRatings.some((threshold) => h.rating >= threshold)
      );
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((h) =>
        selectedAmenities.every((a) => h.amenities.includes(a))
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((h) => selectedTypes.includes(h.type));
    }

    setFilteredHotels(filtered);
  }, [hotels, priceRange, selectedAmenities, selectedTypes, selectedStarRatings, selectedGuestRatings]);

  const handleFilterChange = (filters: SearchFilterValues) => {
    if (filters.priceRange) setPriceRange(filters.priceRange);
    if (filters.amenities) setSelectedAmenities(filters.amenities);
    if (filters.types) setSelectedTypes(filters.types);
    if (filters.starRatings !== undefined) setSelectedStarRatings(filters.starRatings);
    if (filters.guestRatings !== undefined) setSelectedGuestRatings(filters.guestRatings);
  };

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
                
                const params = new URLSearchParams();
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
                else if (data.cityId && data.cityName) {
                  router.push(`/search?cityId=${data.cityId}&cityName=${encodeURIComponent(data.cityName)}&${queryString}`);
                }
                // If no new city selected but we're already on search page, refresh with current city
                else if (cityName && cityName !== "Destination") {
                  const cityId = searchParams.get("cityId");
                  if (cityId) {
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
              onFilterChange={handleFilterChange}
              totalResults={filteredHotels.length}
              hotels={hotels}
            />

            {/* Hotels Grid */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-lg font-semibold text-[#2B3037]">
                  Tìm thấy {filteredHotels.length} khách sạn
                </p>
                <select className="rounded-lg border border-[#E4E6EB] bg-white px-4 py-2 text-sm text-[#2B3037] hover:border-[#0057FF]">
                  <option>Xếp theo: Được ưa thích</option>
                  <option>Giá: Thấp đến cao</option>
                  <option>Giá: Cao đến thấp</option>
                  <option>Đánh giá: Cao nhất</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-[#8B94A4]">Đang tải...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-2">{error}</p>
                  <p className="text-[#8B94A4] text-sm">Vui lòng thử lại sau</p>
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
