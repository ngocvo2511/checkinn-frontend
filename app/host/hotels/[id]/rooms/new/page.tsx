"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import HostMenu from "@/components/host/menu/HostMenu";
import { hotelApi } from "@/lib/api/hotels";

export default function NewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [roomImages, setRoomImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: 0,
    roomAmount: 1,
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
    if (!file || !createdRoomId) return;

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
      const nextSortOrder = roomImages.length;
      const isFirstImage = roomImages.length === 0;
      const newMedia = await hotelApi.uploadMedia(createdRoomId, 'ROOM_TYPE', file, isFirstImage, nextSortOrder);

      setRoomImages([...roomImages, newMedia]);
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
    if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;

    setDeletingImageId(mediaId);
    setError(null);

    try {
      await hotelApi.deleteMedia(mediaId);
      const updatedImages = roomImages.filter(m => m.id !== mediaId);

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

      setRoomImages(updatedImages);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa hình ảnh');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSetThumbnail = async (mediaId: string) => {
    if (!confirm('Bạn có muốn đặt hình ảnh này làm ảnh đại diện?')) return;

    setError(null);

    try {
      await hotelApi.setThumbnail(mediaId);
      const updatedImages = roomImages.map(m => ({
        ...m,
        isThumbnail: m.id === mediaId
      }));
      setRoomImages(updatedImages);
      setSuccessMessage('Đã đặt ảnh đại diện mới!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt ảnh đại diện');
    }
  };

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
      alert('Số lượng phòng phải lớn hơn 0');
      return;
    }
    if (formData.capacity.adults <= 0) {
      alert('Số người lớn phải lớn hơn 0');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const newRoom = await hotelApi.createRoomType({
        hotelId,
        name: formData.name,
        basePrice: formData.basePrice,
        capacity: formData.capacity,
        roomAmount: formData.roomAmount,
        description: formData.description,
        amenities: selectedAmenities,
      });

      setCreatedRoomId(newRoom.id);
      setSuccessMessage('Đã thêm phòng mới thành công! Bạn có thể thêm hình ảnh hoặc quay lại.');
    } catch (err: any) {
      setError(err?.message || 'Không thể thêm phòng mới');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <div className="flex">
        <HostMenu />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.push(`/host/hotels/${hotelId}`)}
                className="mb-2 text-sm text-[#6B7280] hover:text-[#0057FF] flex items-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Quay lại
              </button>
              <h1 className="text-2xl font-bold text-[#0F172A]">Thêm phòng mới</h1>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
                {successMessage}
              </div>
            )}

            {/* Image Upload Section - Show after room is created */}
            {createdRoomId && (
              <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
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

                  {roomImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {roomImages.map((img) => (
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
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            {!createdRoomId && (
            <form onSubmit={handleSave} className="space-y-6">
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
                        min="1"
                        value={formData.roomAmount}
                        onChange={(e) => setFormData({ ...formData, roomAmount: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                      />
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
                    'Thêm phòng'
                  )}
                </button>
              </div>
            </form>
            )}

            {/* Back button after creation */}
            {createdRoomId && (
              <div className="flex justify-end">
                <button
                  onClick={() => router.push(`/host/hotels/${hotelId}`)}
                  className="px-6 py-2 rounded-lg bg-[#0057FF] text-white font-semibold hover:bg-[#0046CC] transition"
                >
                  Hoàn tất và quay lại
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
