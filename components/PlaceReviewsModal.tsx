"use client";

import React, { useState, useEffect } from "react";
import { X, Star, ChevronLeft, ChevronRight, MapPin, Clock, MessageSquare, Image as ImageIcon, ExternalLink } from "lucide-react";
import { NearbyPlace } from "@/types/place";

interface PlaceReviewsModalProps {
  place: NearbyPlace | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaceReviewsModal({ place, isOpen, onClose }: PlaceReviewsModalProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [place]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  const photos = place.photos && place.photos.length > 0 
    ? place.photos.map(p => p.photoUrl)
    : place.coverImageUrl ? [place.coverImageUrl] : [];

  const reviews = place.reviews || [];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 p-5 pb-4">
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                {place.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                ~{place.estimatedTravelTimeMinutes} phút ({place.distanceKm} km)
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{place.name}</h3>
            {place.address && (
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-1 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {place.address}
              </p>
            )}
            {place.detailUrl && (
              <div className="mt-2.5">
                <a
                  href={place.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition shadow-xs"
                >
                  <img
                    src="https://static.tacdn.com/favicon.ico"
                    alt="TripAdvisor"
                    className="w-3.5 h-3.5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span>Xem trang đánh giá gốc trên TripAdvisor</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                </a>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Photo Gallery Carousel */}
          {photos.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={photos[activePhotoIndex]}
                  alt={`${place.name} photo ${activePhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/70 backdrop-blur-sm transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/70 backdrop-blur-sm transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {activePhotoIndex + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        idx === activePhotoIndex ? "border-blue-600 ring-2 ring-blue-100" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Chưa có hình ảnh</p>
            </div>
          )}

          {/* Reviews Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-bold text-gray-900">Nhận xét từ du khách</h4>
              </div>
              <div className="flex items-center gap-3">
                {place.rating ? (
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full text-amber-700 font-semibold text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{place.rating.toFixed(1)}</span>
                    {place.userRatingsTotal ? (
                      <span className="text-xs text-amber-600 font-normal">
                        ({place.userRatingsTotal.toLocaleString()} đánh giá)
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {place.detailUrl && (
                  <a
                    href={place.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Xem tất cả đánh giá</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4 divide-y divide-gray-100">
                {reviews.map((rev, index) => (
                  <div key={rev.id || index} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        {rev.authorAvatarUrl ? (
                          <img
                            src={rev.authorAvatarUrl}
                            alt={rev.authorName}
                            className="w-8 h-8 rounded-full object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                            {rev.authorName ? rev.authorName[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{rev.authorName || "Du khách ẩn danh"}</p>
                          {rev.relativeTimeDescription && (
                            <p className="text-xs text-gray-400">{rev.relativeTimeDescription}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (rev.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.comment ? (
                      <p className="text-sm text-gray-600 leading-relaxed pl-10">
                        {rev.comment}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                Chưa có đánh giá chi tiết cho địa điểm này.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between gap-3">
          {place.detailUrl ? (
            <a
              href={place.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs"
            >
              <img
                src="https://static.tacdn.com/favicon.ico"
                alt="TripAdvisor"
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>Xem trên TripAdvisor</span>
              <ExternalLink className="w-4 h-4 text-emerald-600" />
            </a>
          ) : <div />}
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
