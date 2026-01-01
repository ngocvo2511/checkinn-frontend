"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import HostMenu from "@/components/host/menu/HostMenu";
import { hotelApi, RoomType } from "@/lib/api/hotels";

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const roomId = typeof params?.roomId === "string" ? params.roomId : Array.isArray(params?.roomId) ? params.roomId[0] : "";

  const [room, setRoom] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [initialRoomAmount, setInitialRoomAmount] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: 0,
    roomAmount: 0,
    capacity: {
      adults: 2,
      children: 0,
      bedType: '',
      roomSize: 0,
      breakfastIncluded: false,
      breakfastQuantity: 0,
    }
  });

  const handleAddAmenity = () => {
    const trimmed = newAmenityInput.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities([...selectedAmenities, trimmed]);
      setNewAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setSelectedAmenities(selectedAmenities.filter((_, i) => i !== index));
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !room) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tập tin hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const currentImages = room.mediaAssets || [];
      const nextSortOrder = currentImages.length;
      const isFirstImage = currentImages.length === 0;
      const newMedia = await hotelApi.uploadMedia(roomId, 'ROOM_TYPE', file, isFirstImage, nextSortOrder);

      setRoom({
        ...room,
        mediaAssets: [...currentImages, newMedia]
      });
      setSuccessMessage(`Đã tải lên hình ảnh thành công!${isFirstImage ? ' (Đã đặt làm ảnh đại diện)' : ''}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      event.target.value = '';
    } catch (err: any) {
      setError(err?.message || 'Không thể tải lên hình ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (mediaId: string, isThumbnail: boolean) => {
    if (!room) return;
    if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;

    setDeletingImageId(mediaId);
    setError(null);

    try {
      await hotelApi.deleteMedia(mediaId);
      const updatedImages = (room.mediaAssets || []).filter(m => m.id !== mediaId);

      if (isThumbnail && updatedImages.length > 0) {
        try {
          await hotelApi.setThumbnail(updatedImages[0].id);
          updatedImages[0] = { ...updatedImages[0], isThumbnail: true };
          setSuccessMessage('Đã xóa hình ảnh và đặt ảnh đại diện mới!');
        } catch (err) {
          setSuccessMessage('Đã xóa hình ảnh (lỗi khi đặt ảnh đại diện mới)');
        }
      } else {
        setSuccessMessage('Đã xóa hình ảnh thành công!');
      }

      setRoom({
        ...room,
        mediaAssets: updatedImages
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa hình ảnh');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSetThumbnail = async (mediaId: string) => {
    if (!room) return;
    if (!confirm('Bạn có muốn đặt hình ảnh này làm ảnh đại diện?')) return;

    setError(null);

    try {
      await hotelApi.setThumbnail(mediaId);
      const updatedImages = (room.mediaAssets || []).map(m => ({
        ...m,
        isThumbnail: m.id === mediaId
      }));
      setRoom({
        ...room,
        mediaAssets: updatedImages
      });
      setSuccessMessage('Đã đặt ảnh đại diện mới!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt ảnh đại diện');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vui lòng đăng nhập để chỉnh sửa phòng");
      setLoading(false);
      return;
    }

    const fetchRoom = async () => {
      if (!roomId) {
        setError("Thiếu mã phòng");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await hotelApi.getRoomTypeById(roomId);
        setRoom(data);
        setSelectedAmenities(data.amenities || []);
        const currentRoomAmount = data.roomAmount ?? data.totalRooms ?? data.availableRooms ?? 0;
        setInitialRoomAmount(currentRoomAmount);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          basePrice: data.basePrice || data.pricePerNight || 0,
          roomAmount: currentRoomAmount,
          capacity: {
            adults: data.capacity?.adults || 2,
            children: data.capacity?.children || 0,
            bedType: data.capacity?.bedType || data.bedType || '',
            roomSize: data.capacity?.roomSize || data.roomSize || 0,
            breakfastIncluded: data.capacity?.breakfastIncluded || false,
            breakfastQuantity: data.capacity?.breakfastQuantity || 0,
          }
        });
      } catch (err: any) {
        setError(err?.message || "Không thể tải thông tin phòng");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Tên phòng không được để trống');
      return;
    }
    if (formData.basePrice <= 0) {
      alert('Giá phòng phải lớn hơn 0');
      return;
    }
    if (formData.roomAmount <= 0) {
      setError('Số lượng phòng phải lớn hơn 0');
      return;
    }
    if (formData.roomAmount < initialRoomAmount) {
      setError(`Số lượng phòng không thể giảm xuống dưới ${initialRoomAmount}. Hiện tại: ${initialRoomAmount} phòng.`);
      return;
    }
    if (formData.capacity.adults <= 0) {
      setError('Số người lớn phải lớn hơn 0');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await hotelApi.updateRoomType(roomId, {
        name: formData.name,
        basePrice: formData.basePrice,
        capacity: formData.capacity,
        roomAmount: formData.roomAmount,
        description: formData.description,
        amenities: selectedAmenities,
      });

      setSuccessMessage('Đã cập nhật thông tin phòng thành công!');
      setTimeout(() => {
        router.push(`/host/hotels/${hotelId}`);
      }, 1500);
    } catch (err: any) {
      // Xử lý lỗi từ backend
      let errorMessage = 'Không thể cập nhật thông tin phòng';
      
      if (err?.message) {
        errorMessage = err.message;
      }
      
      // Kiểm tra lỗi cụ thể về số lượng phòng
      if (errorMessage.includes('Số lượng phòng') || errorMessage.includes('roomAmount')) {
        errorMessage = `Không thể giảm số lượng phòng. Số lượng phòng hiện tại là ${initialRoomAmount}, bạn chỉ có thể tăng hoặc giữ nguyên.`;
      }
      
      setError(errorMessage);
      // Scroll to top để hiển thị lỗi
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!room) return;

    const action = room.isActive ? "vô hiệu hóa" : "kích hoạt";
    const confirmMessage = room.isActive
      ? "Bạn có chắc chắn muốn vô hiệu hóa phòng này? Phòng sẽ không hiển thị trên hệ thống."
      : "Bạn có chắc chắn muốn kích hoạt lại phòng này?";

    if (!confirm(confirmMessage)) return;

    setToggling(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (room.isActive) {
        await hotelApi.deactivateRoomType(roomId);
      } else {
        await hotelApi.activateRoomType(roomId);
      }

      setRoom({ ...room, isActive: !room.isActive });
      setSuccessMessage(`Đã ${action} phòng thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || `Không thể ${action} phòng`);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Header />
        <div className="flex">
          <HostMenu />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-[#6B7280]">Đang tải...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Header />
        <div className="flex">
          <HostMenu />
          <main className="flex-1 p-8">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
              {error}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <div className="flex">
        <HostMenu />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push(`/host/hotels/${hotelId}`)}
                  className="mb-2 text-sm text-[#6B7280] hover:text-[#0057FF] flex items-center gap-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Quay lại
                </button>
                <h1 className="text-2xl font-bold text-[#0F172A]">Chỉnh sửa phòng</h1>
              </div>
              {room && (
                <button
                  onClick={handleToggleActive}
                  disabled={toggling}
                  className={`rounded-lg px-4 py-2 font-semibold transition disabled:opacity-50 ${
                    room.isActive
                      ? 'bg-[#FFE8E6] text-[#9C1F23] hover:bg-[#FCD2CF]'
                      : 'bg-[#D1F2E9] text-[#0B6E4F] hover:bg-[#B8E8D8]'
                  }`}
                >
                  {toggling ? 'Đang xử lý...' : room.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                </button>
              )}
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-6">
              {/* Image Upload Section */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Hình ảnh phòng</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-[#0057FF] text-[#0057FF] font-semibold hover:bg-[#F0F7FF] transition cursor-pointer">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {uploading ? 'Đang tải lên...' : 'Thêm hình ảnh'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-sm text-[#6B7280]">Tải lên hình ảnh phòng (tối đa 5MB, định dạng JPG, PNG)</p>
                  </div>

                  {room?.mediaAssets && room.mediaAssets.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {room.mediaAssets.map((img) => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[#E5E7EB]">
                          <img src={img.url} alt="Room" className="w-full h-32 object-cover" />
                          {img.isThumbnail && (
                            <span className="absolute top-2 left-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow">
                              Ảnh đại diện
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            {!img.isThumbnail && (
                              <button
                                type="button"
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
                              type="button"
                              onClick={() => handleDeleteImage(img.id, img.isThumbnail)}
                              disabled={deletingImageId === img.id}
                              className="rounded-full bg-red-600 p-1.5 text-white shadow-lg hover:bg-red-700 disabled:opacity-50"
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B7280]">Chưa có hình ảnh nào</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Thông tin cơ bản</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Tên phòng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      placeholder="VD: Phòng Deluxe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      placeholder="Mô tả về phòng..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Giá/đêm (VND) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Số lượng phòng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={initialRoomAmount}
                        value={formData.roomAmount}
                        onChange={(e) => setFormData({ ...formData, roomAmount: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      />
                      {initialRoomAmount > 0 && (
                        <p className="mt-1 text-xs text-[#6B7280]">
                          Số lượng hiện tại: {initialRoomAmount}. Chỉ có thể tăng hoặc giữ nguyên.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Diện tích (m²)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.capacity.roomSize}
                        onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, roomSize: Number(e.target.value) } })}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Tiện ích phòng</h2>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-[#374151]">
                    Thêm tiện ích
                  </label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAmenityInput}
                      onChange={(e) => setNewAmenityInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAmenity();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      placeholder="VD: WiFi miễn phí, TV màn hình phẳng..."
                    />
                    <button
                      type="button"
                      onClick={handleAddAmenity}
                      className="px-4 py-2 rounded-lg bg-[#0057FF] text-white font-semibold hover:bg-[#0046CC] transition"
                    >
                      Thêm
                    </button>
                  </div>

                  {selectedAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedAmenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 rounded-full bg-[#E0F2FE] px-3 py-1 text-sm font-medium text-[#0369A1]"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(idx)}
                            className="hover:text-[#DC2626]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Sức chứa</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Người lớn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity.adults}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, adults: Number(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Trẻ em
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.capacity.children}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, children: Number(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Loại giường
                    </label>
                    <input
                      type="text"
                      value={formData.capacity.bedType}
                      onChange={(e) => setFormData({
                        ...formData,
                        capacity: { ...formData.capacity, bedType: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      placeholder="VD: 1 giường đôi, 2 giường đơn"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.capacity.breakfastIncluded}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, breakfastIncluded: e.target.checked }
                        })}
                        className="w-4 h-4 text-[#0057FF] border-gray-300 rounded focus:ring-[#0057FF]"
                      />
                      <span className="text-sm text-[#374151]">Bao gồm bữa sáng</span>
                    </label>

                    {formData.capacity.breakfastIncluded && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-[#374151]">Số lượng:</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.capacity.breakfastQuantity}
                          onChange={(e) => setFormData({
                            ...formData,
                            capacity: { ...formData.capacity, breakfastQuantity: Number(e.target.value) }
                          })}
                          className="w-20 px-3 py-1 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/host/hotels/${hotelId}`)}
                  className="px-6 py-2 rounded-lg border border-[#E5E7EB] text-[#374151] font-semibold hover:bg-[#F3F4F6] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-[#0057FF] text-white font-semibold hover:bg-[#0046CC] transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {saving ? (
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
        </main>
      </div>
    </div>
  );
}
