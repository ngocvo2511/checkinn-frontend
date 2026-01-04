'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { hotelApi, PendingHotelDetail } from '@/lib/api/hotels';

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
  'Nhận phòng sớm': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303114232-d7a69eda4caa4afa1fc05ae83c404731.png?tr=dpr-2,h-24,q-75,w-24',
  'Trả phòng trễ': 'https://ik.imagekit.io/tvlk/image/imageResource/2022/07/20/1658303169127-17694cc343283908e1d04723a09f5002.png?tr=dpr-2,h-24,q-75,w-24',
  Khác: 'https://via.placeholder.com/24?text=O',
};

const PolicyIcon = ({ category }: { category?: string }) => {
  if (!category) return null;
  if (category === 'Thời gian nhận phòng/trả phòng') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-[#0F172A] flex-shrink-0 mt-0.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  if (category === 'Khác') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-[#4B5563] flex-shrink-0 mt-0.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  const iconUrl = policyCategoryIcons[category];
  if (!iconUrl) {
    return (
      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#E5E7EB] text-[10px] font-semibold text-[#4B5563] mt-0.5">
        {category.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return <img src={iconUrl} alt={category} className="w-5 h-5 object-contain flex-shrink-0 mt-0.5" />;
};

export default function AdminPendingHotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.id as string;

  const [hotel, setHotel] = useState<PendingHotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    if (hotelId) {
      fetchHotelDetail();
    }
  }, [hotelId]);

  const fetchHotelDetail = async () => {
    try {
      setLoading(true);
      const data = await hotelApi.getPendingHotelDetail(hotelId);
      setHotel(data);
    } catch (err) {
      setError('Failed to load hotel detail');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Bạn có chắc chắn muốn duyệt khách sạn này?')) return;

    try {
      setActionLoading(true);
      await hotelApi.approveHotel(hotelId);
      alert('Khách sạn đã được duyệt thành công!');
      router.push('/admin/pending');
    } catch (err) {
      console.error('Failed to approve hotel:', err);
      alert('Có lỗi xảy ra khi duyệt khách sạn. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const note = rejectNote.trim();
    if (!note) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn từ chối khách sạn này?')) return;

    try {
      setActionLoading(true);
      await hotelApi.rejectHotel(hotelId, note);
      alert('Khách sạn đã bị từ chối.');
      router.push('/admin/pending');
    } catch (err) {
      console.error('Failed to reject hotel:', err);
      alert('Có lỗi xảy ra khi từ chối khách sạn. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <main className="flex-1 px-6 py-10">
          <div className="mx-auto flex w-full max-w-6xl gap-6">
            <AdminMenu />
            <div className="flex-1 flex items-center justify-center">
              <p>Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <main className="flex-1 px-6 py-10">
          <div className="mx-auto flex w-full max-w-6xl gap-6">
            <AdminMenu />
            <div className="flex-1 flex items-center justify-center">
              <p className="text-red-500">{error || 'Hotel not found'}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10 text-[15px] md:text-base">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <AdminMenu />

          <div className="flex-1 space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                Chi tiết khách sạn
              </div>
              <div className="mt-4 space-y-2">
                <h1 className="text-3xl font-semibold leading-[38px]">{hotel.name}</h1>
                <p className="max-w-2xl text-base text-white/85">
                  Xem chi tiết và quyết định duyệt hoặc từ chối khách sạn.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-base text-[#383E48] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Tên khách sạn</label>
                      <p className="mt-1">{hotel.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Đánh giá sao</label>
                      <p className="mt-1">{hotel.starRating || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Thành phố</label>
                      <p className="mt-1">{hotel.address.city}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Địa chỉ</label>
                      <p className="mt-1">{hotel.address.street}, {hotel.address.country}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Email liên hệ</label>
                      <p className="mt-1">{hotel.contactEmail || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Số điện thoại</label>
                      <p className="mt-1">{hotel.contactPhone || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Ngày tạo</label>
                      <p className="mt-1">{new Date(hotel.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Trạng thái</label>
                      <p className="mt-1">{hotel.approvedStatus}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Thông tin chủ sở hữu</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Tên</label>
                      <p className="mt-1">{hotel.owner.fullName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Email</label>
                      <p className="mt-1">{hotel.owner.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Số điện thoại</label>
                      <p className="mt-1">{hotel.owner.phone || 'Chưa có'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Thông tin pháp lý</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Giấy phép kinh doanh</label>
                      <p className="mt-1">{hotel.businessLicenseNumber || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Mã số thuế</label>
                      <p className="mt-1">{hotel.taxId || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">Giấy phép hoạt động</label>
                      <p className="mt-1">{hotel.operationLicenseNumber || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 uppercase">CMND/CCCD chủ</label>
                      <p className="mt-1">{hotel.ownerIdentityNumber || 'Chưa có'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Mô tả</h2>
                  <p className="text-gray-700">{hotel.description}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Hình ảnh</h2>
                  {hotel.mediaAssets && hotel.mediaAssets.length > 0 ? (
                    <div className="space-y-4">
                      {/* Thumbnail */}
                      {hotel.mediaAssets.find((asset: any) => asset.isThumbnail) && (
                        <div>
                          <label className="block text-base font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                          <img
                            src={hotel.mediaAssets.find((asset: any) => asset.isThumbnail).url}
                            alt="Hotel thumbnail"
                            className="w-full max-w-md h-48 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                      {/* Additional images */}
                      {hotel.mediaAssets.filter((asset: any) => !asset.isThumbnail).length > 0 && (
                        <div>
                          <label className="block text-base font-medium text-gray-700 mb-2">Ảnh bổ sung</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {hotel.mediaAssets
                              .filter((asset: any) => !asset.isThumbnail)
                              .map((asset: any, index: number) => (
                                <img
                                  key={asset.id || index}
                                  src={asset.url}
                                  alt={`Hotel image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có hình ảnh</p>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Chính sách</h2>
                  {hotel.policies && hotel.policies.length > 0 ? (
                    <div className="space-y-4">
                      {hotel.policies.map((policy: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-b-0 flex gap-3">
                          <PolicyIcon category={policy.category || policy.title} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{policy.category || policy.title}</h3>
                            <p className="text-gray-700 mt-1 text-base">{policy.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có chính sách</p>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Câu hỏi thường gặp</h2>
                  {hotel.faqs && hotel.faqs.length > 0 ? (
                    <div className="space-y-4">
                      {hotel.faqs.map((faq: any, index: number) => (
                        <div key={faq.id || index} className="border-b pb-4 last:border-b-0">
                          <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                          <p className="text-gray-700 mt-1 text-base whitespace-pre-line">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có FAQ</p>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Tiện nghi</h2>
                  {hotel.amenityCategories && hotel.amenityCategories.length > 0 ? (
                    <div className="space-y-4">
                      {hotel.amenityCategories.map((category: any, index: number) => (
                        <div key={category.id || index} className="border-b pb-4 last:border-b-0">
                          <h3 className="font-medium text-gray-900">{category.title}</h3>
                          {category.items && category.items.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 text-base">
                              {category.items.map((item: any, itemIndex: number) => (
                                <li key={item.id || itemIndex}>{item.title}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 mt-2">Không có tiện nghi cụ thể</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có tiện nghi</p>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t">
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Lý do từ chối (bắt buộc khi từ chối)</label>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="Mô tả ngắn gọn lý do không duyệt"
                    />
                  </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center rounded-xl bg-[#0057FF] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#0046CC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading ? 'Đang xử lý...' : 'Duyệt khách sạn'}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-base font-semibold text-red-600 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                      </button>
                      <button
                        onClick={() => router.push('/admin/pending')}
                        className="inline-flex items-center justify-center rounded-xl border border-[#E0E4F2] bg-white px-5 py-3 text-base font-semibold text-[#0B1B3F] shadow-sm transition hover:border-[#0057FF] hover:text-[#0057FF]"
                      >
                        Quay lại
                      </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}