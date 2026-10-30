"use client";

import React, { useState, useEffect } from "react";
import { Compass, Sparkles, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { NearbyPlace, PlaceCategoryFilter } from "@/types/place";
import { placesApi } from "@/lib/api/places";
import PlaceCard from "@/components/PlaceCard";
import PlaceReviewsModal from "@/components/PlaceReviewsModal";

interface NearbyPlacesSectionProps {
  hotelId?: string;
  hotelName?: string;
  latitude?: number | null;
  longitude?: number | null;
  cityId?: string | null;
  cityName?: string | null;
}

const CATEGORIES: { key: PlaceCategoryFilter; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ATTRACTION", label: "Điểm tham quan" },
  { key: "RESTAURANT", label: "Ẩm thực & Nhà hàng" },
  { key: "CAFE", label: "Quán Cafe" },
  { key: "HISTORICAL", label: "Di tích lịch sử" },
  { key: "ENTERTAINMENT", label: "Vui chơi giải trí" },
];

export default function NearbyPlacesSection({
  hotelId,
  hotelName,
  latitude,
  longitude,
  cityId,
  cityName,
}: NearbyPlacesSectionProps) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategoryFilter>("ALL");
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(10);

  const fetchPlaces = async (cat: PlaceCategoryFilter, radius: number) => {
    setLoading(true);
    try {
      const data = await placesApi.getNearbyPlaces({
        latitude,
        longitude,
        cityId,
        provinceName: cityName,
        category: cat,
        radiusKm: radius,
        limit: 12,
      });
      setPlaces(data || []);
    } catch (err) {
      console.warn("Failed to load nearby places:", err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces(selectedCategory, radiusKm);
  }, [latitude, longitude, cityId, cityName, selectedCategory, radiusKm]);

  const handleSelectPlace = (place: NearbyPlace) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
  };

  const handleCategoryChange = (cat: PlaceCategoryFilter) => {
    setSelectedCategory(cat);
  };

  return (
    <section id="nearby-places" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 py-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
            <Compass className="w-3.5 h-3.5" />
            Khám phá quanh đây
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Địa điểm lân cận & Ẩm thực nổi bật
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gợi ý những điểm tham quan, ẩm thực và cafe hấp dẫn xung quanh {hotelName || "khách sạn"} kèm ước tính thời gian di chuyển.
          </p>
        </div>

        {/* Radius filter pills */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span>Bán kính:</span>
          {[5, 10, 20].map((r) => (
            <button
              key={r}
              onClick={() => setRadiusKm(r)}
              className={`rounded-lg px-2.5 py-1 transition ${
                radiusKm === r
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Places / Skeletons / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-3 space-y-3">
              <div className="aspect-[4/3] w-full rounded-xl bg-gray-200"></div>
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-3 w-1/2 rounded bg-gray-200"></div>
              <div className="h-3 w-1/4 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      ) : places.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {places.map((place, idx) => (
            <PlaceCard
              key={place.id || place.googlePlaceId || idx}
              place={place}
              onSelect={handleSelectPlace}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
            <MapPin className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-gray-800 mb-1">
            Chưa tìm thấy địa điểm phù hợp trong bán kính {radiusKm} km
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
            Bạn có thể thử tăng bán kính tìm kiếm lên 20 km hoặc chuyển sang danh mục khác để tìm thêm gợi ý.
          </p>
          <div className="flex justify-center gap-3">
            {radiusKm < 20 && (
              <button
                onClick={() => setRadiusKm(20)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Mở rộng bán kính lên 20 km
              </button>
            )}
            {selectedCategory !== "ALL" && (
              <button
                onClick={() => setSelectedCategory("ALL")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Xem tất cả danh mục
              </button>
            )}
          </div>
        </div>
      )}

      {/* Place Reviews and Photo Gallery Modal */}
      <PlaceReviewsModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
