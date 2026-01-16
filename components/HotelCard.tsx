"use client";

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

interface HotelCardProps {
  hotel: Hotel;
  onSelect?: (hotel: Hotel) => void;
}

export function HotelCard({ hotel, onSelect }: HotelCardProps) {
  const discount = hotel.originalPrice
    ? Math.round(((hotel.originalPrice - hotel.price) / hotel.originalPrice) * 100)
    : 0;

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "bg-[#10B981] text-white";
    if (rating >= 8) return "bg-[#F59E0B] text-white";
    return "bg-[#EF4444] text-white";
  };

  const getRatingText = (rating: number) => {
    if (rating >= 9) return "Xuất sắc";
    if (rating >= 8) return "Rất tốt";
    if (rating >= 7) return "Tốt";
    return "Tạm ổn";
  };

  return (
    <div className="flex gap-4 rounded-2xl border border-[#DDDFE3] bg-white p-4 hover:shadow-lg hover:border-[#0057FF] transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl group">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
        />
        {discount > 0 && (
          <div className="absolute right-3 top-3 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{discount}%
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#1F2226] mb-4">{hotel.name}</h3>

            {/* Star Rating */}
            {hotel.starRating && hotel.starRating > 0 && (
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={index < hotel.starRating! ? "#F59E0B" : "#E5E7EB"}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-[#656F81] mb-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill="currentColor"
                />
              </svg>
              <span>{hotel.location}</span>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2 mb-3">
              {hotel.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={`${amenity}-${index}`}
                  className="px-3 py-1 rounded-md text-xs text-[#2B3037]"
                  style={{ backgroundColor: 'rgb(240, 241, 242)' }}
                >
                  {amenity}
                </span>
              ))}
            </div>

            {/* Loyalty Points */}
            {hotel.loyaltyPoints !== undefined && hotel.loyaltyPoints > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-[#2B3037] w-fit"
                style={{ backgroundColor: 'rgb(255, 241, 206)' }}
              >
                <img
                  src="https://d1785e74lyxkqq.cloudfront.net/_next/static/v4.6.0/c/cf2d96ff2bdb7e3c4e859db45e9d89f9.svg"
                  alt="loyalty points"
                  width="16"
                  height="16"
                />
                <span className="font-semibold text-[#732B06]">{hotel.loyaltyPoints} Points</span>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end justify-between h-full min-h-[175px]">
            {/* Rating */}
            {hotel.rating > 0 && hotel.rating >= 6 ? (
              <div className="text-right">
                <p className="text-sm text-[#0071CE]">
                  <span className="font-bold">{hotel.rating}/10</span>{" "}
                  <span className="font-normal">{getRatingText(hotel.rating)}</span>
                </p>
                <p className="text-xs  text-[#707577]">({hotel.reviewCount} đánh giá)</p>
              </div>
            ) : (
              <div></div>
            )}

            {/* Price Section */}
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                {hotel.originalPrice && (
                  <p className="text-sm line-through text-[#8B94A4]">
                    {hotel.originalPrice.toLocaleString("vi-VN")} VND
                  </p>
                )}
                <p className="text-2xl font-bold text-red-500">
                  {hotel.price.toLocaleString("vi-VN")} VND
                </p>
                {hotel.availableRooms !== undefined && hotel.availableRooms > 0 && (
                  <p className="text-xs text-[#8B94A4]">
                    Chỉ còn {hotel.availableRooms} phòng có giá này!
                  </p>
                )}
              </div>

              <button
                className="rounded-lg bg-[#FF5E1F] px-6 py-2 font-semibold text-white hover:bg-[#DC3741] transition"
                onClick={() => onSelect?.(hotel)}
              >
                Chọn phòng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
