import { useState, useEffect, useRef } from "react";
import { cityApi, type City } from "@/lib/api/cities";

interface LocationSearchProps {
  onCitySelect?: (city: City | null) => void;
}

export function LocationSearch({ onCitySelect }: LocationSearchProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const popularCodes = ["DN", "DAL", "VTA", "NT"];

  const typeLabel: Record<string, string> = {
    PROVINCE: "Tỉnh",
    CITY: "Thành Phố",
  };

  // Popular cities to show when dropdown first opens
  const popularCityCodes = ["HN", "HCM", "DN", "NT", "DAL", "VTA", "CT"];

  const buildSubtitle = (city: City): string => {
    const parent = city.parentName || city.parentCode;

    // Cities without parent are provinces (old province records migrated from cities table)
    if (!parent) {
      return `Tỉnh ${city.name}, Việt Nam`;
    }

    // Cities with parent are sub-cities under provinces
    return `${parent}, Việt Nam`;
  };

  useEffect(() => {
    // Fetch locations from backend
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const data = await cityApi.getAllLocations();
        setCities(data);
      } catch (err) {
        setError("Failed to load locations");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && cities.length === 0) {
      fetchLocations();
    }
  }, [isOpen, cities.length]);

  useEffect(() => {
    // Search locations from backend
    const searchLocations = async () => {
      if (searchQuery.trim() === "") {
        setFilteredCities([]);
      } else {
        try {
          const data = await cityApi.searchLocations(searchQuery);
          setFilteredCities(data);
        } catch (err) {
          console.error("Search failed:", err);
          setFilteredCities([]);
        }
      }
    };

    searchLocations();
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setIsOpen(false);
    setSearchQuery("");
    onCitySelect?.(city);
  };

  const selectByCode = (code: string, fallbackName: string) => {
    const found = cities.find((c) => c.code === code);
    if (found) return handleSelectCity(found);
    // Fallback stub if not yet loaded
    handleSelectCity({
      id: code,
      name: fallbackName,
      code,
      latitude: 0,
      longitude: 0,
      createdAt: new Date().toISOString(),
      type: "CITY",
      parentId: null,
      hotelCount: 0,
    } as any);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full min-h-[72px] text-left rounded-2xl border border-[#E4E6EB] bg-white px-6 py-4 hover:border-[#0057FF] hover:bg-[#F7FAFF] transition md:rounded-none md:border-0 md:border-r md:border-r-[#E4E6EB] md:px-6 md:py-3 flex items-center"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B94A4]">
            Location
          </p>
          <p className="text-sm font-medium text-[#2B3037]">
            {selectedCity ? selectedCity.name : "Where are you going?"}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[320px] md:w-[520px] md:max-w-[560px] rounded-2xl border border-[#E4E6EB] bg-white shadow-2xl">
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
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-[#E4E6EB] bg-[#F7F8FA] pl-10 pr-4 py-3 text-sm placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Cities List */}
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="px-6 py-8 text-center text-sm text-[#8B94A4]">
                Loading destinations...
              </div>
            )}

            {error && (
              <div className="px-6 py-8">
                <div className="rounded-lg bg-red-50 px-4 py-3 mb-3 text-sm text-red-600">
                  <p className="font-semibold">Error loading destinations</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
                <p className="text-xs text-[#8B94A4] text-center">
                  Make sure the backend API Gateway is running on port 8080
                </p>
              </div>
            )}

            {!loading && !error && filteredCities.length === 0 && searchQuery && (
              <div className="px-6 py-8 text-center text-sm text-[#8B94A4]">
                No destinations found
              </div>
            )}

            {!loading && !error && searchQuery && filteredCities.length > 0 && (
              <div className="px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B94A4] mb-3">
                  Search Results ({filteredCities.length})
                </p>
                <div className="space-y-3">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className="flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-[#F7FAFF] transition"
                    >
                      <div className="flex flex-col gap-1">
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

            {!loading && !error && !searchQuery && (
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-[#111827] mb-4">Điểm đến phổ biến</p>
                <div className="space-y-2">
                  {(cities.filter((c) => popularCodes.includes(c.code)) as City[]).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectCity(item)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-sm hover:-translate-y-[1px] hover:border-[#CCE0FF] hover:bg-[#F7FAFF] transition"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-[#111827]">{item.name}</p>
                        <p className="text-xs text-[#6B7280]">{buildSubtitle(item)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 min-w-[120px]">
                        <span className="rounded-full bg-[#E8F2FF] px-3 py-1 text-xs font-semibold text-[#1E64DD]">
                          {item.parentName ? "Thành Phố" : "Tỉnh"}
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
      )}
    </div>
  );
}
