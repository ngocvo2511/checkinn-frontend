'use client';

import { useState, useEffect } from 'react';
import type { City } from '@/lib/api/cities';
import { cityApi } from '@/lib/api/cities';

interface HotelLocationPickerProps {
  onCitySelect: (city: City | null) => void;
  initialHotelName?: string;
}

export function HotelLocationPicker({ onCitySelect, initialHotelName }: HotelLocationPickerProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const popularCityNames = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Nha Trang', 'Đà Lạt', 'Vũng Tàu'];

  const buildSubtitle = (city: City): string => {
    const parent = city.parentName || city.parentCode;
    if (!parent) {
      return `Tỉnh ${city.name}, Việt Nam`;
    }
    return `${parent}, Việt Nam`;
  };

  useEffect(() => {
    const loadAllCities = async () => {
      try {
        setLoading(true);
        const allCities = await cityApi.getAllLocations();
        setCities(allCities);
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllCities();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities([]);
    } else {
      const searchCities = async () => {
        try {
          const results = await cityApi.searchLocations(searchTerm);
          setFilteredCities(results);
        } catch (error) {
          console.error('Failed to search cities:', error);
        }
      };
      searchCities();
    }
  }, [searchTerm]);

  return (
    <div className="w-full min-w-[400px] md:w-[520px]">
      {/* Search Input */}
      <div className="border-b border-[#E4E6EB] px-6 py-4">
        <div className="relative">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B94A4]"
          >
            <path
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"
              fill="currentColor"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-[#E4E6EB] bg-[#F7F8FA] pl-10 pr-4 py-3 text-sm placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Cities List */}
      <div className="max-h-72 overflow-y-auto">
        {loading && (
          <div className="px-6 py-8 text-center text-sm text-[#8B94A4]">
            Đang tải...
          </div>
        )}

        {!loading && searchTerm && filteredCities.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-[#8B94A4]">
            Không tìm thấy kết quả
          </div>
        )}

        {!loading && searchTerm && filteredCities.length > 0 && (
          <div className="px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B94A4] mb-3">
              Kết quả tìm kiếm ({filteredCities.length})
            </p>
            <div className="space-y-3">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => onCitySelect(city)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-[#F7FAFF] transition"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-sm font-semibold text-[#1F2933]">{city.name}</p>
                    <p className="text-xs text-[#6B7280]">{buildSubtitle(city)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-[#E8EFFC] px-3 py-1 text-xs font-semibold text-[#0057FF]">Chọn</span>
                    {city.hotelCount !== undefined && city.hotelCount !== null && (
                      <span className="text-[11px] font-semibold text-[#4B5563]">{city.hotelCount.toLocaleString()} khách sạn</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && !searchTerm && cities.length > 0 && (
          <div className="px-6 py-4">
            <p className="text-sm font-semibold text-[#111827] mb-4">Điểm đến phổ biến</p>
            <div className="space-y-2">
              {cities
                .filter((c) => popularCityNames.includes(c.name))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onCitySelect(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-sm hover:-translate-y-[1px] hover:border-[#CCE0FF] hover:bg-[#F7FAFF] transition"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-[#111827]">{item.name}</p>
                      <p className="text-xs text-[#6B7280]">{buildSubtitle(item)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                      <span className="rounded-full bg-[#E8F2FF] px-3 py-1 text-xs font-semibold text-[#1E64DD]">
                        {item.parentName ? 'Thành Phố' : 'Tỉnh'}
                      </span>
                      {item.hotelCount !== undefined && item.hotelCount !== null && (
                        <span className="text-xs font-semibold text-[#374151]">{item.hotelCount.toLocaleString()} khách sạn</span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
