"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { hotelApi, Hotel as ApiHotel, RoomType, MediaAsset } from "@/lib/api/hotels";

type Review = {
  id: string;
  name: string;
  rating: number;
  content: string;
  date: string;
};

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return "Liên hệ";
  return value.toLocaleString("vi-VN");
};

const fallbackAmenities = [
  "Wi-Fi miễn phí",
  "Hồ bơi",
  "Nhà hàng",
  "Lễ tân 24h",
  "Chỗ đậu xe",
  "Máy lạnh",
];

const fallbackPolicies = [
  "Nhận phòng từ 14:00 · Trả phòng trước 12:00",
  "Hủy phòng tùy điều kiện từng hạng phòng",
  "Xuất trình CMND/CCCD khi nhận phòng",
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
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [roomModal, setRoomModal] = useState<{ room: RoomType | null; index: number }>({ room: null, index: 0 });

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

  const policyList = useMemo(() => {
    if (hotel?.policies && hotel.policies.length > 0) return hotel.policies;
    return fallbackPolicies;
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
  const amenityCategories = hotel?.amenityCategories || [];
  const hasAmenityCategories = amenityCategories.length > 0;

  const modalImages = useMemo(() => {
    if (!roomModal.room) return [];
    const assets = roomModal.room.mediaAssets || [];
    // Sắp xếp: thumbnail lên đầu, sau đó sort_order tăng dần
    const sorted = [...assets].sort((a, b) => {
      if (a.is_thumbnail && !b.is_thumbnail) return -1;
      if (!a.is_thumbnail && b.is_thumbnail) return 1;
      // Nếu cùng loại, sort theo sort_order (null/undefined về cuối)
      const aOrder = a.sort_order ?? 9999;
      const bOrder = b.sort_order ?? 9999;
      return aOrder - bOrder;
    });
    const imgs = sorted.map((m) => m.url).filter(Boolean);
    return imgs.length > 0 ? imgs : ["/placeholder-room.jpg"];
  }, [roomModal]);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 72; // offset for sticky tabs
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleBookRoom = (room: RoomType) => {
    // Check if selecting different room type when quantity > 1
    const roomQuantity = Number(rooms) || 1;
    if (roomQuantity > 1 && selectedRoomType && selectedRoomType !== room.id) {
      alert("Khi đặt nhiều hơn 1 phòng, bạn phải chọn cùng loại phòng");
      return;
    }

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
      quantity: rooms,
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#0F172A]">Những phòng còn trống</h2>
            <span className="text-sm text-[#6B7280]">Giá theo mỗi phòng/đêm, chưa gồm thuế & phí</span>
          </div>

          {Number(rooms) > 1 && (
            <div className="mb-6 p-4 rounded-lg bg-[#F0F9FF] border border-[#0284C7]">
              <p className="text-sm text-[#0F172A] font-semibold">
                ℹ️ Bạn cần chọn <span className="font-bold text-[#DC2626]">{rooms} phòng cùng loại</span>
              </p>
            </div>
          )}

          {availableRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white p-6 text-[#6B7280]">
              Chưa có phòng khả dụng.
            </div>
          ) : (
            <div className="space-y-4">
              {availableRooms.map((room) => {
                const roomPrice = room.basePrice ?? room.pricePerNight ?? 0;
                const roomImage = room.mediaAssets?.[0]?.url || "/placeholder-room.jpg";
                const roomName = room.name?.replace(/^"(.*)"$/, "$1") || room.name;
                const roomAdults = room.capacity?.adults || 2;
                const roomChildren = room.capacity?.children || 0;
                return (
                  <div key={room.id} className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:grid-cols-[280px_1fr]">
                    {/* Left: Image and Name */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{roomName}</h3>
                      </div>
                      <div className="relative h-48 w-full overflow-hidden rounded-xl">
                        <img src={roomImage} alt={room.name} className="h-full w-full object-cover" />
                        {room.totalRooms !== undefined && (
                          <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#DC2626] shadow">Chỉ còn {room.totalRooms} phòng</span>
                        )}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/85 px-3 py-1 rounded-full text-xs text-[#111827] shadow">
                            <span className="inline-block h-2 w-2 rounded-full bg-[#111827]"></span>
                            {room.mediaAssets?.length || 1} ảnh
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setRoomModal({ room, index: 0 })}
                        className="text-sm font-semibold text-[#2563EB] hover:underline text-left"
                      >
                        Xem chi tiết phòng
                      </button>
                    </div>

                    {/* Right: Table */}
                    <div className="flex flex-col mt-[48px] border border-[#E5E7EB] rounded-lg overflow-hidden h-fit w-full">
                      {/* Table Header */}
                      <div className="grid grid-cols-[1fr_120px_140px_80px_100px] gap-0 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <div className="text-sm font-semibold text-[#0F172A] border-r border-[#E5E7EB] px-4 py-3">Lựa chọn phòng</div>
                        <div className="text-sm font-semibold text-[#0F172A] text-center border-r border-[#E5E7EB] px-4 py-3">Khách</div>
                        <div className="text-sm font-semibold text-[#0F172A] border-r border-[#E5E7EB] px-4 py-3">Giá/phòng/đêm</div>
                        <div className="text-sm font-semibold text-[#0F172A] text-center border-r border-[#E5E7EB] px-4 py-3">Phòng</div>
                        <div className="px-4 py-3"></div>
                      </div>

                      {/* Table Body */}
                      <div className="grid grid-cols-[1fr_120px_140px_80px_100px] gap-0 items-start hover:bg-[#F9FAFB] transition">
                        {/* Column 1: Room Details */}
                        <div className="flex flex-col gap-2 flex-1 border-r border-[#E5E7EB] px-4 py-3">
                          {room.capacity?.breakfastIncluded ? (
                            <p className="text-sm text-[#374151] font-medium">Bữa sáng cho {room.capacity.breakfastQuantity || (roomAdults + roomChildren)} người</p>
                          ) : (
                            <p className="text-sm text-[#9CA3AF]">Không bao gồm bữa sáng</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <span>🛏</span>
                            <span>{room.capacity?.bedType || "Giường linh hoạt"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <span>✅</span>
                            <span>Không được hoàn tiền</span>
                          </div>
                        </div>

                        {/* Column 2: Guests */}
                        <div className="flex items-start gap-3 justify-center border-r border-[#E5E7EB] px-4 py-3 h-full">
                          <div className="flex items-center gap-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.44954 20.6443C3.3058 21.3665 3.88623 22 4.62267 22H19.3773C20.1138 22 20.6942 21.3665 20.5505 20.6443C19.9516 17.635 17.9884 13 12 13C6.01165 13 4.04844 17.635 3.44954 20.6443Z" fill="#687176"/>
                              <path d="M7 7.5C7 10.2614 9.23858 12.5 12 12.5C14.7614 12.5 17 10.2614 17 7.5V6.5C17 3.73858 14.7614 1.5 12 1.5C9.23858 1.5 7 3.73858 7 6.5V7.5Z" fill="#687176"/>
                            </svg>
                            <span className="text-sm font-semibold text-[#0F172A]">{roomAdults}</span>
                          </div>
                          {roomChildren > 0 && (
                            <div className="flex items-center gap-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.24994 5.375C11.7944 5.375 13.8574 7.43797 13.8574 9.98242V10.7188C13.8574 12.3416 13.0169 13.7672 11.749 14.5879C12.8584 14.9509 13.7447 15.5503 14.4404 16.2803C15.5741 17.4702 16.1635 18.9559 16.4667 20.1738C16.8042 21.5298 15.687 22.625 14.455 22.625H4.04486C2.81305 22.6248 1.69572 21.5297 2.03314 20.1738C2.33632 18.9559 2.92581 17.4702 4.05951 16.2803C4.75496 15.5504 5.64097 14.9509 6.74994 14.5879C5.48246 13.7671 4.64252 12.3412 4.64252 10.7188V9.98242C4.64252 7.43807 6.70563 5.37516 9.24994 5.375Z" fill="#687176"/>
                              </svg>
                              <span className="text-sm font-semibold text-[#0F172A]">{roomChildren}</span>
                            </div>
                          )}
                        </div>

                        {/* Column 3: Price */}
                        <div className="text-right border-r border-[#E5E7EB] px-4 py-3 h-full">
                          <p className="text-lg font-bold text-[#DC2626]">{formatPrice(Number(roomPrice))} VND</p>
                          {Number(rooms) > 1 && (
                            <p className="text-xs text-[#6B7280] mt-1">= {formatPrice(Number(roomPrice) * Number(rooms))} VND</p>
                          )}
                          <p className="text-xs text-[#6B7280] mt-1">Chưa bao gồm thuế và phí</p>
                        </div>

                        {/* Column 4: Quantity */}
                        <div className="text-center border-r border-[#E5E7EB] px-4 py-3 h-full">
                          <p className="text-sm font-semibold text-[#0F172A]">×{rooms}</p>
                        </div>

                        {/* Column 5: Button */}
                        <div className="flex justify-end px-4 py-3">
                          <button 
                            onClick={() => {
                              setSelectedRoomType(room.id);
                              handleBookRoom(room);
                            }}
                            disabled={Number(rooms) > 1 && selectedRoomType && selectedRoomType !== room.id}
                            className={`rounded-lg px-4 py-2 text-white text-sm font-semibold shadow transition ${
                              Number(rooms) > 1 && selectedRoomType && selectedRoomType !== room.id
                                ? "bg-[#9CA3AF] cursor-not-allowed"
                                : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                            }`}
                          >
                            Chọn
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Amenities */}
        <section id="amenities" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0F172A]">Tiện ích của khách sạn</h2>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            {hasAmenityCategories ? (
              <div className="space-y-4">
                {amenityCategories.map((cat) => (
                  <div key={cat.id || cat.title}>
                    <p className="text-sm font-semibold text-[#0F172A] mb-2">{cat.title}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-[#374151]">
                      {(cat.items || []).length > 0 ? (
                        (cat.items || []).map((item) => (
                          <span key={item.id || item.title} className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1">
                            {item.title}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">Chưa cập nhật tiện ích cho nhóm này</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(hotel?.amenities || []).map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-[#374151]">
                    <span className="h-2 w-2 rounded-full bg-[#2563EB]"></span>
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Policies & FAQ */}
        <section id="policies" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Chính sách</h3>
              <ul className="space-y-2 text-sm text-[#4B5563]">
                {policyList.map((p, idx) => (
                  <li key={`${idx}-${p}`} className="flex items-start gap-2">
                    <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-[#2563EB]"></span>
                    <span>{p}</span>
                  </li>
                ))}
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

        {roomModal.room && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden">
              <div className="px-6 pt-6 pb-3 border-b border-[#E5E7EB]">
                <h3 className="text-xl font-bold text-[#0F172A]">{roomModal.room.name?.replace(/^"(.*)"$/, "$1") || roomModal.room.name}</h3>
              </div>
              <div className="grid lg:grid-cols-[1.4fr_1fr]">
                <div className="relative bg-[#1F2937] p-4 pb-24">
                <img
                  src={modalImages[roomModal.index]}
                  alt={roomModal.room.name}
                  className="h-[420px] w-full object-cover rounded-lg"
                />
                {modalImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setRoomModal((prev) => ({ ...prev, index: (prev.index - 1 + modalImages.length) % modalImages.length }))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#0F172A] shadow hover:bg-white"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => setRoomModal((prev) => ({ ...prev, index: (prev.index + 1) % modalImages.length }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#0F172A] shadow hover:bg-white"
                    >
                      ▶
                    </button>
                  </>
                )}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                  {roomModal.index + 1} / {modalImages.length}
                </div>
                <button
                  onClick={() => setRoomModal({ room: null, index: 0 })}
                  className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-[#0F172A] shadow hover:bg-white"
                >
                  Đóng
                </button>

                {/* Thumbnail List */}
                {modalImages.length > 1 && (
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
                    {modalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRoomModal((prev) => ({ ...prev, index: idx }))}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                          idx === roomModal.index
                            ? "border-white shadow-lg"
                            : "border-white/40 hover:border-white/70"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

                <div className="p-6 space-y-4 text-sm text-[#374151]">
                <div>
                  <h4 className="text-base font-semibold text-[#0F172A] mb-3">Thông tin phòng</h4>
                  <div className="space-y-2 text-sm text-[#4B5563]">
                    {roomModal.room.capacity?.roomSize && (
                      <div className="flex items-center gap-2">
                        <span>📏</span>
                        <span>Diện tích: {roomModal.room.capacity.roomSize} m²</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>
                        {roomModal.room.capacity?.adults || 0} người lớn
                        {roomModal.room.capacity?.children ? `, ${roomModal.room.capacity.children} trẻ em` : ""}
                      </span>
                    </div>
                    {roomModal.room.capacity?.bedType && (
                      <div className="flex items-center gap-2">
                        <span>🛏</span>
                        <span>{roomModal.room.capacity.bedType}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#0F172A] mb-3">Tiện nghi</h4>
                  <div className="flex flex-wrap gap-2 text-xs text-[#374151]">
                    {(roomModal.room.amenities && roomModal.room.amenities.length > 0 ? roomModal.room.amenities : amenityList).map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

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
