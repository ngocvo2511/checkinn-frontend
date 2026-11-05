"use client";

import { useEffect, useMemo, useState } from "react";
import { MIN_PRICE, MAX_PRICE, type SearchFilterValues } from "@/lib/search/criteria";

import {useAccommodationCatalog} from "./AccommodationTypeSelect";

interface SearchFiltersProps {
  onFilterChange: (filters: Partial<SearchFilterValues>) => void;
  value: SearchFilterValues;
  totalResults: number | null;
  hotels?: Array<{ amenities: string[] }>;
}

export function SearchFilters({ onFilterChange, value, totalResults, hotels = [] }: SearchFiltersProps) {
  const catalog = useAccommodationCatalog();
  const invalidTypes = !catalog.loading && !catalog.error ? value.accommodationTypes.filter(code=>!catalog.options.some(o=>o.code===code)) : [];
  const STEP = 50000;
  const DISPLAY_AMENITIES_COUNT = 4;

  const {priceRange, amenities, starRatings: selectedStarRatings, guestRatings: selectedGuestRatings} = value;
  const [minInput, setMinInput] = useState(MIN_PRICE.toString());
  const [maxInput, setMaxInput] = useState(MAX_PRICE.toString());
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  useEffect(() => {
    setMinInput(String(priceRange[0])); setMaxInput(String(priceRange[1]));
  }, [priceRange]);

  // Extract unique amenities from hotels
  const allAmenities = useMemo(() => {
    const amenitySet = new Set<string>();
    hotels.forEach((hotel) => {
      hotel.amenities.forEach((amenity) => {
        amenitySet.add(amenity);
      });
    });
    return Array.from(amenitySet).sort();
  }, [hotels]);

  const amenityOptions = allAmenities.length > 0 ? allAmenities : ["Tủ lạnh", "No cancellation", "Breakfast included", "Swimming pool"];
  const displayedAmenities = showAllAmenities ? amenityOptions : amenityOptions.slice(0, DISPLAY_AMENITIES_COUNT);

  const clampedRange = useMemo(() => {
    const [min, max] = priceRange;
    return [
      Math.max(MIN_PRICE, Math.min(min, MAX_PRICE)),
      Math.max(MIN_PRICE, Math.min(max, MAX_PRICE)),
    ];
  }, [priceRange]);

  const handleRangeChange = (value: number, index: 0 | 1) => {
    const nextRange = [...clampedRange] as [number, number];
    nextRange[index] = value;

    if (index === 0 && value > nextRange[1]) {
      nextRange[0] = nextRange[1];
    } else if (index === 1 && value < nextRange[0]) {
      nextRange[1] = nextRange[0];
    }

    setMinInput(nextRange[0].toString());
    setMaxInput(nextRange[1].toString());
    onFilterChange({ priceRange: nextRange });
  };

  const handleResetPrice = () => {
    const defaultRange: [number, number] = [MIN_PRICE, MAX_PRICE];
    setMinInput(MIN_PRICE.toString());
    setMaxInput(MAX_PRICE.toString());
    onFilterChange({ priceRange: defaultRange });
  };

  const lowerPercent = ((clampedRange[0] - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const upperPercent = ((clampedRange[1] - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  const formatCurrency = (value: number) => value.toLocaleString("vi-VN");

  const handleMinPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setMinInput(rawValue);
  };

  const handleMaxPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setMaxInput(rawValue);
  };

  const handleMinPriceBlur = () => {
    const next = Math.max(MIN_PRICE, Math.min(Number(minInput || MIN_PRICE), clampedRange[1]));
    setMinInput(String(next));
    onFilterChange({priceRange:[next,clampedRange[1]]});
  };
  const handleMaxPriceBlur = () => {
    const next = Math.max(MIN_PRICE, Math.min(Number(maxInput || MAX_PRICE), MAX_PRICE));
    setMaxInput(String(next));
    onFilterChange({priceRange:[Math.min(clampedRange[0],next),next]});
  };

  const handleAmenityChange = (amenity: string) => {
    const newAmenities = amenities.includes(amenity)
      ? amenities.filter((a) => a !== amenity)
      : [...amenities, amenity];
    onFilterChange({ amenities: newAmenities });
  };

  const handleStarRatingChange = (star: number) => {
    const newStarRatings = selectedStarRatings.includes(star)
      ? selectedStarRatings.filter((s) => s !== star)
      : [...selectedStarRatings, star];
    onFilterChange({ starRatings: newStarRatings });
  };

  const handleGuestRatingChange = (rating: number) => {
    const newGuestRatings = selectedGuestRatings.includes(rating)
      ? selectedGuestRatings.filter((r) => r !== rating)
      : [...selectedGuestRatings, rating];
    onFilterChange({ guestRatings: newGuestRatings });
  };

  return (
    <div className="h-fit sticky top-24 rounded-2xl border border-[#DDDFE3] bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#2B3037]">Khoảng giá</h3>
          <p className="text-xs text-[#656F81] mt-1">1 phòng, 1 đêm</p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-[#0071CE] hover:underline"
          onClick={handleResetPrice}
        >
          Đặt lại
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <div className="mb-6">
          <div className="relative h-2 rounded-full bg-[#E4E6EB]">
            <div
              className="absolute top-0 h-2 rounded-full bg-[#0D6EFD]"
              style={{ left: `${lowerPercent}%`, right: `${100 - upperPercent}%` }}
            />
          </div>
          <div className="relative -mt-3">
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={STEP}
              value={clampedRange[0]}
              onChange={(e) => handleRangeChange(Number(e.target.value), 0)}
              className="range-thumb absolute w-full appearance-none bg-transparent"
              style={{ zIndex: 2 }}
            />
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={STEP}
              value={clampedRange[1]}
              onChange={(e) => handleRangeChange(Number(e.target.value), 1)}
              className="range-thumb absolute w-full appearance-none bg-transparent"
              style={{ zIndex: 2 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-[#2B3037]">
          <div className="flex items-center gap-2 rounded-lg border border-[#E4E6EB] px-3 py-2">
            <input
              type="text"
              value={minInput ? parseInt(minInput).toLocaleString("vi-VN") : ""}
              onChange={handleMinPriceInput}
              onBlur={handleMinPriceBlur}
              className="flex-1 bg-transparent outline-none min-w-0"
              aria-label="Giá tối thiểu"
              placeholder="0"
            />
            <span className="whitespace-nowrap">VND</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#E4E6EB] px-3 py-2">
            <input
              type="text"
              value={maxInput ? parseInt(maxInput).toLocaleString("vi-VN") : ""}
              onChange={handleMaxPriceInput}
              onBlur={handleMaxPriceBlur}
              className="flex-1 bg-transparent outline-none min-w-0"
              aria-label="Giá tối đa"
              placeholder="0"
            />
            <span className="whitespace-nowrap">VND</span>
          </div>
        </div>
      </div>

      {/* Star Rating Filter */}
      <div className="mb-8 border-t border-[#E4E6EB] pt-6">
        <h4 className="mb-4 font-semibold text-[#2B3037]">Đánh giá sao</h4>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => (
            <label key={star} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStarRatings.includes(star)}
                onChange={() => handleStarRatingChange(star)}
                className="h-5 w-5 rounded border-[#E4E6EB] text-[#0057FF]"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#2B3037]">{star}</span>
                <img
                  src="https://ik.imagekit.io/tvlk/image/imageResource/2024/05/13/1715575526353-f84706e8ff60eebdb59c3e338fe33e4b.png?tr=h-16,q-75,w-16"
                  alt="star"
                  width="16"
                  height="16"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Guest Rating Filter */}
      <div className="mb-8 border-t border-[#E4E6EB] pt-6">
        <h4 className="mb-4 font-semibold text-[#2B3037]">Đánh giá từ khách</h4>
        <div className="space-y-3">
          {[
            { value: 9, label: "Tuyệt hảo", rating: "9+" },
            { value: 8, label: "Ấn tượng", rating: "8+" },
            { value: 7, label: "Thuận tiện", rating: "7+" },
            { value: 6, label: "Tạm ổn", rating: "6+" }
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGuestRatings.includes(option.value)}
                  onChange={() => handleGuestRatingChange(option.value)}
                  className="h-5 w-5 rounded border-[#E4E6EB] text-[#0057FF]"
                />
                <span className="text-sm text-[#2B3037]">
                  {option.rating && <span className="text-[#0071CE] font-semibold">{option.rating} </span>}
                  {option.label}
                </span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-8 border-t border-[#E4E6EB] pt-6">
        <h4 className="mb-4 font-semibold text-[#2B3037]">Tiện nghi</h4>
        <div className="space-y-3">
          {displayedAmenities.map((amenity) => (
            <label key={amenity} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
                className="h-5 w-5 rounded border-[#E4E6EB] text-[#0057FF]"
              />
              <span className="text-sm text-[#2B3037]">{amenity}</span>
            </label>
          ))}
        </div>
        {amenityOptions.length > DISPLAY_AMENITIES_COUNT && (
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[#0071CE] hover:underline"
            onClick={() => setShowAllAmenities(!showAllAmenities)}
          >
            {showAllAmenities ? "Ẩn" : `Xem tất cả (${amenityOptions.length})`}
          </button>
        )}
      </div>

      <fieldset className="border-t pt-6 space-y-3">
        <legend className="font-semibold pt-4">Loại hình lưu trú</legend>
        {catalog.loading && <p>Đang tải loại hình…</p>}
        {catalog.error && <p role="alert">Không tải được danh mục. <button type="button" className="underline" onClick={catalog.retry}>Thử lại danh mục</button></p>}
        {!catalog.loading && !catalog.error && catalog.options.map(option=><label key={option.code} className="flex gap-3 items-center">
          <input type="checkbox" checked={value.accommodationTypes.includes(option.code)} onChange={()=>onFilterChange({accommodationTypes:value.accommodationTypes.includes(option.code)?value.accommodationTypes.filter(c=>c!==option.code):[...value.accommodationTypes,option.code]})}/>{option.label}
        </label>)}
        {invalidTypes.length>0 && <p role="alert">Loại hình trong URL không hợp lệ: {invalidTypes.join(', ')}.</p>}
        {value.accommodationTypes.length>0 && <button type="button" className="underline" onClick={()=>onFilterChange({accommodationTypes:[]})}>Xóa bộ lọc loại hình</button>}
      </fieldset>
      {/* Results Count */}
      {totalResults !== null && <div className="mt-8 rounded-lg bg-[#E8EFFC] px-4 py-3 text-center text-sm font-semibold text-[#0057FF]">
        {totalResults} kết quả
      </div>}
      <style jsx global>{`
        input[type='range'].range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #0D6EFD;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          pointer-events: all;
          margin-top: -6px;
        }
        input[type='range'].range-thumb::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #0D6EFD;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          pointer-events: all;
        }
        input[type='range'].range-thumb::-ms-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #0D6EFD;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          pointer-events: all;
        }
        input[type='range'].range-thumb {
          height: 24px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
