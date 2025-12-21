"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HotelCard } from "@/components/HotelCard";
import { SearchFilters } from "@/components/SearchFilters";
import hotelApi, { Hotel as ApiHotel } from "@/lib/api/hotels";

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
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Search params
  const cityName = searchParams.get("cityName") || "Destination";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const rooms = searchParams.get("rooms") || "1";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  // Fetch hotels from API
  useEffect(() => {
    const fetchHotels = async () => {
      if (!cityName || cityName === "Destination") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const apiHotels = await hotelApi.searchHotels({
          cityName,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
        });

        // Helper function to clean extra quotes from API response
        const cleanQuotes = (str: string | undefined): string => {
          if (!str) return "";
          // Remove escaped quotes from JSON response
          return str.replace(/^"(.*)"$/, '$1').trim();
        };

        // Transform API data to UI format
        const transformedHotels: Hotel[] = apiHotels.map((hotel: ApiHotel) => {
          const minPrice = hotel.lowestPrice ?? (
            hotel.roomTypes && hotel.roomTypes.length > 0
              ? Math.min(...hotel.roomTypes.map(rt => rt.basePrice ?? rt.pricePerNight ?? 0))
              : 0
          );

          const locationParts = [
            hotel.address?.ward,
            hotel.address?.district,
            hotel.city?.name,
          ].filter(Boolean);

          const primaryImage = hotel.mediaAssets?.[0]?.url
            || hotel.roomTypes?.[0]?.mediaAssets?.[0]?.url
            || "/placeholder-hotel.jpg";

          const allImages = [
            ...(hotel.mediaAssets?.map(m => m.url) || []),
            ...((hotel.roomTypes?.flatMap(rt => rt.mediaAssets?.map(m => m.url) || []) || []))
          ];

          return {
            id: hotel.id,
            name: cleanQuotes(hotel.name),
            location: locationParts.join(", ") || "Đà Nẵng",
            rating: hotel.starRating || 8.0,
            reviewCount: Math.floor(Math.random() * 500) + 50, // Mock review count
            price: minPrice,
            originalPrice: minPrice > 0 ? Math.floor(minPrice * 1.2) : undefined,
            image: primaryImage,
            images: allImages,
            amenities: ["Free WiFi"], // Mock amenities
            type: "Hotel",
          };
        });

        setHotels(transformedHotels);
        setFilteredHotels(transformedHotels);
      } catch (err: any) {
        console.error("Error fetching hotels:", err);
        setError(err.message || "Không thể tải danh sách khách sạn");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [cityName]);

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

    // Amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((h) =>
        selectedAmenities.some((a) => h.amenities.includes(a))
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((h) => selectedTypes.includes(h.type));
    }

    setFilteredHotels(filtered);
  }, [hotels, priceRange, selectedAmenities, selectedTypes]);

  const handleFilterChange = (filters: any) => {
    if (filters.priceRange) setPriceRange(filters.priceRange);
    if (filters.amenities) setSelectedAmenities(filters.amenities);
    if (filters.types) setSelectedTypes(filters.types);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="bg-white text-[#121316] min-h-screen flex flex-col">
      <Header user={user} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />

      <main className="flex-1">
        {/* Search Header */}
        <div className="bg-[#F7F8FA] border-b border-[#E4E6EB] sticky top-16 z-30">
          <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-10 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
                    fill="#0057FF"
                  />
                </svg>
                <span className="font-semibold">{cityName}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#656F81]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V10h14v8z"
                    fill="currentColor"
                  />
                </svg>
                <span>
                  {formatDate(checkIn)} - {formatDate(checkOut)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#656F81]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.66 0-5 .83-5 2.5V14h10v-1.5c0-1.67-3.34-2.5-5-2.5zm7.5-2c.83 0 1.5-.67 1.5-1.5S18.33 5 17.5 5 16 5.67 16 6.5s.67 1.5 1.5 1.5zm0 2c-.29 0-.62.02-.97.05.58.45.97 1.12.97 1.95V14h4v-1.5c0-1.67-3.34-2.5-5-2.5z"
                    fill="currentColor"
                  />
                </svg>
                <span>
                  {rooms} phòng, {adults} người lớn, {children} trẻ em
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-10 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
            {/* Sidebar Filters */}
            <SearchFilters
              onFilterChange={handleFilterChange}
              totalResults={filteredHotels.length}
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
  );
}
