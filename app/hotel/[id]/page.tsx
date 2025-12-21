"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import hotelApi, { Hotel as ApiHotel, RoomType, MediaAsset } from "@/lib/api/hotels";

type Review = {
  id: string;
  name: string;
  rating: number;
  content: string;
  date: string;
};

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return "Liên hệ";
  return `${value.toLocaleString("vi-VN")} VND`;
};

const fallbackAmenities = [
  "Wi-Fi miễn phí",
  "Hồ bơi",
  "Nhà hàng",
  "Lễ tân 24h",
  "Chỗ đậu xe",
  "Máy lạnh",
];

export default function HotelDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hotelId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [hotel, setHotel] = useState<ApiHotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("photos");
  const [showAllImages, setShowAllImages] = useState(false);

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";
  const rooms = searchParams.get("rooms") || "1";

  const sectionList = useMemo(
    () => [
      { id: "photos", label: "Hình ảnh" },
      { id: "overview", label: "Tổng quan" },
      { id: "rooms", label: "Phòng" },
      { id: "amenities", label: "Tiện ích" },
      { id: "policies", label: "Chính sách" },
      { id: "reviews", label: "Đánh giá" },
    ],
    []
  );

  useEffect(() => {
    const fetchDetail = async () => {
      if (!hotelId) {
        setError("Thiếu mã khách sạn");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await hotelApi.getHotelById(hotelId);
        setHotel(data);
      } catch (err: any) {
        setError(err?.message || "Không thể tải thông tin khách sạn");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [hotelId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.25 }
    );

    sectionList.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionList, hotel]);

  const heroImages: MediaAsset[] = useMemo(() => {
    if (!hotel) return [];
    const hotelImages = hotel.mediaAssets || [];
    const roomImages = (hotel.roomTypes || []).flatMap((rt) => rt.mediaAssets || []);
    const merged = [...hotelImages, ...roomImages];
    const uniqueByUrl = new Map<string, MediaAsset>();
    merged.forEach((m) => {
      if (!uniqueByUrl.has(m.url)) {
        uniqueByUrl.set(m.url, m);
      }
    });
    return Array.from(uniqueByUrl.values()).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [hotel]);

  const availableRooms: RoomType[] = useMemo(() => {
    if (!hotel?.roomTypes) return [];
    return hotel.roomTypes
      .filter((rt) => rt.isActive !== false)
      .sort((a, b) => (a.basePrice ?? a.pricePerNight ?? 0) - (b.basePrice ?? b.pricePerNight ?? 0));
  }, [hotel]);

  const amenityList = useMemo(() => {
    if (hotel?.amenities && hotel.amenities.length > 0) return hotel.amenities;
    const collected = new Set<string>();
    (hotel?.roomTypes || []).forEach((rt) => {
      (rt.amenities || []).forEach((a) => collected.add(a));
    });
    const items = Array.from(collected);
    return items.length > 0 ? items : fallbackAmenities;
  }, [hotel]);

  const reviews: Review[] = useMemo(
    () => [
      {
        id: "1",
        name: "Minh Trang",
        rating: 9.2,
        content: "Phòng sạch, gần biển, nhân viên thân thiện. Bữa sáng ổn.",
        date: "02/12/2025",
      },
      {
        id: "2",
        name: "Hoàng Long",
        rating: 8.8,
        content: "View biển đẹp, hồ bơi vô cực xịn. Đề xuất đặt phòng có ban công.",
        date: "18/11/2025",
      },
    ],
    []
  );

  const primaryImage = heroImages[0]?.url || "/placeholder-hotel.jpg";
  const secondaryImages = heroImages.slice(1, 5);
  const visibleSecondaryImages = useMemo(() => (showAllImages ? heroImages.slice(1) : secondaryImages), [heroImages, secondaryImages, showAllImages]);
  const ratingScore = hotel?.starRating ?? 8.9;
  const lowestPrice = hotel?.lowestPrice ?? 0;
  const reviewCount = (hotel as any)?.reviewCount ?? reviews.length ?? 0;

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 72; // offset for sticky tabs
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleBookRoom = (room: RoomType) => {
    const bookingParams = new URLSearchParams({
      hotelId: hotel?.id || "",
      hotelName: hotel?.name || "",
      roomId: room.id,
      roomName: room.name,
      roomPrice: String(room.basePrice ?? room.pricePerNight ?? 0),
      checkIn: checkIn,
      checkOut: checkOut,
      adults: adults,
      children: children,
      rooms: rooms,
    });
    router.push(`/booking?${bookingParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#2B3037]">Đang tải...</div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || "Không tìm thấy khách sạn"}
      </div>
    );
  }

  return (
    <div className="bg-white text-[#111827]">
      <Header user={null} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />

      <main className="bg-[#F8FAFC] pb-12">
        <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
          <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 flex items-center gap-2 overflow-x-auto py-3">
            {sectionList.map((section) => (
              <button
                key={section.id}
                onClick={() => handleScrollTo(section.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeSection === section.id
                    ? "bg-[#0F172A] text-white shadow"
                    : "text-[#4B5563] hover:text-[#0F172A] hover:bg-[#E5E7EB]"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Photos */}
        <section id="photos" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-8">
          <div className="relative">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 h-full">
                <img
                  src={primaryImage}
                  alt={hotel.name}
                  className="h-[420px] w-full object-cover rounded-2xl shadow-sm"
                />
              </div>

              {visibleSecondaryImages.map((img) => (
                <img
                  key={img.id || img.url}
                  src={img.url}
                  alt={hotel.name}
                  className="h-48 w-full object-cover rounded-2xl shadow-sm"
                />
              ))}

              {visibleSecondaryImages.length === 0 && (
                <div className="h-48 w-full rounded-2xl bg-[#E5E7EB] flex items-center justify-center text-[#6B7280]">
                  Chưa có hình ảnh khác
                </div>
              )}
            </div>

            {heroImages.length > 5 && !showAllImages && (
              <button
                className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#0F172A] shadow hover:bg-white"
                onClick={() => setShowAllImages(true)}
              >
                Xem tất cả {heroImages.length} hình ảnh
              </button>
            )}

            {showAllImages && heroImages.length > 5 && (
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-full bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#111827]"
                  onClick={() => setShowAllImages(false)}
                >
                  Thu gọn
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Overview: rating + main amenities */}
        <section id="overview" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-8">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-[#6B7280]">Đánh giá tổng quan</p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-[#0F172A]">{ratingScore.toFixed(1)}</span>
                    <span className="text-sm text-[#4B5563]">/ 10 · Xuất sắc</span>
                  </div>
                  <p className="text-sm text-[#4B5563]">Dựa trên khoảng {reviewCount || "nhiều"} đánh giá</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9CA3AF]">Giá/phòng/đêm từ</p>
                  <p className="text-2xl font-bold text-[#DC2626]">{formatPrice(Number(lowestPrice))}</p>
                  <p className="text-xs text-[#9CA3AF]">Chưa gồm thuế & phí</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-[#4B5563]">
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-green-700 text-xs font-semibold">
                  ★ {ratingScore.toFixed(1)} Xuất sắc
                </span>
                <span className="text-[#6B7280]">·</span>
                <span>{reviewCount || "Nhiều"} lượt đánh giá</span>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm text-[#4B5563]">
                <p className="font-semibold text-[#111827] mb-1">Khách nói gì</p>
                <p>
                  {hotel.description || "Phòng sạch, gần biển, tiện nghi đầy đủ và dịch vụ thân thiện."}
                </p>
              </div>

              <div className="flex flex-wrap justify-between gap-3 items-center">
                <p className="text-sm text-[#4B5563]">Xem chi tiết trải nghiệm từ khách đã lưu trú.</p>
                <button
                  onClick={() => handleScrollTo("reviews")}
                  className="inline-flex justify-center rounded-lg bg-[#2563EB] px-5 py-2 text-white font-semibold shadow hover:bg-[#1D4ED8] transition"
                >
                  Xem đánh giá
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-[#0F172A]">Tiện nghi chính</p>
                <span className="text-sm text-[#6B7280]">Nổi bật</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#374151]">
                {amenityList.slice(0, 8).map((a) => (
                  <div key={a} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#2563EB]"></span>
                    {a}
                  </div>
                ))}
              </div>
              {amenityList.length > 8 && (
                <p className="text-xs text-[#6B7280]">Xem thêm trong phần tiện ích chi tiết bên dưới.</p>
              )}
            </div>
          </div>
        </section>

        {/* Rooms */}
        <section id="rooms" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0F172A]">Những phòng còn trống</h2>
            <span className="text-sm text-[#6B7280]">Giá theo mỗi phòng/đêm, chưa gồm thuế & phí</span>
          </div>

          <div className="space-y-4">
            {availableRooms.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white p-6 text-[#6B7280]">
                Chưa có phòng khả dụng.
              </div>
            )}

            {availableRooms.map((room) => {
              const roomPrice = room.basePrice ?? room.pricePerNight ?? 0;
              const roomImage = room.mediaAssets?.[0]?.url || "/placeholder-room.jpg";
              const capacityText = room.capacity
                ? `${room.capacity.adults} người lớn${room.capacity.children ? `, ${room.capacity.children} trẻ em` : ""}`
                : "Tối đa 2 khách";
              const roomArea = room.roomSize ? `${room.roomSize} m²` : null;
              const roomAmenities = (room.amenities && room.amenities.length > 0 ? room.amenities : amenityList).slice(0, 6);
              return (
                <div key={room.id} className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:grid-cols-[280px_1.2fr_0.9fr_130px]">
                  <div className="relative h-48 md:h-52 w-full overflow-hidden rounded-xl">
                    <img src={roomImage} alt={room.name} className="h-full w-full object-cover" />
                    {room.totalRooms !== undefined && (
                      <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#DC2626] shadow">Chỉ còn {room.totalRooms} phòng</span>
                    )}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full text-xs text-[#111827] shadow">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#111827]"></span>
                      {room.mediaAssets?.length || 1} ảnh
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-[#0F172A]">{room.name}</h3>
                      {roomArea && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] px-2 py-1 text-xs text-[#374151]">
                          {roomArea}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#4B5563]">{room.description || "Phòng đầy đủ tiện nghi, phù hợp cho chuyến đi nghỉ dưỡng."}</p>
                    <div className="text-sm text-[#4B5563] flex items-center gap-2">
                      <span className="font-semibold">Sức chứa:</span>
                      <span>{capacityText}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-[#374151]">
                      {roomAmenities.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-[#4B5563]">
                    <p className="text-base font-semibold text-[#0F172A]">Lựa chọn phòng</p>
                    <p className="font-semibold">Bữa sáng cho 3 người</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛏</span>
                      <span>{room.bedType || "Giường linh hoạt"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      <span>Không được hoàn tiền</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right space-y-1">
                      <p className="text-xs text-[#9CA3AF]">Giá/phòng/đêm</p>
                      <p className="text-2xl font-bold text-[#DC2626]">{formatPrice(Number(roomPrice))}</p>
                      <p className="text-[11px] text-[#9CA3AF]">Chưa bao gồm thuế & phí</p>
                    </div>
                    <button 
                      onClick={() => handleBookRoom(room)}
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-white font-semibold shadow hover:bg-[#1D4ED8] transition"
                    >
                      Chọn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Amenities */}
        <section id="amenities" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0F172A]">Tiện ích của khách sạn</h2>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {amenityList.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-[#374151]">
                  <span className="h-2 w-2 rounded-full bg-[#2563EB]"></span>
                  {a}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Policies & FAQ */}
        <section id="policies" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Chính sách</h3>
              <ul className="space-y-2 text-sm text-[#4B5563]">
                <li>Nhận phòng từ 14:00 · Trả phòng trước 12:00</li>
                <li>Hủy phòng tùy điều kiện từng hạng phòng</li>
                <li>Xuất trình CMND/CCCD khi nhận phòng</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Câu hỏi thường gặp</h3>
              <div className="space-y-3 text-sm text-[#4B5563]">
                <div>
                  <p className="font-semibold text-[#111827]">Giá phòng đã bao gồm bữa sáng chưa?</p>
                  <p>Phụ thuộc từng hạng phòng, vui lòng xem trong phần mô tả chi tiết.</p>
                </div>
                <div>
                  <p className="font-semibold text-[#111827]">Khách sạn có chỗ đậu xe không?</p>
                  <p>Có, vui lòng liên hệ lễ tân để được hỗ trợ.</p>
                </div>
                <div>
                  <p className="font-semibold text-[#111827]">Giờ nhận và trả phòng?</p>
                  <p>Nhận phòng từ 14:00, trả phòng trước 12:00.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0F172A]">Đánh giá</h2>
            <span className="text-sm text-[#6B7280]">Tổng quan: {ratingScore.toFixed(1)}/10</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#111827]">{r.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{r.date}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-green-700 text-sm font-semibold">
                    ★ {r.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-[#4B5563] leading-relaxed">{r.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
