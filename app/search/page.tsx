"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HotelCard } from "@/components/HotelCard";
import { SearchFilters } from "@/components/SearchFilters";
import { HotelSearchBar } from "@/components/HotelSearchBar";
import { hotelApi, Hotel as ApiHotel } from "@/lib/api/hotels";
import { amenityTitles, guestReviewFacts } from "@/lib/search/hotel-facts";
import { parseSearchFilters, patchSearchFilters, parseSearchPaging, patchSearchPaging, type SearchPaging, type SearchFilterValues } from "@/lib/search/criteria";
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
  const [totalResults,setTotalResults]=useState(0);
  const [totalPages,setTotalPages]=useState(0);
  const [availableAmenities,setAvailableAmenities]=useState<string[]>([]);
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
  const pageOptions=useMemo(()=>parseSearchPaging(new URLSearchParams(query)),[query]);
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
          const pageResult = await hotelApi.searchHotelOfferPage({
            hotelName: hotelName,
            checkIn, checkOut, rooms: requestedRooms, adults: requestedAdults, children: requestedChildren,
            accommodationTypes: filterValues.accommodationTypes,
            amenityCodes: filterValues.amenityCodes,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            ...pageOptions,page:0,size:1,starRatings:selectedStarRatings,guestRatings:selectedGuestRatings,amenities:selectedAmenities,
          });

          const eligibleHotels = pageResult.content;

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
        setHotels([]);setTotalResults(0);setTotalPages(0);setAvailableAmenities([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const pageResult = await hotelApi.searchHotelOfferPage({
          cityName: cityId || provinceId ? undefined : cityName,
          cityId: cityId || undefined, provinceId: provinceId || undefined,
          checkIn, checkOut, rooms: requestedRooms, adults: requestedAdults, children: requestedChildren,
          accommodationTypes: filterValues.accommodationTypes,
            amenityCodes: filterValues.amenityCodes,
            minPrice: priceRange[0],
          maxPrice: priceRange[1],
          ...pageOptions,starRatings:selectedStarRatings,guestRatings:selectedGuestRatings,amenities:selectedAmenities,
        });
        const apiHotels=pageResult.content;

        // Prices and dated inventory belong to the same server-selected room offer.
        if(!current)return;
        const transformedHotels: Hotel[] = apiHotels.map(hotel => {
          const minPrice = hotel.matchedOffer.unitPrice;
          const reviewStats=hotel.reviews;

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
            name: hotel.name,
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
        });

        if (!current) return;
        setHotels(transformedHotels);
        setTotalResults(pageResult.totalElements);setTotalPages(pageResult.totalPages);setAvailableAmenities(pageResult.availableAmenities);
      } catch (err: unknown) {
        if (!current) return;
        console.error("Error fetching hotels:", err);
        setError(selectedGuestRatings.length>0?"Không thể xác minh đánh giá và kết quả tìm kiếm. Vui lòng thử lại.":getErrorMessage(err, "Không thể tải danh sách khách sạn"));
      } finally {
        if (current) setLoading(false);
      }
    };

    fetchHotels();
    return () => { current = false; };
  }, [query,router,retry]);

  const handleSelectHotel = (hotel: Hotel) => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("rooms", rooms);
    params.set("adults", adults);
    params.set("children", children);
    router.push(`/hotel/${hotel.id}?${params.toString()}`);
  };

  const handleFilterChange = (filters: Partial<SearchFilterValues>) => {
    const next = patchSearchFilters(new URLSearchParams(searchParams.toString()), filters);
    router.push(`/search?${next}`, {scroll:false});
  };

  const handlePagingChange=(patch:Partial<SearchPaging>)=>{
    const next=patchSearchPaging(new URLSearchParams(searchParams.toString()),patch);
    router.push(`/search?${next}`,{scroll:false});
  };
  const resultError=error;

  return (
    <CustomerOnlyRoute>
      <div className="bg-white text-[#121316] min-h-screen flex flex-col">
        <Header />

      <main className="flex-1">
        {/* Search Bar */}
        <div className={`bg-white border-b border-[#E5E7EB] sticky z-30 transition-all duration-300 ${headerVisible ? 'top-24' : 'top-0'}`}>
          <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 py-4">
            <HotelSearchBar
              key={JSON.stringify([cityId,provinceId,cityName,hotelName,checkIn,checkOut,adults,children,rooms])}
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
              totalResults={loading || resultError ? null : totalResults}
              hotels={hotels}
              availableAmenities={availableAmenities}
            />

            {/* Hotels Grid */}
            <div>
              {!loading && <div className="mb-6 flex items-center justify-between">
                {!resultError && <p className="text-lg font-semibold text-[#2B3037]">
                  Tìm thấy {totalResults} khách sạn
                </p>}
                <select aria-label="Sắp xếp kết quả" value={pageOptions.sort} onChange={event=>handlePagingChange({sort:event.target.value})} className="rounded-lg border border-[#E4E6EB] bg-white px-4 py-2 text-sm text-[#2B3037] hover:border-[#0057FF]">
                  <option value="DEFAULT">Xếp theo: Mặc định</option>
                  <option value="PRICE_ASC">Giá: Thấp đến cao</option>
                  <option value="PRICE_DESC">Giá: Cao đến thấp</option>
                  <option value="RATING_DESC">Đánh giá: Cao nhất</option>
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
              ) : hotels.length > 0 ? (
                <div className="space-y-4">
                  {hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} onSelect={handleSelectHotel} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {totalResults>0 ? <><p className="text-[#8B94A4]">Trang này không còn kết quả.</p><button onClick={()=>handlePagingChange({page:0})}>Về trang đầu</button></> : <p className="text-[#8B94A4]">Không tìm thấy khách sạn phù hợp</p>}
                </div>
              )}
              {!loading && !resultError && totalPages>0 && <nav aria-label="Phân trang kết quả" className="mt-6 flex flex-wrap items-center gap-4">
                <button disabled={pageOptions.page<=0} onClick={()=>handlePagingChange({page:pageOptions.page-1})}>Trang trước</button>
                <span>{pageOptions.page<totalPages?`Trang ${pageOptions.page+1} / ${totalPages}`:'Trang yêu cầu không còn kết quả'}</span>
                <button disabled={pageOptions.page+1>=totalPages} onClick={()=>handlePagingChange({page:pageOptions.page+1})}>Trang sau</button>
              </nav>}
              {!loading && <label className="mt-4 flex items-center gap-2">Kết quả mỗi trang
                <select aria-label="Số kết quả mỗi trang" value={pageOptions.size} onChange={event=>handlePagingChange({size:Number(event.target.value)})}>
                  {![10,20,50].includes(pageOptions.size)&&Number.isInteger(pageOptions.size)&&pageOptions.size>=1&&pageOptions.size<=50&&<option value={pageOptions.size}>{pageOptions.size}</option>}
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
              </label>}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </CustomerOnlyRoute>
  );
}
