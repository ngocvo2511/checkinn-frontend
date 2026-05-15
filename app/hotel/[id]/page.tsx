"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Ban, BedDouble } from "lucide-react";
import HotelDetailHeader from "@/components/HotelDetailHeader";
import Footer from "@/components/Footer";
import { hotelApi, Hotel as ApiHotel, RoomType, MediaAsset } from "@/lib/api/hotels";
import { reviewApi } from "@/lib/api/reviews";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { CustomerOnlyRoute } from "@/components/CustomerOnlyRoute";

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

const getRatingLabel = (rating: number | undefined) => {
  if (!rating) return 'Chưa có';
  if (rating >= 9) return 'Tuyệt vời';
  if (rating >= 8) return 'Rất tốt';
  if (rating >= 7) return 'Tốt';
  if (rating >= 6) return 'Khá';
  if (rating >= 5) return 'Trung bình';
  return 'Tệ';
};

const getCriteriasLabel = (key: string) => {
  const labels: Record<string, string> = {
    staff: 'Dịch vụ',
    amenities: 'Tiện nghi',
    cleanliness: 'Sạch sẽ',
    comfort: 'Thoải mái',
    valueForMoney: 'Đáng tiền',
    location: 'Vị trí',
  };
  return labels[key] || key;
};

const categoryIconUrls: Record<string, string> = {
  'Tiện nghi công cộng': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303125539-7b3d286227796ff15b7ea10423eed047.png',
  'Vận chuyển': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303369740-ad3659ca926b2a531848e977419027a3.png',
  'Ẩm thực': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303254515-bd78d369590cba427807f5b7b3df6022.png',
  'Dịch vụ khách sạn': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/23/1482486478659-e5dc2da7d82c6e7f84df2d6da0cc611b.png',
  'Tiện nghi phòng': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303267558-027736faae615602d02d68900e440901.png',
  'Tiện nghi chung': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/23/1482486531890-cbaee7be1e0c71e690dba61a3ea68ae0.png',
  'Các tiện ích lân cận': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303291459-90dd5748fca9d3c23751e007e6033cf2.png',
  'Các hoạt động': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303445040-27efd5874b7249a341778d5bb6c013f1.png',
  'Đưa đón': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2017/01/13/1484279826660-8a7e1f372132eb0f711c3a3a2ac5d057.png',
  'Kết nối mạng': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303184657-1997b10ede4170e61600e707c818f0cf.png',
  'Tiện nghi văn phòng': 'https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482303162984-24ed7bc5b92323ed368b29084492c2ce.png',
};

