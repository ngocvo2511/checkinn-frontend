"use client";

import React from "react";
import { Star, MapPin, Clock, MessageSquare, Image as ImageIcon, ExternalLink } from "lucide-react";
import { NearbyPlace } from "@/types/place";

interface PlaceCardProps {
  place: NearbyPlace;
  onSelect: (place: NearbyPlace) => void;
}

const CATEGORY_LABEL_MAP: Record<string, { label: string; color: string }> = {
  ATTRACTION: { label: "Điểm tham quan", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  HISTORICAL: { label: "Di tích lịch sử", color: "bg-amber-50 text-amber-700 border-amber-200" },
  RESTAURANT: { label: "Ẩm thực & Nhà hàng", color: "bg-rose-50 text-rose-700 border-rose-200" },
  CAFE: { label: "Quán Cafe", color: "bg-orange-50 text-orange-700 border-orange-200" },
  ENTERTAINMENT: { label: "Vui chơi giải trí", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function PlaceCard({ place, onSelect }: PlaceCardProps) {
  const catInfo = CATEGORY_LABEL_MAP[place.category] || {
    label: place.category,
    color: "bg-blue-50 text-blue-700 border-blue-200"
  };

  const coverUrl = place.coverImageUrl || (place.photos && place.photos.length > 0 ? place.photos[0].photoUrl : null);
  const reviewsCount = place.reviews?.length || 0;
  const photosCount = place.photos?.length || (coverUrl ? 1 : 0);

  return (
    <div 
      onClick={() => onSelect(place)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md hover:border-blue-200 cursor-pointer"
    >
      {/* Cover Image & Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={place.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400">
            <ImageIcon className="h-8 w-8 opacity-40" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute left-3 top-3">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md shadow-xs ${catInfo.color}`}>
            {catInfo.label}
          </span>
        </div>

        {/* Distance Badge */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-md">
            <Clock className="w-3 h-3 text-blue-300" />
            ~{place.estimatedTravelTimeMinutes} phút ({place.distanceKm} km)
          </span>
        </div>

        {/* Media Counts */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {photosCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-xs">
              <ImageIcon className="w-3 h-3" />
              {photosCount}
            </span>
          )}
          {reviewsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-xs">
              <MessageSquare className="w-3 h-3" />
              {reviewsCount}
            </span>
          )}
        </div>
      </div>

      {/* Place Details */}
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
          {place.name}
        </h4>

        {place.address && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            {place.address}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
          {/* Rating */}
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
            {place.rating ? (
              <>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{place.rating.toFixed(1)}</span>
                {place.userRatingsTotal ? (
                  <span className="text-xs font-normal text-gray-400">
                    ({place.userRatingsTotal.toLocaleString()})
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-xs text-gray-400">Chưa có đánh giá</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {place.detailUrl && (
              <a
                href={place.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-emerald-600 transition p-1 rounded-md hover:bg-emerald-50"
                title="Mở trang TripAdvisor gốc"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button 
              type="button"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Chi tiết &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
