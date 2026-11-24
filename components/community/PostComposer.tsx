'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { socialApi, SocialApiError } from '@/lib/api/social';
import { bookingApi } from '@/lib/api/booking';
import { LIMITS, stayOptions, validatePhoto, validatePost, type FieldErrors, type StayOption } from '@/lib/community/rules';
import type { PostInput, SocialPost } from '@/types/social';
import PlacePicker, { type PickedPlace } from './PlacePicker';
import HotelPicker, { type PickedHotel } from './HotelPicker';
import { StarsInput } from './Stars';
import { primaryButton, secondaryButton } from './CommunityShell';

interface Photo {
  key: string;
  /** Set once the upload finished; only uploaded photos are attached. */
  id?: string;
  url: string;
  state: 'uploading' | 'ready' | 'failed';
  error?: string;
}

interface PostComposerProps {
  token: string;
  /** Present when editing; the form starts from this post and saves over it. */
  initial?: SocialPost;
  /** Preselects a place for a new post, for example when composing from a place page. */
  initialPlace?: PickedPlace | null;
  /** Preselects a hotel and, from a stay invitation, the stay to link. */
  initialHotel?: PickedHotel | null;
  initialStayBookingId?: string | null;
  /** Needed to list the signed-in user's own completed stays. */
  userId?: string | null;
  onSaved: (post: SocialPost) => void;
  onCancel: () => void;
}