export default function HotelDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const hotelId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [mounted, setMounted] = useState(false);
  const [hotel, setHotel] = useState<ApiHotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("photos");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [roomModal, setRoomModal] = useState<{ room: RoomType | null; index: number }>({ room: null, index: 0 });
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, 'helpful' | 'unhelpful' | null>>({});
  const [feedbackLoading, setFeedbackLoading] = useState<Record<string, boolean>>({});
  const [showAllPoliciesModal, setShowAllPoliciesModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

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
    setMounted(true);
  }, []);

  const handleLogout = () => {
    // Logout handled by useAuth hook internally
  };

  const handleEditProfile = () => {
    router.push("/personal-data");
  };

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

  // Fetch reviews when hotel is loaded
  useEffect(() => {
    if (!hotel?.id) return;
    
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        // Get token from localStorage if available
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        const stats = await reviewApi.getReviewStats(hotel.id, token || undefined);
        setReviewStats(stats);

        // Enrich with owner responses
        const recent = stats.recentReviews || [];
        const responses = await Promise.all(
          recent.map(async (r) => {
            try {
              return await reviewApi.getReviewResponse(r.id);
            } catch {
              return null;
            }
          })
        );
        const enriched = recent.map((r, idx) => ({
          ...r,
          ownerResponse: responses[idx] ?? r.ownerResponse,
        }));

        setReviews(enriched);

        // Initialize feedback status from server response
        const initialFeedback: Record<string, 'helpful' | 'unhelpful' | null> = {};
        enriched.forEach((review) => {
          if (review.userFeedback) {
            initialFeedback[review.id] = review.userFeedback.toLowerCase() as 'helpful' | 'unhelpful';
          }
        });
        setFeedbackStatus(initialFeedback);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    
    fetchReviews();
  }, [hotel?.id]);

  useEffect(() => {
    const handleScroll = () => {
      const viewportMiddle = window.innerHeight / 2;
      
      // Define sections with their heading text to find
      const sectionHeadings = [
        { id: 'photos', text: null }, // photos always first, no specific heading
        { id: 'overview', text: 'Đánh giá tổng quan' },
        { id: 'rooms', text: 'Những phòng còn trống' },
        { id: 'amenities', text: 'Tiện ích của khách sạn' },
        { id: 'policies', text: 'Chính sách và những thông tin liên quan' },
        { id: 'reviews', text: 'Đánh giá khách hàng' }
      ];
      
      let newActiveSection = 'photos';
      
      // Check each section from bottom to top
      for (let i = sectionHeadings.length - 1; i >= 0; i--) {
        const section = sectionHeadings[i];
        const el = document.getElementById(section.id);
        
        if (!el) continue;
        
        // For photos section, just check if we're at the top
        if (section.id === 'photos') {
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportMiddle) {
            newActiveSection = section.id;
          }
          continue;
        }
        
        // For other sections, find the heading
        let heading = null;
        if (section.text) {
          // Try to find h2 or h3 with matching text
          const headings = el.querySelectorAll('h2, h3');
          for (const h of headings) {
            if (h.textContent?.includes(section.text)) {
              heading = h;
              break;
            }
          }
        }
        
        if (heading) {
          const rect = heading.getBoundingClientRect();
          // If heading is at or above middle of viewport, activate this section
          if (rect.top <= viewportMiddle) {
            newActiveSection = section.id;
            break;
          }
        } else {
          // Fallback: use section top
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportMiddle) {
            newActiveSection = section.id;
            break;
          }
        }
      }
      
      setActiveSection(newActiveSection);
    };
    
    // Initial check
    handleScroll();
    
    // Listen to scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    // Lấy tất cả items từ amenityCategories
    const items: string[] = [];
    (hotel?.amenityCategories || []).forEach((cat) => {
      (cat.items || []).forEach((item) => {
        if (item.title) items.push(item.title);
      });
    });
    return items.length > 0 ? items : fallbackAmenities;
  }, [hotel]);

  const policyList = useMemo(() => {
    if (hotel?.policies && hotel.policies.length > 0) {
      // Handle both old (with title) and new (without title) policy structures
      return hotel.policies.map((p: any) => {
        if (typeof p === 'string') {
          return { category: 'Chính sách chung', content: p };
        }
        return {
          category: p.category || 'Chính sách chung',
          content: p.content || p.title || ''
        };
      });
    }
    // Fallback with category structure
    return fallbackPolicies.map(p => ({ category: 'Chính sách chung', content: p }));
  }, [hotel]);

  // Policy category icons - paste your icon URLs here
  const policyCategoryIcons: Record<string, string> = {
    'Thời gian nhận phòng/trả phòng': 'https://via.placeholder.com/24?text=T',
    'Giấy Tờ Bắt Buộc': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303062126-7ff2e4dee7cbfef2179ab8692cdb8445.png?tr=dpr-2,h-24,q-75,w-24',
    'Bữa sáng': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303044943-16a7f9237ecc5f8ef53017f20f9352e1.png?tr=dpr-2,h-24,q-75,w-24',
    'Hút thuốc': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303183805-1f9089402093bca18a74f87786ff4db7.png?tr=dpr-2,h-24,q-75,w-24',
    'Thú cưng': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303178485-041b197f4a58d8b0a7d3df8e479a2a31.png?tr=dpr-2,h-24,q-75,w-24',
    'Chính Sách Bổ Sung': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303039228-e8d58e0c5637ec0f262ac2a18b5b3796.png?tr=dpr-2,h-24,q-75,w-24',
    'Đưa đón sân bay': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303042410-47c7c45550cb8dca266638e558a33c6c.png?tr=dpr-2,h-24,q-75,w-24',
    'Hướng Dẫn Nhận Phòng Chung': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303166332-9509e705d4f7add6f628bb488b7a39f8.png?tr=dpr-2,h-24,q-75,w-24',
    'Chính sách về độ tuổi tối thiểu': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303171533-933466334334be7c091b64037e4d92c8.png?tr=dpr-2,h-24,q-75,w-24',
    'Khác': 'https://via.placeholder.com/24?text=O',
    'Nhận phòng sớm': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303114232-d7a69eda4caa4afa1fc05ae83c404731.png?tr=dpr-2,h-24,q-75,w-24',
    'Trả phòng trễ': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303169127-17694cc343283908e1d04723a09f5002.png?tr=dpr-2,h-24,q-75,w-24'
  };

  // SVG icons for specific categories
  const PolicyIcon = ({ category }: { category: string }) => {
    if (category === 'Thời gian nhận phòng/trả phòng') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    }
    if (category === 'Khác') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    }
    const iconUrl = policyCategoryIcons[category] || 'https://via.placeholder.com/24';
    return <img src={iconUrl} alt={category} className="w-6 h-6 object-contain flex-shrink-0 mt-0.5" />;
  };

  const primaryImage = heroImages[0]?.url || "/placeholder-hotel.jpg";
  const secondaryImages = heroImages.slice(1, 2); // Chỉ lấy 1 ảnh phụ
  const hasMoreImages = heroImages.length > 2; // Nếu có > 2 ảnh
  const overlayImage = heroImages[2]?.url || heroImages[1]?.url || primaryImage;
  const ratingScore = hotel?.starRating ?? 0; // Hotel star rating (scale 1-5)
  const averageRating = reviewStats?.averageRating ?? 0; // Customer review average (scale 0-10)
  const lowestPrice = hotel?.lowestPrice ?? 0;
  const reviewCount = reviewStats?.totalReviews ?? 0;
  const amenityCategories = hotel?.amenityCategories || [];
  const hasAmenityCategories = amenityCategories.length > 0;

  const getFirstRoomImage = (mediaAssets: MediaAsset[] | undefined) => {
    if (!mediaAssets || mediaAssets.length === 0) return "/placeholder-room.jpg";
    
    const sorted = [...mediaAssets].sort((a, b) => {
      if (a.isThumbnail && !b.isThumbnail) return -1;
      if (!a.isThumbnail && b.isThumbnail) return 1;
      const aOrder = a.displayOrder ?? 9999;
      const bOrder = b.displayOrder ?? 9999;
      return aOrder - bOrder;
    });
    
    return sorted[0]?.url || "/placeholder-room.jpg";
  };

  const modalImages = useMemo(() => {
    if (!roomModal.room) return [];
    const assets = roomModal.room.mediaAssets || [];
    // Sắp xếp: thumbnail lên đầu, sau đó displayOrder tăng dần
    const sorted = [...assets].sort((a, b) => {
      if (a.isThumbnail && !b.isThumbnail) return -1;
      if (!a.isThumbnail && b.isThumbnail) return 1;
      // Nếu cùng loại, sort theo displayOrder (null/undefined về cuối)
      const aOrder = a.displayOrder ?? 9999;
      const bOrder = b.displayOrder ?? 9999;
      return aOrder - bOrder;
    });
    const imgs = sorted.map((m) => m.url).filter(Boolean);
    return imgs.length > 0 ? imgs : ["/placeholder-room.jpg"];
  }, [roomModal]);

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 96 + 52 + 56; // header + tab + search bar height
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "auto" });
  };

  const handleSearchClick = () => {
    // Navigate back to search with current params
    const searchUrl = new URLSearchParams({
      hotelName: hotel?.name || '',
      checkIn: checkIn,
      checkOut: checkOut,
      rooms: rooms,
      adults: adults,
      children: children,
    });
    router.push(`/search?${searchUrl.toString()}`);
  };

  const openGalleryAt = (index: number) => {
    if (heroImages.length === 0) return;
    const safeIndex = Math.min(Math.max(index, 0), heroImages.length - 1);
    setGalleryIndex(safeIndex);
    setGalleryOpen(true);
  };

  const handleBookRoom = (room: RoomType) => {
    // Check if user is logged in
    if (!user) {
      setShowLogin(true);
      return;
    }

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

  const handleReviewFeedback = async (reviewId: string, type: 'helpful' | 'unhelpful') => {
    const previousStatus = feedbackStatus[reviewId];
    if (feedbackLoading[reviewId]) return;
    if (previousStatus === type) return;

    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Check if user is logged in
    if (!token) {
      alert('Đây là tính năng chỉ dành cho thành viên!\n\nVui lòng đăng nhập hoặc đăng ký để thích đánh giá của người dùng khác.');
      return;
    }

    try {
      setFeedbackLoading((prev) => ({ ...prev, [reviewId]: true }));

      if (type === 'helpful') {
        await reviewApi.markReviewHelpful(reviewId, token || undefined);
      } else {
        await reviewApi.markReviewUnhelpful(reviewId, token || undefined);
      }

      setFeedbackStatus((prev) => ({ ...prev, [reviewId]: type }));

      setReviews((prevReviews) =>
        prevReviews.map((r) => {
          if (r.id !== reviewId) return r;
          let helpfulCount = r.helpfulCount || 0;
          let unhelpfulCount = r.unhelpfulCount || 0;

          if (type === 'helpful') {
            if (previousStatus === 'unhelpful' && unhelpfulCount > 0) {
              unhelpfulCount -= 1;
            }
            if (previousStatus !== 'helpful') {
              helpfulCount += 1;
            }
          } else {
            if (previousStatus === 'helpful' && helpfulCount > 0) {
              helpfulCount -= 1;
            }
            if (previousStatus !== 'unhelpful') {
              unhelpfulCount += 1;
            }
          }

          return { ...r, helpfulCount, unhelpfulCount };
        })
      );
    } catch (err) {
      console.error('Error sending review feedback:', err);
      alert('Không thể gửi phản hồi, vui lòng thử lại.');
    } finally {
      setFeedbackLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
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

  if (!mounted) return null;

  return (
    <CustomerOnlyRoute>
      <div className="bg-white text-[#111827]">
      <HotelDetailHeader 
        sections={sectionList}
        activeSection={activeSection}
        onSectionClick={handleScrollTo}
        hotelId={hotelId}
        hotelName={hotel?.name}
        checkIn={checkIn}
        checkOut={checkOut}
        adults={adults}
        children={children}
        rooms={rooms}
        onSearchClick={handleSearchClick}
        onLogin={() => setShowLogin(true)}
        onSignup={() => setShowSignup(true)}
      />

      <main className="bg-[#F8FAFC] pb-12">

        {/* Photos */}
        <section id="photos" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-8">
          <div className="relative">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => openGalleryAt(0)}
                className="relative md:col-span-2 lg:col-span-2 lg:row-span-2 h-full group"
              >
                <img
                  src={primaryImage}
                  alt={hotel.name}
                  className="h-[420px] w-full object-cover rounded-2xl shadow-sm"
                />
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/0 transition group-hover:bg-black/15"></div>
              </button>

              {secondaryImages.map((img, idx) => (
                <button
                  type="button"
                  key={img.id || img.url}
                  onClick={() => openGalleryAt(idx + 1)}
                  className="relative h-[204px] w-full overflow-hidden rounded-2xl shadow-sm group"
                >
                  <img
                    src={img.url}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/15"></div>
                </button>
              ))}

              {/* Luôn hiển thị nút "Xem tất cả" nếu có ảnh */}
              {heroImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => openGalleryAt(0)}
                  className="relative h-[204px] w-full overflow-hidden rounded-2xl shadow-sm group"
                >
                  <img
                    src={overlayImage}
                    alt="Xem tất cả hình ảnh"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 transition group-hover:bg-black/70"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white text-center px-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-lg font-bold">Xem tất cả</span>
                    <span className="text-sm font-medium">{heroImages.length} hình ảnh</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </section>

        {galleryOpen && heroImages.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-8">
            <div className="relative w-full max-w-6xl rounded-2xl bg-[#0B1220] shadow-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-[#0F172A] shadow hover:bg-white"
              >
                Đóng
              </button>

              <div className="relative bg-black">
                <img
                  src={heroImages[galleryIndex]?.url || "/placeholder-hotel.jpg"}
                  alt={`Ảnh ${galleryIndex + 1}`}
                  className="h-[520px] w-full object-contain"
                />

                {heroImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#0F172A] shadow hover:bg-white"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((prev) => (prev + 1) % heroImages.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#0F172A] shadow hover:bg-white"
                    >
                      ▶
                    </button>
                  </>
                )}

                <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1 text-xs font-semibold text-white">
                  {galleryIndex + 1} / {heroImages.length}
                </div>
              </div>

              {heroImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto bg-[#0F172A] px-4 py-3">
                  {heroImages.map((img, idx) => (
                    <button
                      type="button"
                      key={img.id || img.url || idx}
                      onClick={() => setGalleryIndex(idx)}
                      className={`flex-shrink-0 h-16 w-24 overflow-hidden rounded-lg border-2 transition ${
                        idx === galleryIndex ? "border-white shadow-lg" : "border-white/30 hover:border-white/60"
                      }`}
                    >
                      <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hotel Info Bar */}
        <section className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 py-6 flex items-center justify-between bg-white border-b border-[#E5E7EB]">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[#0F172A]">{hotel?.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src="https://ik.imagekit.io/tvlk/image/imageResource/2024/05/13/1715575526353-f84706e8ff60eebdb59c3e338fe33e4b.png?tr=h-16,q-75,w-16"
                    alt="star"
                    className={`w-4 h-4 ${i < Math.floor(ratingScore) ? 'opacity-100' : 'opacity-30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleScrollTo("rooms")}
            className="flex items-center gap-2 px-6 py-3 bg-[#0057FF] text-white font-semibold rounded-lg hover:bg-[#0046CC] transition shadow-md"
          >
            <span>Chọn phòng</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </section>

        {/* Overview: rating + main amenities */}
        <section id="overview" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-8">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-[#6B7280]">Đánh giá tổng quan</p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-[#0F172A]">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</span>
                    <span className="text-sm text-[#4B5563]">/ 10 · {getRatingLabel(averageRating)}</span>
                  </div>
                  <p className="text-sm text-[#4B5563]">{reviewCount > 0 ? `Dựa trên ${reviewCount} đánh giá` : 'Chưa có đánh giá'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9CA3AF]">Giá/phòng/đêm từ</p>
                  <p className="text-2xl font-bold text-[#DC2626]">{formatPrice(Number(lowestPrice))}</p>
                  <p className="text-xs text-[#9CA3AF]">Chưa gồm thuế & phí</p>
                </div>
              </div>

              {/* Hiển thị một vài đánh giá nổi bật */}
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-semibold text-[#111827] text-sm">Khách nói gì</p>
                  <div className="space-y-3">
                    {reviews.slice(0, 2).map((review) => (
                      <div key={review.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-semibold">
                              {review.guestName?.[0]?.toUpperCase() || 'K'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#0F172A]">{review.guestName || 'Khách'}</p>
                              <p className="text-xs text-[#6B7280]">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2 py-1 text-xs font-semibold text-white">
                            <img
                              src="https://ik.imagekit.io/tvlk/image/imageResource/2024/05/13/1715575526353-f84706e8ff60eebdb59c3e338fe33e4b.png?tr=h-16,q-75,w-16"
                              alt="star"
                              className="w-3 h-3"
                            />
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                        {review.title && (
                          <p className="text-sm font-semibold text-[#0F172A] mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-[#4B5563] line-clamp-2">
                          {review.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm text-[#4B5563]">
                  <p className="font-semibold text-[#111827] mb-1">Giới thiệu</p>
                  <p>
                    {hotel.description || "Phòng sạch, tiện nghi đầy đủ và dịch vụ thân thiện."}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-3 items-center">
                <p className="text-sm text-[#4B5563]">
                  {reviews.length > 2 ? `Xem thêm ${reviewCount - 2} đánh giá khác` : 'Xem chi tiết trải nghiệm từ khách đã lưu trú'}
                </p>
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
                <button
                  onClick={() => handleScrollTo("amenities")}
                  className="text-sm text-[#2563EB] font-semibold hover:underline"
                >
                  Xem thêm
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#374151]">
                {amenityList.slice(0, 8).map((a) => (
                  <div key={a} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#6B7280]"></span>
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
                const roomImage = getFirstRoomImage(room.mediaAssets);
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
                            <BedDouble className="h-4 w-4 text-[#6B7280]" />
                            <span>{room.capacity?.bedType || "Giường linh hoạt"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <Ban className="h-4 w-4 text-[#DC2626]" />
                            <span>Không được hoàn tiền</span>
                          </div>
                        </div>

                        {/* Column 2: Guests */}
                        <div className="flex items-start gap-3 justify-center border-r border-[#E5E7EB] px-4 py-3 h-full">
                          <div className="flex items-center gap-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.44954 20.6443C3.3058 21.3665 3.88623 22 4.62267 22H19.3773C20.1138 22 20.6942 21.3665 20.5505 20.6443C19.9516 17.635 17.9884 13 12 13C6.01165 13 4.04844 17.635 3.44954 20.6443Z" fill="#687176"/>
                            <span className="text-lg font-semibold text-[#9CA3AF] ml-1">/10</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {amenityCategories
                  .sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0))
                  .map((cat) => (
                  <div key={cat.id || cat.title}>
                    <div className="text-[17px] font-bold text-[#0F172A] mb-4 flex items-center gap-3">
                      {categoryIconUrls[cat.title] && (
                        <img 
                          src={categoryIconUrls[cat.title]} 
                          alt={cat.title}
                          className="w-6 h-6 object-cover rounded"
                        />
                      )}
                      <span>{cat.title}</span>
                    </div>
                    <ul className="space-y-2 text-sm ml-5 font-semibold text-[#374151]">
                      {(cat.items || []).length > 0 ? (
                        (cat.items || []).map((item) => (
                          <li key={item.id || item.title} className="flex items-start gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6B7280] mt-2 flex-shrink-0"></span>
                            <span>{item.title}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-[#9CA3AF]">Chưa cập nhật tiện ích cho nhóm này</li>
                      )}
                    </ul>
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

        {/* Policies */}
        <section id="policies" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="grid lg:grid-cols-[3fr_7fr]">
              {/* Left side: Title with gradient background */}
              <div 
                className="pl-4 pt-6 pr-6 pb-8"
                style={{
                  background: 'linear-gradient(92deg, rgba(81, 149, 227, 0.5) -60%, #D6F1FF 40%, rgba(214, 241, 255, 0.7) 100%)'
                }}
              >
                <h2 
                  className="text-xl tracking-tigth leading-tight text-[#0F172A] -mr-4" 
                  style={{ 
                    fontWeight: 700,
                    textShadow: '0 0 0.5px #0F172A, 0 0 0.5px #0F172A'
                  }}
                >
                  Chính sách và những thông tin liên quan của Khách sạn {hotel?.name || ''}
                </h2>
              </div>

              {/* Right side: Policies preview + General info */}
              <div className="p-6 space-y-6">
                {/* First 3 policies + Read all button */}
                <div>
                  <ul className="space-y-4 mb-4">
                    {policyList.slice(0, 3).map((p: any, idx) => (
                      <li key={`${idx}-${p.category}-${p.content}`} className="flex items-start gap-3">
                        <PolicyIcon category={p.category} />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-[#0F172A] mb-1">{p.category}</div>
                          <div className="text-sm text-[#4B5563]">{p.content}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowAllPoliciesModal(true)}
                    className="text-sm text-[#0057FF] font-semibold hover:text-[#0046CC] transition"
                  >
                    Đọc tất cả
                  </button>
                </div>

                {/* General information table - placeholder */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Thông tin chung</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Tiện ích chung</span>
                      <span className="text-[#0F172A] text-right">Máy lạnh, Nhà hàng, Hồ bơi, Lễ tân 24h, Chỗ đậu xe, Thang máy, WiFi</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Thời gian nhận/trả phòng</span>
                      <span className="text-[#0F172A]">Từ 14:00 - đến 12:00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Khoảng cách đến trung tâm thành phố</span>
                      <span className="text-[#0F172A]">2.12 km</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Điểm đến phổ biến</span>
                      <span className="text-[#0F172A] text-right">Biển Mỹ Khê, Sơ 294 Trưng Nữ Vương, Bệnh viện Hoàn Mỹ Đà Nẵng</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#6B7280]">Có ăn sáng</span>
                      <span className="text-[#0F172A]">Có, khách sạn có phòng cung cấp bữa sáng</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section id="faqs" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10 pb-10">
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
        </section>

        {/* All Policies Modal */}
        {showAllPoliciesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#0F172A]">Tất cả chính sách</h3>
                <button
                  onClick={() => setShowAllPoliciesModal(false)}
                  className="rounded-full p-2 hover:bg-[#F3F4F6] transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-6 overflow-y-auto">
                <ul className="space-y-4">
                  {policyList.map((p: any, idx) => (
                    <li key={`${idx}-${p.category}-${p.content}`} className="flex items-start gap-3">
                      <PolicyIcon category={p.category} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-[#0F172A] mb-1">{p.category}</div>
                        <div className="text-sm text-[#4B5563]">{p.content}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

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
                        <BedDouble className="h-4 w-4 text-[#4B5563]" />
                        <span>{roomModal.room.capacity.bedType}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#0F172A] mb-3">Tiện nghi</h4>
                  <div className="flex flex-wrap gap-2 text-xs text-[#374151]">
                    {(roomModal.room.amenities && roomModal.room.amenities.length > 0 ? roomModal.room.amenities : amenityList).map((a, idx) => (
                      <span key={typeof a === 'object' ? (a.id || a.title || idx) : (a || idx)} className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1">
                        {typeof a === 'object' ? a.title : a}
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
        <section id="reviews" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10 pb-10">
          <h2 className="text-2xl font-bold text-[#0F172A] mb-8">Đánh giá khách hàng</h2>

          {reviewsLoading ? (
            <div className="text-center py-8 text-[#6B7280]">Đang tải đánh giá...</div>
          ) : reviewStats ? (
            <>
              {/* Overall Rating Summary */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  {/* Score */}
                  <div className="text-center md:text-left flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl md:text-6xl font-bold text-[#0F172A]">
                        {reviewStats.averageRating?.toFixed(1) || '0'}
                      </div>
                      <div className="text-left">
                        <p className="text-3xl font-semibold text-green-600">
                          {getRatingLabel(reviewStats.averageRating)}
                        </p>
                        <p className="text-base font-semibold text-[#6B7280]">
                          Dựa trên {reviewStats.totalReviews || 0} đánh giá
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Ratings */}
                  <div className="flex-1 max-w-2xl">
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { key: 'cleanliness', label: 'Sạch sẽ', value: reviewStats.averageCleanlinessRating },
                        { key: 'comfort', label: 'Thoải mái', value: reviewStats.averageComfortRating },
                        { key: 'location', label: 'Vị trí', value: reviewStats.averageLocationRating },
                        { key: 'staff', label: 'Dịch vụ', value: reviewStats.averageStaffRating },
                        { key: 'amenities', label: 'Tiện nghi', value: reviewStats.averageAmenitiesRating },
                        { key: 'valueForMoney', label: 'Đáng tiền', value: reviewStats.averageValueForMoneyRating },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[#4B5563] w-20 flex-shrink-0">{item.label}</span>
                          <div className="flex-1 bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.value ? (item.value / 10) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-[#0F172A] w-8 text-right flex-shrink-0">{item.value?.toFixed(1) || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-[#6B7280]">Chưa có đánh giá nào</div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const isContentLong = (review.content || '').length > 300;
                    const isExpanded = expandedReviewId === review.id;
                    const displayContent = isExpanded ? review.content : (review.content || '').substring(0, 300);
                    const displayName = review.guestName || review.name || 'Khách';
                    const avatarInitial = displayName.trim()[0]?.toUpperCase() || 'K';

                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      const day = date.getDate();
                      const month = date.getMonth() + 1;
                      const year = date.getFullYear();
                      return `Ngày đánh giá: ngày ${day} tháng ${month} năm ${year}`;
                    };

                    const feedbackState = feedbackStatus[review.id];
                    const feedbackBusy = feedbackLoading[review.id];
                    const helpfulSelected = feedbackState === 'helpful';
                    const unhelpfulSelected = feedbackState === 'unhelpful';

                    return (
                      <div
                        key={review.id}
                        className="bg-white rounded-xl border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow flex gap-6"
                      >
                        {/* Left: Avatar fixed, name slightly lower */}
                        <div className="flex items-start gap-3 flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {avatarInitial}
                          </div>
                          <p className="font-semibold text-[#0F172A] leading-snug mt-3">{displayName}</p>
                        </div>

                        {/* Right: Rating, Date, Content, Buttons */}
                        <div className="flex-1 ml-25">
                          {/* Rating + Date Row */}
                          <div className="flex items-center mb-3">
                            <div className="flex items-center gap-2">
                              <img
                                src="https://ik.imagekit.io/tvlk/image/imageResource/2024/05/13/1715575526353-f84706e8ff60eebdb59c3e338fe33e4b.png?tr=h-16,q-75,w-16"
                                alt="star"
                                className="w-5 h-5"
                              />
                              <span className="font-bold text-[#0F172A] text-lg">{review.rating?.toFixed(1) || '0'}</span>
                              <span className="text-base font-bold text-[#9CA3AF]">/10</span>
                              <p className="text-base font-bold text-[#6B7280] whitespace-nowrap ml-3">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>

                          {/* Review Title */}
                          {review.title && (
                            <p className="font-semibold text-[#0F172A] text-lg mb-2">{review.title}</p>
                          )}

                          {/* Review Content */}
                          <p className="text-base text-[#4B5563] leading-relaxed mb-3">
                            {displayContent}
                            {isContentLong && !isExpanded && '...'}
                          </p>

                          {/* Owner Response */}
                          {review.ownerResponse && (
                            <div className="mt-3 bg-[#F9FAFB] rounded-lg p-4 border-l-4 border-[#0057FF]">
                              <p className="text-xs font-semibold text-[#0057FF] uppercase mb-2">
                                Phản hồi từ chủ khách sạn
                              </p>
                              <div className="flex items-start gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-sm font-bold">
                                  {(review.ownerResponse.ownerName?.[0]?.toUpperCase() || 'O')}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-[#111827]">
                                    {review.ownerResponse.ownerName || 'Chủ khách sạn'}
                                  </p>
                                  <p className="text-xs text-[#9CA3AF]">
                                    {new Date(review.ownerResponse.createdAt).toLocaleDateString('vi-VN')}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-[#4B5563]">{review.ownerResponse.content}</p>
                            </div>
                          )}

                          {/* Read More Button */}
                          {isContentLong && (
                            <button
                              onClick={() => setExpandedReviewId(isExpanded ? null : review.id)}
                              className="text-blue-600 text-sm font-semibold hover:text-blue-700 mb-3 block"
                            >
                              {isExpanded ? 'Ẩn bớt' : 'Đọc thêm'}
                            </button>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-6 pt-3">
                            {!feedbackState ? (
                              <>
                                <button
                                  onClick={() => handleReviewFeedback(review.id, 'helpful')}
                                  disabled={feedbackBusy}
                                  className={`flex items-center gap-2 text-base font-semibold transition-colors ${helpfulSelected ? 'text-[#2563EB]' : 'text-[#4B5563] hover:text-[#0F172A]'} ${feedbackBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                                  </svg>
                                  <span>Hữu ích</span>
                                </button>
                                <button
                                  onClick={() => handleReviewFeedback(review.id, 'unhelpful')}
                                  disabled={feedbackBusy}
                                  className={`flex items-center gap-2 text-base font-semibold transition-colors ${unhelpfulSelected ? 'text-[#DC2626]' : 'text-[#4B5563] hover:text-[#0F172A]'} ${feedbackBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
                                  </svg>
                                  <span>Không hữu ích</span>
                                </button>
                              </>
                            ) : (
                              <button
                                className={`flex items-center gap-2 text-base font-semibold transition-colors ${helpfulSelected ? 'text-[#2563EB]' : 'text-[#DC2626]'}`}
                                disabled
                              >
                                {feedbackState === 'helpful' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
                                  </svg>
                                )}
                                <span>{feedbackState === 'helpful' ? 'Bạn thấy đánh giá này có ích.' : 'Bạn thấy đánh giá này không hữu ích.'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-[#6B7280]">Không có dữ liệu đánh giá</div>
          )}
        </section>
      </main>

      <Footer />

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}

      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
      </div>
    </CustomerOnlyRoute>
  );
}

function LoginModal({ onClose, onSwitchToSignup }: { onClose: () => void; onSwitchToSignup: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setError("");
    setLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.login({
        usernameOrEmail: email,
        password,
      });

      localStorage.setItem("token", response.token);
      await login(response);

      const role = response.role?.toLowerCase?.() || "";
      if (role.includes("admin")) {
        router.push("/admin/dashboard");
      } else if (role.includes("owner") || role.includes("host")) {
        router.push("/host/dashboard");
      } else {
        // Reload page to update UI
        location.reload();
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
        <div className="relative flex items-center justify-center pb-2">
          <p className="text-sm font-semibold text-[#2B3037]">Log in or sign up</p>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-0 top-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-xl font-bold text-[#1F2226]">Welcome to Tripto</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Email address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Continue"}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full rounded-xl border border-[#E0E2E7] bg-white py-3 text-sm font-semibold text-[#2B3037] shadow-sm hover:bg-[#F7F8FA]"
          >
            Tiếp tục với Google
          </button>

          <button
            type="button"
            onClick={onSwitchToSignup}
            className="w-full rounded-xl border border-[#0057FF] bg-white py-3 text-sm font-semibold text-[#0057FF] shadow-sm hover:bg-[#0057FF] hover:text-white"
          >
            Bạn chưa có tài khoản? Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupModal({ onClose, onSwitchToLogin }: { onClose: () => void; onSwitchToLogin: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [authResponse, setAuthResponse] = useState<any>(null);

  const handleSubmit = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.register({
        fullName,
        username,
        email,
        password,
      });

      setAuthResponse(response);
      setRegisteredEmail(email);
      setStep('verify');
      setOtpCode("");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join("");
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Vui lòng nhập đầy đủ 6 số mã OTP");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await authApi.verifyOtp(registeredEmail, otpValue);
      
      if (response.verified) {
        localStorage.setItem("token", authResponse.token);
        await login(authResponse);
        location.reload();
      } else {
        setOtpError(response.message || "Xác thực OTP thất bại");
      }
    } catch (err: any) {
      setOtpError(err.message || "Xác thực OTP thất bại");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await authApi.resendOtp(registeredEmail);
      if (response.success) {
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpError("Mã OTP đã được gửi lại! Vui lòng kiểm tra email của bạn.");
      } else {
        setOtpError(response.message || "Không thể gửi lại OTP");
      }
    } catch (err: any) {
      setOtpError(err.message || "Không thể gửi lại OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpDigits(digits);
      
      // Focus last input
      const lastInput = document.getElementById("otp-input-5");
      lastInput?.focus();
    }
  };

  if (step === 'verify') {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
        <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
          <div className="relative flex items-center justify-center pb-4">
            <p className="text-sm font-semibold text-[#2B3037]">Xác thực Email</p>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-0 top-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
              onClick={onClose}
            >
              x
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#0057FF"/>
                </svg>
              </div>
              <p className="text-xl font-bold text-[#1F2226]">Nhập mã xác thực</p>
              <p className="text-sm text-[#656F81]">
                Chúng tôi đã gửi mã xác thực 6 số đến<br />
                <span className="font-semibold text-[#2B3037]">{registeredEmail}</span>
              </p>
            </div>

            {otpError && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                otpError.includes("gửi lại") || otpError.includes("successfully") 
                  ? "bg-green-50 text-green-600" 
                  : "bg-red-50 text-red-600"
              }`}>
                {otpError}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#2B3037] block text-center">Mã xác thực OTP</label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 border-[#E0E2E7] bg-[#F7F8FA] text-[#2B3037] focus:border-[#0057FF] focus:bg-white focus:outline-none transition"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p className="text-xs text-center text-[#8B94A4]">
                Mã OTP có hiệu lực trong 10 phút
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpDigits.some(d => !d)}
              className="w-full rounded-xl bg-[#0057FF] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {otpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xác thực...
                </span>
              ) : (
                "Xác thực & Tiếp tục"
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pt-2">
              <p className="text-sm text-[#656F81]">Không nhận được mã?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="text-sm font-semibold text-[#0057FF] hover:underline disabled:opacity-50 transition"
              >
                Gửi lại
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('register');
                setOtpDigits(["", "", "", "", "", ""]);
                setOtpError("");
              }}
              className="w-full text-sm text-[#656F81] hover:text-[#0057FF] transition flex items-center justify-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
              </svg>
              Quay lại đăng ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
        <div className="relative flex items-center justify-center pb-2">
          <p className="text-sm font-semibold text-[#2B3037]">Sign up</p>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-0 top-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-xl font-bold text-[#1F2226]">Create your account</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Full name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Email address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Confirm password</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Continue"}
          </button>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full text-sm text-[#0057FF] hover:underline"
          >
            Đã có tài khoản? Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
