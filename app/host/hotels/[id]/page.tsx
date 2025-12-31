"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import HostMenu from "@/components/host/menu/HostMenu";
import { hotelApi, Hotel as ApiHotel, RoomType, MediaAsset } from "@/lib/api/hotels";

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return "Liên hệ";
  return `${value.toLocaleString("vi-VN")} VND`;
};

const formatAddress = (address?: ApiHotel['address']) => {
  if (!address) return '';
  return [address.street, address.district, address.city, address.country].filter(Boolean).join(', ');
};

const formatStatus = (status?: string) => {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "PENDING":
      return "Chờ duyệt";
    case "REJECTED":
      return "Từ chối";
    default:
      return status || "Không xác định";
  }
};

const statusBadgeClass = (status?: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-[#D1F2E9] text-[#0B6E4F]";
    case "PENDING":
      return "bg-[#FFF3D5] text-[#A65628]";
    case "REJECTED":
      return "bg-[#FFE8E6] text-[#9C1F23]";
    default:
      return "bg-[#E8E9F1] text-[#383E48]";
  }
};

export default function HostHotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [hotel, setHotel] = useState<ApiHotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [showAllImages, setShowAllImages] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    starRating: 0,
    cityId: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      ward: '',
      district: '',
      city: '',
      country: '',
      postalCode: '',
    }
  });

  const sectionList = useMemo(
    () => [
      { id: "overview", label: "Tổng quan" },
      { id: "photos", label: "Hình ảnh" },
      { id: "rooms", label: "Phòng" },
      { id: "amenities", label: "Tiện ích" },
      { id: "policies", label: "Chính sách" },
    ],
    []
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vui lòng đăng nhập để xem chi tiết khách sạn.");
      setLoading(false);
      return;
    }

    const fetchHotel = async () => {
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

    fetchHotel();
  }, [hotelId]);

  useEffect(() => {
    if (showEditModal && cities.length === 0) {
      const fetchCities = async () => {
        try {
          const citiesData = await hotelApi.getCities();
          setCities(citiesData);
        } catch (err) {
          console.error('Failed to fetch cities:', err);
        }
      };
      fetchCities();
    }
  }, [showEditModal, cities.length]);

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
  }, [sectionList]);

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
    const sorted = Array.from(uniqueByUrl.values()).sort((a, b) => {
      // Sort by thumbnail first (thumbnail comes first), then by sortOrder
      if (a.isThumbnail && !b.isThumbnail) return -1;
      if (!a.isThumbnail && b.isThumbnail) return 1;
      const orderA = Number(a.sortOrder) || 0;
      const orderB = Number(b.sortOrder) || 0;
      return orderA - orderB;
    });
    
    // Debug logging
    console.log('Sorted images:', sorted.map(img => ({
      id: img.id,
      url: img.url.substring(img.url.lastIndexOf('/') + 1),
      isThumbnail: img.isThumbnail,
      sortOrder: img.sortOrder
    })));
    
    return sorted;
  }, [hotel]);

  const amenityCategories = useMemo(() => {
    return hotel?.amenityCategories || hotel?.amenities || [];
  }, [hotel]);

  const flatAmenityList = useMemo(() => {
    const allItems: string[] = [];
    amenityCategories.forEach(category => {
      if (category.items && Array.isArray(category.items)) {
        category.items.forEach(item => {
          allItems.push(item.title);
        });
      }
    });
    return allItems;
  }, [amenityCategories]);

  const primaryImage = heroImages[0]?.url || "/placeholder-hotel.jpg";
  const secondaryImages = heroImages.slice(1, 5);
  const visibleSecondaryImages = useMemo(
    () => (showAllImages ? heroImages.slice(1) : secondaryImages),
    [heroImages, secondaryImages, showAllImages]
  );

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleToggleActive = async () => {
    if (!hotel) return;

    const action = hotel.isActive ? "tắt hoạt động" : "kích hoạt";
    const confirmMessage = hotel.isActive
      ? "Bạn có chắc chắn muốn tắt hoạt động khách sạn này? Khách sạn sẽ không hiển thị trên hệ thống."
      : "Bạn có chắc chắn muốn kích hoạt lại khách sạn này?";

    if (!confirm(confirmMessage)) return;

    setToggling(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (hotel.isActive) {
        await hotelApi.deactivateHotel(hotelId);
      } else {
        await hotelApi.activateHotel(hotelId);
      }

      // Update local state
      setHotel({ ...hotel, isActive: !hotel.isActive });
      setSuccessMessage(`Đã ${action} khách sạn thành công!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || `Không thể ${action} khách sạn`);
    } finally {
      setToggling(false);
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !hotel) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tập tin hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextSortOrder = hotel.mediaAssets ? hotel.mediaAssets.length : 0;
      // If this is the first image, set it as thumbnail
      const isFirstImage = !hotel.mediaAssets || hotel.mediaAssets.length === 0;
      const newMedia = await hotelApi.uploadMedia(hotelId, 'HOTEL', file, isFirstImage, nextSortOrder);

      // Update local state - create completely new array to ensure re-render
      const updatedMediaAssets = [...(hotel.mediaAssets || []), newMedia];
      setHotel({
        ...hotel,
        mediaAssets: [...updatedMediaAssets]
      });
      setSuccessMessage(`Đã tải lên hình ảnh thành công!${isFirstImage ? ' (Đã đặt làm ảnh đại diện)' : ''}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset input
      event.target.value = '';
    } catch (err: any) {
      setError(err?.message || 'Không thể tải lên hình ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (mediaId: string) => {
    if (!hotel) return;

    const imageToDelete = (hotel.mediaAssets || []).find(m => m.id === mediaId);
    const isThumbnail = imageToDelete?.isThumbnail;

    if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;

    setDeletingImageId(mediaId);
    setError(null);
    setSuccessMessage(null);

    try {
      await hotelApi.deleteMedia(mediaId);

      // Update local state
      const updatedMediaAssets = (hotel.mediaAssets || []).filter(m => m.id !== mediaId);
      
      // If deleted image was thumbnail and there are remaining images, set the first one as new thumbnail
      if (isThumbnail && updatedMediaAssets.length > 0) {
        try {
          const newThumbnail = await hotelApi.setThumbnail(updatedMediaAssets[0].id);
          // Update the thumbnail flag in local state
          updatedMediaAssets[0] = { ...updatedMediaAssets[0], isThumbnail: true };
          setSuccessMessage('Đã xóa hình ảnh và đặt ảnh đại diện mới!');
        } catch (err) {
          console.error('Failed to set new thumbnail:', err);
          setSuccessMessage('Đã xóa hình ảnh (lỗi khi đặt ảnh đại diện mới)');
        }
      } else {
        setSuccessMessage('Đã xóa hình ảnh thành công!');
      }

      // Create completely new object to ensure re-render
      setHotel({
        ...hotel,
        mediaAssets: [...updatedMediaAssets]
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa hình ảnh');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSetThumbnail = async (mediaId: string) => {
    if (!hotel) return;

    if (!confirm('Bạn có muốn đặt hình ảnh này làm ảnh đại diện?')) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await hotelApi.setThumbnail(mediaId);

      // Update local state: unset all thumbnails, then set the selected one
      const updatedMediaAssets = (hotel.mediaAssets || []).map(m => ({
        ...m,
        isThumbnail: m.id === mediaId
      }));
      
      // Create completely new object to ensure re-render
      setHotel({
        ...hotel,
        mediaAssets: [...updatedMediaAssets]
      });
      
      setSuccessMessage('Đã đặt ảnh đại diện mới!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt ảnh đại diện');
    }
  };

  const handleEdit = () => {
    if (!hotel) return;
    
    setFormData({
      name: hotel.name || '',
      description: hotel.description || '',
      starRating: hotel.starRating || 0,
      cityId: hotel.cityId || '',
      contactEmail: hotel.contactEmail || '',
      contactPhone: hotel.contactPhone || '',
      address: {
        street: hotel.address?.street || '',
        ward: hotel.address?.ward || '',
        district: hotel.address?.district || '',
        city: hotel.address?.city || '',
        country: hotel.address?.country || '',
        postalCode: hotel.address?.postalCode || '',
      }
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Tên khách sạn không được để trống');
      return;
    }
    if (formData.name.length < 3 || formData.name.length > 200) {
      alert('Tên khách sạn phải từ 3-200 ký tự');
      return;
    }
    if (!formData.description.trim()) {
      alert('Mô tả không được để trống');
      return;
    }
    if (formData.description.length < 10) {
      alert('Mô tả phải ít nhất 10 ký tự');
      return;
    }
    if (formData.starRating < 1 || formData.starRating > 5) {
      alert('Xếp hạng sao phải từ 1-5');
      return;
    }
    if (!formData.cityId) {
      alert('Vui lòng chọn thành phố');
      return;
    }
    if (!formData.address.street?.trim()) {
      alert('Địa chỉ đường không được để trống');
      return;
    }
    if (!formData.address.district?.trim()) {
      alert('Quận/Huyện không được để trống');
      return;
    }
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      alert('Email không hợp lệ');
      return;
    }
    if (formData.contactPhone && !/^[0-9]{10,11}$/.test(formData.contactPhone.replace(/[\s-]/g, ''))) {
      alert('Số điện thoại phải có 10-11 chữ số');
      return;
    }

    setEditLoading(true);
    setError(null);

    try {
      const updated = await hotelApi.updateHotel(hotelId, {
        name: formData.name,
        description: formData.description,
        starRating: formData.starRating,
        cityId: formData.cityId,
        address: formData.address,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
      });

      setHotel(updated);
      setShowEditModal(false);
      setSuccessMessage('Đã cập nhật thông tin khách sạn thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể cập nhật thông tin');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header user={null} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />
        <div className="flex items-center justify-center min-h-[calc(100vh-72px)] text-[#2B3037]">
          Đang tải...
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-white">
        <Header user={null} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />
        <div className="flex items-center justify-center min-h-[calc(100vh-72px)]">
          <div className="text-center">
            <p className="text-red-600 text-lg">{error || "Không tìm thấy khách sạn"}</p>
            <button
              onClick={() => router.push("/host/hotels")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0057FF] hover:gap-3 transition"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <Header user={null} onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} onEditProfile={() => {}} />

      <main className="flex">
        {/* Sidebar */}
        <HostMenu />

        {/* Content */}
        <div className="flex-1 bg-[#F8FAFC]">
          <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
            <div className="mx-auto max-w-5xl px-4 md:px-8 lg:px-12 flex items-center gap-2 overflow-x-auto py-3">
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

          {/* Overview */}
          <section id="overview" className="mx-auto max-w-5xl px-4 md:px-8 lg:px-12 pt-8 pb-10">
            <div className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="rounded-xl bg-[#D1F2E9] border border-[#0B6E4F] px-4 py-3 flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#0B6E4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm font-semibold text-[#0B6E4F]">{successMessage}</p>
                </div>
              )}

              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-[#0F172A]">{hotel.name}</h1>
                  <p className="text-[#4B5563]">{formatAddress(hotel.address)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(hotel.approvedStatus)}`}>
                    {formatStatus(hotel.approvedStatus)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      hotel.isActive ? "bg-[#E8FFF3] text-[#0F5132]" : "bg-[#FFE8E6] text-[#9C1F23]"
                    }`}
                  >
                    {hotel.isActive ? "Đang hoạt động" : "Tạm dừng"}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Đánh giá</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1F2226]">{hotel.starRating || 0}/5</p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Giá thấp nhất</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1F2226]">{formatPrice(hotel.lowestPrice)}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Số lượng phòng</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1F2226]">
                    {hotel.roomTypes?.reduce((sum, rt) => sum + (rt.totalRooms || 0), 0) || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Loại phòng</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1F2226]">{hotel.roomTypes?.length || 0}</p>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Mô tả khách sạn</h3>
                <p className="text-[#4B5563] leading-relaxed">{hotel.description || "Chưa có mô tả"}</p>
              </div>

              {/* Contact Information */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Thông tin liên lạc</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">Email</p>
                      <p className="text-sm font-semibold text-[#0F172A]">{hotel.contactEmail || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">Số điện thoại</p>
                      <p className="text-sm font-semibold text-[#0F172A]">{hotel.contactPhone || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#0057FF] px-4 py-2 text-sm font-semibold text-[#0057FF] transition hover:bg-[#0057FF] hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17.378 2.61799C17.7231 2.27287 18.2769 2.27287 18.622 2.61799L21.382 5.378C21.7271 5.72312 21.7271 6.27688 21.382 6.622L11 17H8V14L17.378 2.61799Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Chỉnh sửa thông tin
                  </button>
                  <button
                    onClick={handleToggleActive}
                    disabled={toggling}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      hotel.isActive
                        ? "border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                        : "border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white"
                    }`}
                  >
                    {toggling ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : hotel.isActive ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.364 18.364C21.8787 14.8492 21.8787 9.15076 18.364 5.63604C14.8492 2.12132 9.15076 2.12132 5.63604 5.63604M18.364 18.364C14.8492 21.8787 9.15076 21.8787 5.63604 18.364C2.12132 14.8492 2.12132 9.15076 5.63604 5.63604M18.364 18.364L5.63604 5.63604" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Tắt hoạt động
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Kích hoạt
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => router.push("/host/hotels")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E8E9F1] px-4 py-2 text-sm font-semibold text-[#383E48] transition hover:bg-[#E8E9F1]"
                  >
                    ← Quay lại
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Photos */}
          <section id="photos" className="mx-auto max-w-5xl px-4 md:px-8 lg:px-12 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#0F172A]">Hình ảnh</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B7280]">{heroImages.length} hình ảnh</span>
                <label className="inline-flex items-center gap-2 rounded-lg border border-[#10B981] px-3 py-1.5 text-xs font-semibold text-[#10B981] transition hover:bg-[#10B981] hover:text-white cursor-pointer">
                  {uploading ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Thêm hình ảnh
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="relative">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 h-full relative group">
                  <img
                    src={primaryImage}
                    alt={hotel.name}
                    className="h-[420px] w-full object-cover rounded-2xl shadow-sm"
                  />
                  {heroImages[0] && (
                    <>
                      {heroImages[0].isThumbnail && (
                        <span className="absolute top-3 left-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                          Ảnh đại diện
                        </span>
                      )}
                      {heroImages[0].id && (
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          {!heroImages[0].isThumbnail && (
                            <button
                              onClick={() => handleSetThumbnail(heroImages[0].id)}
                              className="rounded-full bg-blue-600 p-2 text-white shadow-lg hover:bg-blue-700"
                              title="Đặt làm ảnh đại diện"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteImage(heroImages[0].id)}
                            disabled={deletingImageId === heroImages[0].id}
                            className="rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Xóa hình ảnh"
                          >
                            {deletingImageId === heroImages[0].id ? (
                              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {visibleSecondaryImages.map((img) => (
                  <div key={img.id || img.url} className="relative group">
                    <img
                      src={img.url}
                      alt={hotel.name}
                      className="h-48 w-full object-cover rounded-2xl shadow-sm"
                    />
                    {img.isThumbnail && (
                      <span className="absolute top-3 left-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                        Ảnh đại diện
                      </span>
                    )}
                    {img.id && (
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        {!img.isThumbnail && (
                          <button
                            onClick={() => handleSetThumbnail(img.id)}
                            className="rounded-full bg-blue-600 p-1.5 text-white shadow-lg hover:bg-blue-700"
                            title="Đặt làm ảnh đại diện"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          disabled={deletingImageId === img.id}
                          className="rounded-full bg-red-600 p-1.5 text-white shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Xóa hình ảnh"
                        >
                          {deletingImageId === img.id ? (
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {visibleSecondaryImages.length === 0 && heroImages.length <= 1 && (
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

          {/* Rooms */}
          <section id="rooms" className="mx-auto max-w-5xl px-4 md:px-8 lg:px-12 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#0F172A]">Danh sách phòng</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B7280]">{hotel.roomTypes?.length || 0} loại phòng</span>
                <button
                  onClick={() => alert("Tính năng đang phát triển")}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#10B981] px-3 py-1.5 text-xs font-semibold text-[#10B981] transition hover:bg-[#10B981] hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Thêm phòng
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {!hotel.roomTypes || hotel.roomTypes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white p-6 text-[#6B7280]">
                  Chưa có phòng nào
                </div>
              ) : (
                hotel.roomTypes.map((room) => {
                  const roomPrice = room.basePrice ?? room.pricePerNight ?? 0;
                  const roomImage = room.mediaAssets?.[0]?.url || "/placeholder-room.jpg";
                  const capacityText = room.capacity
                    ? `${room.capacity.adults} người lớn${room.capacity.children ? `, ${room.capacity.children} trẻ em` : ""}`
                    : "Tối đa 2 khách";
                  const roomArea = room.roomSize ? `${room.roomSize} m²` : null;
                  const roomAmenities = (room.amenities && room.amenities.length > 0 ? room.amenities : flatAmenityList).slice(0, 4);

                  return (
                    <div
                      key={room.id}
                      className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:grid-cols-[280px_1.2fr_0.9fr_120px]"
                    >
                      <div className="relative h-48 md:h-52 w-full overflow-hidden rounded-xl">
                        <img src={roomImage} alt={room.name} className="h-full w-full object-cover" />
                        {room.totalRooms !== undefined && (
                          <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#DC2626] shadow">
                            {room.totalRooms} phòng
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-[#0F172A]">{room.name}</h3>
                          {roomArea && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] px-2 py-1 text-xs text-[#374151]">
                              {roomArea}
                            </span>
                          )}
                          {room.isActive === false && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE8E6] px-2 py-1 text-xs text-[#9C1F23] font-semibold">
                              Vô hiệu hóa
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#4B5563]">{room.description || "Phòng tiêu chuẩn"}</p>
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
                        <p className="text-xs text-[#9CA3AF]">Giá/phòng/đêm</p>
                        <p className="text-2xl font-bold text-[#DC2626]">{formatPrice(Number(roomPrice))}</p>
                        <p className="text-[11px] text-[#9CA3AF]">Chưa bao gồm thuế & phí</p>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <button
                          onClick={() => router.push(`/host/hotels/${hotelId}/rooms/${room.id}`)}
                          className="rounded-lg px-3 py-2 text-white font-semibold shadow transition bg-[#2563EB] hover:bg-[#1D4ED8] text-sm"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Amenities */}
          <section id="amenities" className="mx-auto max-w-5xl px-4 md:px-8 lg:px-12 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#0F172A]">Tiện ích của khách sạn</h2>
              <button
                onClick={() => alert("Tính năng đang phát triển")}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0057FF] px-3 py-1.5 text-xs font-semibold text-[#0057FF] transition hover:bg-[#0057FF] hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.378 2.61799C17.7231 2.27287 18.2769 2.27287 18.622 2.61799L21.382 5.378C21.7271 5.72312 21.7271 6.27688 21.382 6.622L11 17H8V14L17.378 2.61799Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Chỉnh sửa
              </button>
            </div>
            <div className="space-y-4">
              {amenityCategories.length === 0 ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <p className="text-[#6B7280]">Chưa có tiện ích nào</p>
                </div>
              ) : (
                amenityCategories.map((category, categoryIndex) => (
                  <div key={category.id || `category-${categoryIndex}`} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-[#0F172A] mb-3">{category.title}</h3>
                    {category.items && category.items.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {category.items.map((item, itemIndex) => (
                          <div key={item.id || `item-${categoryIndex}-${itemIndex}`} className="flex items-center gap-2 text-sm text-[#374151]">
                            <span className="h-2 w-2 rounded-full bg-[#2563EB]"></span>
                            {item.title}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#6B7280]">Chưa có tiện ích trong danh mục này</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Policies */}
          <section id="policies" className="mx-auto max-w-5xl px-4 md:px-8 lg:px-12 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#0F172A]">Chính sách</h2>
              <button
                onClick={() => alert("Tính năng đang phát triển")}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0057FF] px-3 py-1.5 text-xs font-semibold text-[#0057FF] transition hover:bg-[#0057FF] hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.378 2.61799C17.7231 2.27287 18.2769 2.27287 18.622 2.61799L21.382 5.378C21.7271 5.72312 21.7271 6.27688 21.382 6.622L11 17H8V14L17.378 2.61799Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Chỉnh sửa
              </button>
            </div>
            <div className="space-y-4">
              {hotel.policies && hotel.policies.length > 0 ? (
                hotel.policies.map((policy, index) => (
                  <div key={index} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-[#0F172A] mb-2">{policy.title}</h3>
                    <p className="text-sm text-[#4B5563] leading-relaxed">{policy.content}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <p className="text-[#6B7280]">Chưa có chính sách nào</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveEdit}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0F172A]">Chỉnh sửa thông tin khách sạn</h2>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full p-2 hover:bg-[#F3F4F6] transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 space-y-6">
                {/* Thông tin cơ bản */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Thông tin cơ bản</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-2">
                      Tên khách sạn <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      placeholder="Nhập tên khách sạn"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-2">
                      Mô tả <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF] min-h-[100px]"
                      placeholder="Nhập mô tả về khách sạn"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">
                        Xếp hạng sao <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.starRating}
                        onChange={(e) => setFormData({...formData, starRating: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        required
                      >
                        <option value="0">Chọn xếp hạng</option>
                        <option value="1">1 sao</option>
                        <option value="2">2 sao</option>
                        <option value="3">3 sao</option>
                        <option value="4">4 sao</option>
                        <option value="5">5 sao</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">
                        Thành phố <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.cityId}
                        onChange={(e) => setFormData({...formData, cityId: e.target.value})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        required
                      >
                        <option value="">Chọn thành phố</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Địa chỉ */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Địa chỉ</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-2">
                      Đường/Số nhà <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      placeholder="Nhập địa chỉ đường/số nhà"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">Phường/Xã</label>
                      <input
                        type="text"
                        value={formData.address.ward}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, ward: e.target.value}})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        placeholder="Nhập phường/xã"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">
                        Quận/Huyện <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.address.district}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, district: e.target.value}})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        placeholder="Nhập quận/huyện"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">Quốc gia</label>
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, country: e.target.value}})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        placeholder="Nhập quốc gia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">Mã bưu điện</label>
                      <input
                        type="text"
                        value={formData.address.postalCode}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, postalCode: e.target.value}})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        placeholder="Nhập mã bưu điện"
                      />
                    </div>
                  </div>
                </div>

                {/* Thông tin liên lạc */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Thông tin liên lạc</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        placeholder="example@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        placeholder="0123456789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#374151] font-semibold hover:bg-[#F3F4F6] transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-lg bg-[#0057FF] text-white font-semibold hover:bg-[#0046CC] transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
