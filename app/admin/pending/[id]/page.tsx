'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { hotelApi, PendingHotelDetail } from '@/lib/api/hotels';
import HotelLocationMap from '@/components/map/HotelLocationMap';

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
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

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
      <div className="min-h-screen bg-[#F9F9F9]">
        <AdminMenu />
        <main className="ml-[280px] px-8 py-6">
          <div className="max-w-7xl flex items-center justify-center">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AdminMenu />
        <main className="ml-[280px] px-8 py-6">
          <div className="max-w-7xl flex items-center justify-center">
            <p className="text-red-500">{error || 'Hotel not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />

      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
                CheckInn Admin
              </div>
              <h1 className="mt-2 text-2xl font-semibold">{hotel.name}</h1>
              <p className="mt-1 text-sm text-white/85">
                Xem chi tiết và quyết định duyệt hoặc từ chối khách sạn.
              </p>
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

                <div className="rounded-xl border border-gray-200 bg-[#FBFBFC] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Vị trí ghim trên bản đồ (Xác thực tọa độ)
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Đối chiếu vị trí ghim thực tế với địa chỉ đã khai báo trước khi phê duyệt.
                      </p>
                    </div>
                    {hotel.address.latitude != null && hotel.address.longitude != null && (
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                        {hotel.address.latitude.toFixed(6)}, {hotel.address.longitude.toFixed(6)}
                      </span>
                    )}
                  </div>
                  <HotelLocationMap
                    latitude={hotel.address.latitude}
                    longitude={hotel.address.longitude}
                    hotelName={hotel.name}
                    street={hotel.address.street}
                    city={hotel.address.city}
                    country={hotel.address.country}
                    height="320px"
                  />
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

                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Xác thực Pháp lý & Giấy tờ (KYB / KYC)</h2>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Tài liệu nhạy cảm được bảo mật qua Private Storage. Liên kết xem có hiệu lực trong 5 phút.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      Private & Encrypted
                    </span>
                  </div>

                  {/* 1. Giấy phép kinh doanh */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                          <h3 className="font-semibold text-gray-900">Giấy phép đăng ký kinh doanh</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-4">
                          <div>
                            <span className="text-gray-500">Số ĐKKD: </span>
                            <span className="font-mono font-medium text-gray-900">{hotel.businessLicenseNumber || 'Chưa cung cấp'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Mã số thuế: </span>
                            <span className="font-mono font-medium text-gray-900">{hotel.taxId || 'Chưa cung cấp'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {hotel.businessLicenseUrl ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={hotel.businessLicenseUrl}
                              alt="GPKD"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition shadow-sm"
                              onClick={() => setPreviewDoc({ url: hotel.businessLicenseUrl!, title: 'Giấy phép đăng ký kinh doanh' })}
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: hotel.businessLicenseUrl!, title: 'Giấy phép đăng ký kinh doanh' })}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                            >
                              Phóng to đối chiếu
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded bg-gray-100 px-2.5 py-1.5 text-xs text-gray-500">
                            Chưa tải lên ảnh
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Giấy phép hoạt động / PCCC */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          <h3 className="font-semibold text-gray-900">Giấy chứng nhận ANTT / PCCC</h3>
                        </div>
                        <div className="text-sm pl-4">
                          <span className="text-gray-500">Số giấy phép: </span>
                          <span className="font-mono font-medium text-gray-900">{hotel.operationLicenseNumber || 'Chưa cung cấp'}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {hotel.operationLicenseUrl ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={hotel.operationLicenseUrl}
                              alt="Giấy phép con"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition shadow-sm"
                              onClick={() => setPreviewDoc({ url: hotel.operationLicenseUrl!, title: 'Giấy chứng nhận ANTT / PCCC' })}
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: hotel.operationLicenseUrl!, title: 'Giấy chứng nhận ANTT / PCCC' })}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                            >
                              Phóng to đối chiếu
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded bg-gray-100 px-2.5 py-1.5 text-xs text-gray-500">
                            Chưa tải lên ảnh
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Định danh chủ sở hữu (CCCD) */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          <h3 className="font-semibold text-gray-900">Căn cước công dân (Chủ khách sạn)</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-4">
                          <div>
                            <span className="text-gray-500">Họ và tên chủ: </span>
                            <span className="font-semibold text-gray-900">{hotel.owner?.fullName || 'Chưa có'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Số CCCD đã nhập: </span>
                            <span className="font-mono font-medium text-gray-900">{hotel.ownerIdentityNumber || 'Chưa cung cấp'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {hotel.ownerIdentityFrontUrl ? (
                          <div className="text-center">
                            <img
                              src={hotel.ownerIdentityFrontUrl}
                              alt="CCCD Mặt trước"
                              className="w-20 h-14 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition shadow-sm"
                              onClick={() => setPreviewDoc({ url: hotel.ownerIdentityFrontUrl!, title: 'CCCD Mặt trước' })}
                            />
                            <span className="text-[10px] text-gray-500 block mt-0.5">Mặt trước</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Thiếu mặt trước</span>
                        )}

                        {hotel.ownerIdentityBackUrl ? (
                          <div className="text-center">
                            <img
                              src={hotel.ownerIdentityBackUrl}
                              alt="CCCD Mặt sau"
                              className="w-20 h-14 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition shadow-sm"
                              onClick={() => setPreviewDoc({ url: hotel.ownerIdentityBackUrl!, title: 'CCCD Mặt sau' })}
                            />
                            <span className="text-[10px] text-gray-500 block mt-0.5">Mặt sau</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Thiếu mặt sau</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Checklist hướng dẫn Admin */}
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-amber-950">
                      <span>⚠️</span> Lưu ý kiểm tra trước khi bấm duyệt:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
                      <li>Họ tên trên CCCD phải trùng với Người đại diện pháp luật / Chủ hộ kinh doanh trên GPKD.</li>
                      <li>Địa chỉ đăng ký kinh doanh trên GPKD phải khớp với địa chỉ khách sạn thực tế.</li>
                      <li>Số CCCD trên ảnh phải khớp từng chữ số với số khai báo trên hệ thống.</li>
                      <li>Giấy phép có mộc đỏ rõ ràng, không có dấu hiệu tẩy xóa, chắp vá.</li>
                    </ul>
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
        </main>

        {/* Document Lightbox Modal for Admin Verification */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative max-h-[92vh] max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{previewDoc.title}</h3>
                  <p className="text-xs text-gray-500">Bản phóng to để kiểm tra dấu mộc, chữ ký và thông tin định danh</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Mở tab mới
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 min-h-[400px]">
                {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewDoc.url} className="w-full h-[600px] rounded-lg" title={previewDoc.title} />
                ) : (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
}