export default function PostComposer({
  token, initial, initialPlace = null, initialHotel = null, initialStayBookingId = null, userId = null, onSaved, onCancel,
}: PostComposerProps) {
  const [body, setBody] = useState(initial?.body ?? '');
  const [place, setPlace] = useState<PickedPlace | null>(
    initial?.placeId ? { id: initial.placeId, name: initial.place?.name ?? 'Địa điểm đã chọn', provinceName: initial.place?.provinceName } : initialPlace);
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [hotel, setHotel] = useState<PickedHotel | null>(
    initial?.hotelId ? { id: initial.hotelId, name: initial.hotel?.name ?? 'Khách sạn đã chọn', cityName: initial.hotel?.cityName } : initialHotel);
  const [stayBookingId, setStayBookingId] = useState<string | null>(initial ? initial.stayBookingId ?? null : initialStayBookingId);
  const [stays, setStays] = useState<StayOption[]>([]);
  const [staysState, setStaysState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [stayUnavailable, setStayUnavailable] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(
    (initial?.media ?? []).map(media => ({ key: media.id, id: media.id, url: media.url, state: 'ready' as const })));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const hotelId = hotel?.id ?? null;
  useEffect(() => {
    if (!hotelId || !userId) return;
    let current = true;
    setStaysState('loading');
    bookingApi.getUserBookings(userId)
      .then(bookings => {
        if (!current) return;
        setStays(stayOptions(bookings, hotelId));
        setStaysState('done');
      })
      .catch(() => { if (current) setStaysState('error'); });
    return () => { current = false; };
  }, [hotelId, userId]);

  const uploading = photos.some(photo => photo.state === 'uploading');
  const remainingSlots = LIMITS.photosPerPost - photos.length;

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files).slice(0, Math.max(0, remainingSlots));
    for (const file of accepted) {
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const preview = URL.createObjectURL(file);
      const invalid = validatePhoto(file);
      if (invalid) {
        setPhotos(previous => [...previous, { key, url: preview, state: 'failed', error: invalid }]);
        continue;
      }
      setPhotos(previous => [...previous, { key, url: preview, state: 'uploading' }]);
      try {
        const uploaded = await socialApi.uploadPhoto(token, file, file.name);
        setPhotos(previous => previous.map(photo => photo.key === key ? { ...photo, id: uploaded.id, state: 'ready' } : photo));
      } catch (failure) {
        const message = failure instanceof SocialApiError ? failure.message : 'Tải ảnh thất bại.';
        setPhotos(previous => previous.map(photo => photo.key === key ? { ...photo, state: 'failed', error: message } : photo));
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  function changePlace(next: PickedPlace | null) {
    setPlace(next);
    if (!next) setRating(null);
  }

  function changeHotel(next: PickedHotel | null) {
    setHotel(next);
    setStayBookingId(null);
    setStays([]);
    setStaysState('idle');
    if (next) setRating(null);
  }

  async function save(withoutStay = false) {
    const input: PostInput = {
      body: body.trim(),
      placeId: place?.id ?? null,
      rating: hotel ? null : rating,
      mediaIds: photos.filter(photo => photo.state === 'ready' && photo.id).map(photo => photo.id as string),
      hotelId: hotel?.id ?? null,
      stayBookingId: withoutStay || !hotel ? null : stayBookingId,
    };
    if (withoutStay) setStayBookingId(null);
    setStayUnavailable(false);
    const invalid = validatePost(input);
    setErrors(invalid);
    setFormError('');
    if (Object.keys(invalid).length > 0) return;
    setSaving(true);
    try {
      onSaved(initial ? await socialApi.updatePost(token, initial.id, input) : await socialApi.createPost(token, input));
    } catch (failure) {
      if (failure instanceof SocialApiError && failure.serverCode === 'STAY_ALREADY_SHARED') {
        setErrors({ stayBookingId: failure.message });
      } else if (failure instanceof SocialApiError && failure.serverCode === 'BOOKING_SERVICE_UNAVAILABLE') {
        setStayUnavailable(true);
        setFormError(failure.message);
      } else if (failure instanceof SocialApiError) {
        setErrors(failure.fields);
        setFormError(Object.keys(failure.fields).length > 0 ? '' : failure.message);
      } else {
        setFormError('Không thể lưu bài viết.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6 rounded-2xl border border-[#DDDFE3] bg-white p-4 md:p-6" onSubmit={event => { event.preventDefault(); void save(); }} noValidate>
      <div>
        <label htmlFor="post-body" className="text-sm font-semibold text-[#1F2226]">Nội dung</label>
        <textarea id="post-body" value={body} onChange={event => setBody(event.target.value)} rows={7} maxLength={LIMITS.postBody} disabled={saving}
          placeholder="Kể về chuyến đi, địa điểm hoặc mẹo du lịch của bạn…" aria-invalid={!!errors.body} aria-describedby="post-body-help"
          className="mt-2 w-full rounded-xl border border-[#DDDFE3] p-3 text-sm leading-6 outline-none focus:border-[#0057FF]" />
        <div id="post-body-help" className="mt-1 flex justify-between gap-3 text-xs">
          <span className="text-red-600" role={errors.body ? 'alert' : undefined}>{errors.body}</span>
          <span className="text-[#656F81]">{body.length}/{LIMITS.postBody}</span>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1F2226]">Địa điểm <span className="font-normal text-[#656F81]">(không bắt buộc)</span></p>
        <div className="mt-2"><PlacePicker value={place} onChange={changePlace} disabled={saving} /></div>
        {errors.placeId && <p className="mt-1 text-xs text-red-600" role="alert">{errors.placeId}</p>}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1F2226]">Khách sạn <span className="font-normal text-[#656F81]">(không bắt buộc)</span></p>
        <div className="mt-2"><HotelPicker value={hotel} onChange={changeHotel} disabled={saving} /></div>
        {errors.hotelId && <p className="mt-1 text-xs text-red-600" role="alert">{errors.hotelId}</p>}
        {hotel && (
          <div className="mt-3">
            <label htmlFor="post-stay" className="text-sm font-medium text-[#1F2226]">Gắn kỳ lưu trú của tôi</label>
            <select id="post-stay" value={stayBookingId ?? ''} disabled={saving || staysState === 'loading'}
              onChange={event => setStayBookingId(event.target.value || null)}
              className="mt-2 w-full rounded-xl border border-[#DDDFE3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0057FF]">
              <option value="">Không gắn kỳ lưu trú</option>
              {stayBookingId && !stays.some(stay => stay.bookingId === stayBookingId) && (
                <option value={stayBookingId}>Kỳ lưu trú đã chọn</option>
              )}
              {stays.map(stay => <option key={stay.bookingId} value={stay.bookingId}>{stay.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-[#656F81]">
              {staysState === 'loading' ? 'Đang tải các kỳ lưu trú đã hoàn tất…'
                : staysState === 'error' ? 'Không tải được kỳ lưu trú. Bạn vẫn có thể đăng bài không gắn kỳ lưu trú.'
                  : 'Bài viết gắn kỳ lưu trú đã hoàn tất qua Checkinn sẽ có nhãn “Đã ở qua Checkinn”. Mã đặt phòng không hiển thị công khai.'}
            </p>
            {errors.stayBookingId && <p className="mt-1 text-xs text-red-600" role="alert">{errors.stayBookingId}</p>}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1F2226]">Chấm điểm địa điểm <span className="font-normal text-[#656F81]">(không bắt buộc)</span></p>
        {hotel ? (
          <p className="mt-2 text-xs text-[#656F81]" data-testid="rating-hidden-for-hotel">
            Bài viết gắn khách sạn không có điểm. Điểm khách sạn chỉ đến từ đánh giá đã xác minh qua đặt phòng.
          </p>
        ) : (
          <>
            <div className="mt-2"><StarsInput value={rating} onChange={setRating} disabled={saving || !place} /></div>
            <p className="mt-1 text-xs text-[#656F81]">
              {place ? 'Điểm của bạn hiển thị là đánh giá cộng đồng, không phải đánh giá đã xác minh qua đặt phòng.' : 'Chọn địa điểm để chấm điểm.'}
            </p>
          </>
        )}
        {errors.rating && <p className="mt-1 text-xs text-red-600" role="alert">{errors.rating}</p>}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1F2226]">Ảnh <span className="font-normal text-[#656F81]">(tối đa {LIMITS.photosPerPost}, JPEG/PNG/WebP, mỗi ảnh ≤ 5 MB)</span></p>
        <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-5">
          {photos.map(photo => (
            <div key={photo.key} className="relative aspect-square overflow-hidden rounded-xl border border-[#DDDFE3] bg-[#F1F2F3]">
              {/* eslint-disable-next-line @next/next/no-img-element -- local previews and external storage URLs */}
              <img src={photo.url} alt="Ảnh xem trước" className={`h-full w-full object-cover ${photo.state !== 'ready' ? 'opacity-40' : ''}`} />
              {photo.state === 'uploading' && <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[#1F2226]" role="status">Đang tải…</span>}
              {photo.state === 'failed' && <span className="absolute inset-x-1 bottom-1 rounded bg-red-600 px-1 py-0.5 text-[10px] leading-tight text-white" role="alert">{photo.error}</span>}
              <button type="button" aria-label="Bỏ ảnh" disabled={saving || photo.state === 'uploading'}
                onClick={() => setPhotos(previous => previous.filter(item => item.key !== photo.key))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white disabled:opacity-40">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {remainingSlots > 0 && (
            <button type="button" onClick={() => fileInput.current?.click()} disabled={saving}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#B5BAC2] text-xs font-medium text-[#656F81] hover:border-[#0057FF] hover:text-[#0057FF]">
              <ImagePlus className="h-5 w-5" />
              Thêm ảnh
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept={LIMITS.photoTypes.join(',')} multiple hidden data-testid="photo-input"
          onChange={event => void addFiles(event.target.files)} />
        {errors.mediaIds && <p className="mt-1 text-xs text-red-600" role="alert">{errors.mediaIds}</p>}
      </div>

      {formError && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          <p>{formError}</p>
          {stayUnavailable && (
            <button type="button" className="mt-2 font-semibold underline" disabled={saving} onClick={() => void save(true)}>
              Đăng không gắn kỳ lưu trú
            </button>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className={secondaryButton} onClick={onCancel} disabled={saving}>Hủy</button>
        <button type="submit" className={primaryButton} disabled={saving || uploading}>
          {saving ? 'Đang lưu…' : uploading ? 'Đang tải ảnh…' : initial ? 'Lưu thay đổi' : 'Đăng bài'}
        </button>
      </div>
    </form>
  );
}
