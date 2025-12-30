'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import HostMenu from '@/components/host/menu/HostMenu';
import { cityApi, type City } from '@/lib/api/cities';

type Policy = {
  title: string;
  content: string;
};

type AmenityItem = {
  title: string;
};

type AmenityCategory = {
  title: string;
  amenities: AmenityItem[];
};

type FormState = {
  name: string;
  description: string;
  starRating: string;
  cityId: string;
  addressStreet: string;
  addressCity: string;
  addressCountry: string;
  contactEmail: string;
  contactPhone: string;
  businessLicenseNumber: string;
  taxId: string;
  operationLicenseNumber: string;
  ownerIdentityNumber: string;
  policies: Policy[];
  amenityCategories: AmenityCategory[];
};

type PreviewFile = {
  file: File;
  preview: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
// Media routes in hotel-service do not share the /hotels prefix, so we go through the service-id path.
const MEDIA_UPLOAD_URL = `${API_BASE_URL}/hotel-service/medias`;

const initialForm: FormState = {
  name: '',
  description: '',
  starRating: '4',
  cityId: '',
  addressStreet: '',
  addressCity: '',
  addressCountry: 'Vietnam',
  contactEmail: '',
  contactPhone: '',
  businessLicenseNumber: '',
  taxId: '',
  operationLicenseNumber: '',
  ownerIdentityNumber: '',
  policies: [],
  amenityCategories: [],
};

export default function HostCreateHotelPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const [cityInput, setCityInput] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [citySelected, setCitySelected] = useState(false);

  const [thumbnail, setThumbnail] = useState<PreviewFile | null>(null);
  const [gallery, setGallery] = useState<PreviewFile[]>([]);

  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const results = await cityApi.getAllCities();
        setCities(results);
      } catch (err: any) {
        setCitiesError(err?.message || 'Khong tai duoc danh sach thanh pho.');
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  useEffect(() => {
    if (!form.cityId) return;
    const selected = cities.find((c) => c.id === form.cityId);
    if (!selected) return;
    setForm((prev) => ({
      ...prev,
      addressCity: selected.name,
      addressCountry: prev.addressCountry || 'Vietnam',
    }));
    setCityInput(selected.name);
  }, [form.cityId, cities]);

  const filteredCities = useMemo(() => {
    if (!showCitySuggestions) return [];
    if (!cityInput.trim()) return cities.slice(0, 50);
    return cities.filter((c) => c.name.toLowerCase().includes(cityInput.toLowerCase()));
  }, [cities, cityInput, showCitySuggestions]);

  const handleInputChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Policies handlers
  const addPolicy = () => {
    setForm((prev) => ({ ...prev, policies: [...prev.policies, { title: '', content: '' }] }));
  };

  const updatePolicy = (index: number, field: keyof Policy, value: string) => {
    setForm((prev) => {
      const newPolicies = [...prev.policies];
      newPolicies[index] = { ...newPolicies[index], [field]: value };
      return { ...prev, policies: newPolicies };
    });
  };

  const removePolicy = (index: number) => {
    setForm((prev) => ({ ...prev, policies: prev.policies.filter((_, i) => i !== index) }));
  };

  // Amenity Categories handlers
  const addAmenityCategory = () => {
    setForm((prev) => ({ ...prev, amenityCategories: [...prev.amenityCategories, { title: '', amenities: [] }] }));
  };

  const updateAmenityCategoryTitle = (index: number, title: string) => {
    setForm((prev) => {
      const newCats = [...prev.amenityCategories];
      newCats[index] = { ...newCats[index], title };
      return { ...prev, amenityCategories: newCats };
    });
  };

  const removeAmenityCategory = (index: number) => {
    setForm((prev) => ({ ...prev, amenityCategories: prev.amenityCategories.filter((_, i) => i !== index) }));
  };

  const addAmenityItem = (catIndex: number) => {
    setForm((prev) => {
      const newCats = [...prev.amenityCategories];
      newCats[catIndex] = { ...newCats[catIndex], amenities: [...newCats[catIndex].amenities, { title: '' }] };
      return { ...prev, amenityCategories: newCats };
    });
  };

  const updateAmenityItem = (catIndex: number, itemIndex: number, title: string) => {
    setForm((prev) => {
      const newCats = [...prev.amenityCategories];
      const newItems = [...newCats[catIndex].amenities];
      newItems[itemIndex] = { title };
      newCats[catIndex] = { ...newCats[catIndex], amenities: newItems };
      return { ...prev, amenityCategories: newCats };
    });
  };

  const removeAmenityItem = (catIndex: number, itemIndex: number) => {
    setForm((prev) => {
      const newCats = [...prev.amenityCategories];
      newCats[catIndex] = { ...newCats[catIndex], amenities: newCats[catIndex].amenities.filter((_, i) => i !== itemIndex) };
      return { ...prev, amenityCategories: newCats };
    });
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setThumbnail(null);
      return;
    }
    setThumbnail({ file, preview: URL.createObjectURL(file) });
  };

  const handleGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setGallery((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const removeGalleryItem = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): string[] => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Ten khach san');
    if (!form.cityId && !form.addressCity.trim()) missing.push('Thanh pho');
    if (!form.addressStreet.trim()) missing.push('Dia chi duong');
    if (!form.addressCountry.trim()) missing.push('Quoc gia');
    if (!form.businessLicenseNumber.trim()) missing.push('So dang ky kinh doanh');
    if (!form.taxId.trim()) missing.push('Ma so thue');
    if (!form.ownerIdentityNumber.trim()) missing.push('So CCCD/ho chieu chu khach san');
    return missing;
  };

  const uploadMediaAssets = async (hotelId: string, token: string) => {
    const uploadSingle = async (file: File, isThumbnail: boolean, sortOrder: number) => {
      const formData = new FormData();
      formData.append('targetId', hotelId);
      formData.append('targetType', 'HOTEL');
      formData.append('isThumbnail', String(isThumbnail));
      formData.append('sortOrder', String(sortOrder));
      formData.append('file', file);

      const res = await fetch(MEDIA_UPLOAD_URL, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Khong tai duoc anh len server');
      }
    };

    if (thumbnail) {
      setStatusMessage('Dang tai anh thumbnail...');
      await uploadSingle(thumbnail.file, true, 0);
    }

    if (gallery.length > 0) {
      setStatusMessage('Dang tai bo anh khach san...');
      for (let i = 0; i < gallery.length; i += 1) {
        await uploadSingle(gallery[i].file, false, i + 1);
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setStatusMessage(null);

    const missing = validateForm();
    if (missing.length) {
      setSubmitError(`Vui long dien: ${missing.join(', ')}`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSubmitError('Vui long dang nhap de tao khach san.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      starRating: form.starRating ? Number(form.starRating) : null,
      cityId: form.cityId,
      address: {
        street: form.addressStreet.trim(),
        city: form.addressCity.trim(),
        country: form.addressCountry.trim(),
      },
      contactEmail: form.contactEmail.trim() || null,
      contactPhone: form.contactPhone.trim() || null,
      businessLicenseNumber: form.businessLicenseNumber.trim(),
      taxId: form.taxId.trim() || null,
      operationLicenseNumber: form.operationLicenseNumber.trim() || null,
      ownerIdentityNumber: form.ownerIdentityNumber.trim(),
      policies: form.policies.filter(p => p.title.trim() && p.content.trim()),
      amenityCategories: form.amenityCategories.filter(cat => cat.title.trim() && cat.amenities.some(a => a.title.trim())).map(cat => ({
        title: cat.title.trim(),
        amenities: cat.amenities.filter(a => a.title.trim())
      })),
    };

    try {
      setSubmitting(true);
      setStatusMessage('Dang tao khach san...');

      const response = await fetch(`${API_BASE_URL}/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Khong tao duoc khach san.');
      }

      const data = await response.json();
      if (thumbnail || gallery.length) {
        await uploadMediaAssets(data.id, token);
      }

      setStatusMessage('Tao khach san thanh cong. Dang chuyen toi danh sach...');
      setTimeout(() => router.push('/host/hotels'), 800);
    } catch (err: any) {
      setSubmitError(err?.message || 'Co loi xay ra, vui long thu lai.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-10 text-[15px] md:text-base">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <HostMenu />

          <div className="flex-1 space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                Tao khach san moi
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold leading-[38px]">Thông tin khách sạn</h1>
                  <p className="max-w-2xl text-base text-white/85">
                    Nhập chi tiết cơ bản, giấy tờ pháp lý và tài ảnh (thumbnail + thư viện) để gửi duyệt listing khách sạn.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Thông tin cơ bản</p>
                    <h2 className="text-xl font-semibold text-[#1F2226]">Mô tả khách sạn</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/host/hotels')}
                    className="text-base font-semibold text-[#0057FF] hover:underline"
                  >
                    Quay lại danh sách
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Tên khách sạn *</label>
                    <input
                      value={form.name}
                      onChange={handleInputChange('name')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="Vi du: Blue Sea Resort"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Đánh giá sao</label>
                    <select
                      value={form.starRating}
                      onChange={handleInputChange('starRating')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] focus:border-[#0057FF] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <option key={star} value={star}>
                          {star} sao
                        </option>
                      ))}
                      <option value="">Chưa xác định</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold text-[#1F2226]">Mô tả ngắn</label>
                  <textarea
                    value={form.description}
                    onChange={handleInputChange('description')}
                    rows={4}
                    className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                    placeholder="Noi bat tien ich, vi tri, phong..."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Liên hệ</p>
                  <h2 className="text-xl font-semibold text-[#1F2226]">Thông tin liên hệ</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Email liên hệ</label>
                    <input
                      value={form.contactEmail}
                      onChange={handleInputChange('contactEmail')}
                      type="email"
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="contact@hotel.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Số điện thoại liên hệ</label>
                    <input
                      value={form.contactPhone}
                      onChange={handleInputChange('contactPhone')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="+84 123 456 789"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Địa chỉ</p>
                    <h2 className="text-xl font-semibold text-[#1F2226]">Thông tin vị trí</h2>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Đường / số nhà *</label>
                    <input
                      value={form.addressStreet}
                      onChange={handleInputChange('addressStreet')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="123 Nguyen Van Linh"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Thành phố *</label>
                    <div className="relative">
                      <input
                        value={cityInput}
                        onChange={(e) => {
                          setCityInput(e.target.value);
                          setCitySelected(false);
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        onBlur={() => {
                          if (!citySelected) {
                            // Tìm exact match trước
                            let matched = cities.find(c => c.name.toLowerCase() === cityInput.toLowerCase().trim());
                            
                            // Nếu không tìm thấy exact match, tìm closest match
                            if (!matched && cityInput.trim()) {
                              matched = cities.find(c => 
                                c.name.toLowerCase().includes(cityInput.toLowerCase().trim()) || 
                                cityInput.toLowerCase().trim().includes(c.name.toLowerCase())
                              );
                            }
                            
                            if (matched) {
                              setForm(prev => ({ ...prev, cityId: matched.id, addressCity: matched.name }));
                              setCityInput(matched.name); // Cập nhật input để hiển thị tên chính xác
                            } else if (cityInput.trim()) {
                              // Nếu không tìm thấy match nhưng có text, vẫn lưu addressCity
                              setForm(prev => ({ ...prev, cityId: '', addressCity: cityInput.trim() }));
                            } else {
                              setCityInput('');
                              setForm(prev => ({ ...prev, cityId: '', addressCity: '' }));
                            }
                          }
                          setCitySelected(false);
                          setTimeout(() => setShowCitySuggestions(false), 200);
                        }}
                        className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                        placeholder="Nhap ten thanh pho..."
                      />
                      {showCitySuggestions && filteredCities.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8E9F1] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {filteredCities.map((city) => (
                            <button
                              type="button"
                              key={city.id}
                              onMouseDown={() => {
                                setCityInput(city.name);
                                setForm((prev) => ({ ...prev, cityId: city.id, addressCity: city.name }));
                                setCitySelected(true);
                                setShowCitySuggestions(false);
                              }}
                              className="flex w-full items-center justify-between px-4 py-2 text-left text-base hover:bg-[#F7F8FA] transition"
                            >
                              <span className="font-semibold">{city.name}</span>
                              <span className="text-sm text-[#656F81]">{city.parentName || city.parentCode || 'Vietnam'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Quốc gia *</label>
                    <input
                      value={form.addressCountry}
                      onChange={handleInputChange('addressCountry')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="Vietnam"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Giấy tờ pháp lý</p>
                  <h2 className="text-xl font-semibold text-[#1F2226]">Thông tin chủ khách sạn</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Số đăng ký kinh doanh *</label>
                    <input
                      value={form.businessLicenseNumber}
                      onChange={handleInputChange('businessLicenseNumber')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="0123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Mã số thuế *</label>
                    <input
                      value={form.taxId}
                      onChange={handleInputChange('taxId')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="Tùy chọn"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">Giấy phép hoạt động</label>
                    <input
                      value={form.operationLicenseNumber}
                      onChange={handleInputChange('operationLicenseNumber')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="Số giấy phép (nếu có)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-[#1F2226]">CCCD/Hộ chiếu chủ khách sạn *</label>
                    <input
                      value={form.ownerIdentityNumber}
                      onChange={handleInputChange('ownerIdentityNumber')}
                      className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                      placeholder="012345678901"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Chính sách</p>
                    <h2 className="text-xl font-semibold text-[#1F2226]">Chính sách khách sạn</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addPolicy}
                    className="text-base font-semibold text-[#0057FF] hover:underline"
                  >
                    + Thêm chính sách
                  </button>
                </div>
                <div className="space-y-4">
                  {form.policies.map((policy, index) => (
                    <div key={index} className="rounded-xl border border-[#E8E9F1] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[#1F2226]">Chinh sach {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removePolicy(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Xóa
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-base font-semibold text-[#1F2226]">Tiêu đề</label>
                        <input
                          value={policy.title}
                          onChange={(e) => updatePolicy(index, 'title', e.target.value)}
                          className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                          placeholder="Vi du: Chinh sach huy phong"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-base font-semibold text-[#1F2226]">Nội dung</label>
                        <textarea
                          value={policy.content}
                          onChange={(e) => updatePolicy(index, 'content', e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                          placeholder="Mo ta chi tiet chinh sach..."
                        />
                      </div>
                    </div>
                  ))}
                  {form.policies.length === 0 && (
                    <p className="text-base text-[#656F81] text-center py-4">Chưa có chính sách nào. Click "Thêm chính sách" để thêm.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Tiện ích</p>
                    <h2 className="text-xl font-semibold text-[#1F2226]">Tiện ích và dịch vụ</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addAmenityCategory}
                    className="text-base font-semibold text-[#0057FF] hover:underline"
                  >
                    + Thêm danh mục tiện ích
                  </button>
                </div>
                <div className="space-y-4">
                  {form.amenityCategories.map((category, catIndex) => (
                    <div key={catIndex} className="rounded-xl border border-[#E8E9F1] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[#1F2226]">Danh mục {catIndex + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeAmenityCategory(catIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Xóa
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-base font-semibold text-[#1F2226]">Tên danh mục</label>
                        <input
                          value={category.title}
                          onChange={(e) => updateAmenityCategoryTitle(catIndex, e.target.value)}
                          className="w-full rounded-xl border border-[#E8E9F1] px-4 py-3 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                          placeholder="Vi du: Tien ich phong"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-base font-semibold text-[#1F2226]">Các tiện ích</label>
                          <button
                            type="button"
                            onClick={() => addAmenityItem(catIndex)}
                            className="text-base text-[#0057FF] hover:underline"
                          >
                            + Thêm tiện ích
                          </button>
                        </div>
                        <div className="space-y-2">
                          {category.amenities.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-2">
                              <input
                                value={item.title}
                                onChange={(e) => updateAmenityItem(catIndex, itemIndex, e.target.value)}
                                className="flex-1 rounded-xl border border-[#E8E9F1] px-4 py-2 text-base text-[#1F2226] placeholder:text-[#A3A8B4] focus:border-[#0057FF] focus:outline-none"
                                placeholder="Vi du: Wifi mien phi"
                              />
                              <button
                                type="button"
                                onClick={() => removeAmenityItem(catIndex, itemIndex)}
                                className="text-red-600 hover:text-red-800 px-2"
                              >
                                X
                              </button>
                            </div>
                          ))}
                          {category.amenities.length === 0 && (
                            <p className="text-base text-[#656F81] text-center py-2">Chưa có tiện ích nào.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {form.amenityCategories.length === 0 && (
                    <p className="text-base text-[#656F81] text-center py-4">Chưa có danh mục tiện ích nào. Click "Thêm danh mục tiện ích" để thêm.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Hình ảnh</p>
                    <h2 className="text-xl font-semibold text-[#1F2226]">Thumbnail & thư viện</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-base font-semibold text-[#1F2226]">Ảnh thumbnail</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="w-full rounded-xl border border-dashed border-[#C6CCE2] px-4 py-3 text-base text-[#1F2226] focus:border-[#0057FF] focus:outline-none"
                    />
                    {thumbnail ? (
                      <div className="relative overflow-hidden rounded-xl border border-[#E8E9F1]">
                        <img src={thumbnail.preview} alt="Thumbnail preview" className="h-40 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setThumbnail(null)}
                          className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-sm font-semibold text-red-600 shadow"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <p className="text-base text-[#656F81]">Ảnh thumbnail</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-base font-semibold text-[#1F2226]">Thư viện ảnh khách sạn</label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={galleryInputRef}
                      onChange={handleGalleryChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full rounded-xl border border-dashed border-[#C6CCE2] px-4 py-3 text-base text-[#1F2226] hover:border-[#0057FF] focus:border-[#0057FF] focus:outline-none"
                    >
                      Chọn ảnh để thêm vào thư viện
                    </button>
                    {gallery.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {gallery.map((item, idx) => (
                          <div key={item.preview} className="relative overflow-hidden rounded-xl border border-[#E8E9F1]">
                            <img src={item.preview} alt={`Hotel media ${idx + 1}`} className="h-28 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGalleryItem(idx)}
                              className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-sm font-semibold text-red-600 shadow"
                            >
                              Xóa
                            </button>
                            <span className="absolute left-2 bottom-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#0B2E68]">
                              sort {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-[#656F81]">Có thể chọn nhiều ảnh, sortOrder sẽ theo thứ tự chọn.</p>
                    )}
                  </div>
                </div>
              </div>

              {submitError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-700">{submitError}</div>}
              {statusMessage && <div className="rounded-xl border border-[#CCE0FF] bg-[#E8EFFC] px-4 py-3 text-base text-[#0B2E68]">{statusMessage}</div>}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0057FF] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#0046CC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Đang xử lý...' : 'Tạo khách sạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
