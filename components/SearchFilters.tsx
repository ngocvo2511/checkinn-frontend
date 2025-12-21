"use client";

import { useState } from "react";

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
  totalResults: number;
}

export function SearchFilters({ onFilterChange, totalResults }: SearchFiltersProps) {
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const amenityOptions = ["Free WiFi", "No cancellation", "Breakfast included", "Swimming pool"];
  const typeOptions = ["Hotel", "Villa", "Apartment", "Guest House"];

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newRange = [...priceRange];
    newRange[index] = parseInt(e.target.value);
    if (newRange[0] <= newRange[1]) {
      setPriceRange(newRange);
      onFilterChange({ priceRange: newRange, amenities, types });
    }
  };

  const handleAmenityChange = (amenity: string) => {
    const newAmenities = amenities.includes(amenity)
      ? amenities.filter((a) => a !== amenity)
      : [...amenities, amenity];
    setAmenities(newAmenities);
    onFilterChange({ priceRange, amenities: newAmenities, types });
  };

  const handleTypeChange = (type: string) => {
    const newTypes = types.includes(type)
      ? types.filter((t) => t !== type)
      : [...types, type];
    setTypes(newTypes);
    onFilterChange({ priceRange, amenities, types: newTypes });
  };

  return (
    <div className="h-fit sticky top-24 rounded-2xl border border-[#DDDFE3] bg-white p-6">
      <h3 className="mb-6 text-lg font-bold text-[#2B3037]">Bộ lọc</h3>

      {/* Price Range */}
      <div className="mb-8">
        <h4 className="mb-4 font-semibold text-[#2B3037]">Khoảng giá</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#8B94A4]">Tối thiểu</label>
            <input
              type="number"
              min="0"
              max={priceRange[1]}
              value={priceRange[0]}
              onChange={(e) => handlePriceChange(e, 0)}
              className="w-full rounded-lg border border-[#E4E6EB] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#8B94A4]">Tối đa</label>
            <input
              type="number"
              min={priceRange[0]}
              value={priceRange[1]}
              onChange={(e) => handlePriceChange(e, 1)}
              className="w-full rounded-lg border border-[#E4E6EB] px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-lg bg-[#F7F8FA] px-3 py-2 text-center text-sm font-semibold text-[#0057FF]">
            {priceRange[0].toLocaleString("vi-VN")} - {priceRange[1].toLocaleString("vi-VN")} VND
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-8 border-t border-[#E4E6EB] pt-6">
        <h4 className="mb-4 font-semibold text-[#2B3037]">Tiện nghi</h4>
        <div className="space-y-3">
          {amenityOptions.map((amenity) => (
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
      </div>

      {/* Property Type */}
      <div className="border-t border-[#E4E6EB] pt-6">
        <h4 className="mb-4 font-semibold text-[#2B3037]">Loại chỗ ở</h4>
        <div className="space-y-3">
          {typeOptions.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={types.includes(type)}
                onChange={() => handleTypeChange(type)}
                className="h-5 w-5 rounded border-[#E4E6EB] text-[#0057FF]"
              />
              <span className="text-sm text-[#2B3037]">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-8 rounded-lg bg-[#E8EFFC] px-4 py-3 text-center text-sm font-semibold text-[#0057FF]">
        {totalResults} kết quả
      </div>
    </div>
  );
}
