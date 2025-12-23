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
  amenities: string[];
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
            <h3 className="text-lg font-bold text-[#1F2226] mb-2">{hotel.name}</h3>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${getRatingColor(
                  hotel.rating
                )}`}
              >
                {hotel.rating}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2B3037]">
                  {getRatingText(hotel.rating)}
                </p>
                <p className="text-xs text-[#8B94A4]">({hotel.reviewCount} đánh giá)</p>
              </div>
            </div>

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
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  fill="currentColor"
                />
              </svg>
              <span>{hotel.location}</span>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-1 text-xs text-[#0057FF]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                      fill="currentColor"
                    />
                  </svg>
                  {amenity}
                </div>
              ))}
            </div>
          </div>

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
              <p className="text-xs text-[#8B94A4]">Chỉ còn 2 phòng có giá này!</p>
            </div>

            <button
              className="mt-auto rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 transition"
              onClick={() => onSelect?.(hotel)}
            >
              Chọn phòng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
