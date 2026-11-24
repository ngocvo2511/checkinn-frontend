import type { PostInput, ReportReason, SocialAuthor } from '../../types/social.ts';

export const LIMITS = {
  postBody: 5000,
  commentBody: 1000,
  reportNote: 500,
  photosPerPost: 5,
  photoBytes: 5 * 1024 * 1024,
  photoTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam hoặc quảng cáo' },
  { value: 'HARASSMENT', label: 'Quấy rối hoặc xúc phạm' },
  { value: 'INAPPROPRIATE_MEDIA', label: 'Hình ảnh không phù hợp' },
  { value: 'MISLEADING', label: 'Thông tin sai lệch' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export type FieldErrors = Partial<Record<'body' | 'rating' | 'placeId' | 'hotelId' | 'stayBookingId' | 'mediaIds' | 'note', string>>;

/** Mirrors the server rules so obvious mistakes are caught before a request; the server still decides. */
export function validatePost(input: PostInput): FieldErrors {
  const errors: FieldErrors = {};
  const length = input.body.trim().length;
  if (length === 0) errors.body = 'Hãy viết nội dung bài đăng.';
  else if (length > LIMITS.postBody) errors.body = `Nội dung tối đa ${LIMITS.postBody} ký tự.`;
  if (input.rating !== null && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    errors.rating = 'Điểm đánh giá phải từ 1 đến 5.';
  } else if (input.rating !== null && !input.placeId) {
    errors.rating = 'Hãy chọn địa điểm trước khi chấm điểm.';
  } else if (input.rating !== null && input.hotelId) {
    errors.rating = 'Bài viết gắn khách sạn không thể chấm điểm. Hãy dùng chức năng đánh giá khách sạn sau kỳ lưu trú.';
  }
  if (input.stayBookingId && !input.hotelId) errors.stayBookingId = 'Hãy chọn khách sạn của kỳ lưu trú.';
  if (input.mediaIds.length > LIMITS.photosPerPost) errors.mediaIds = `Tối đa ${LIMITS.photosPerPost} ảnh cho mỗi bài.`;
  return errors;
}

export interface StayOption {
  bookingId: string;
  label: string;
}

/** Only completed stays at the chosen hotel can be linked; the server verifies the choice again. */
export function stayOptions(
  bookings: { id: string; hotelId: string; status: string; checkInDate: string; checkOutDate: string }[],
  hotelId: string | null,
): StayOption[] {
  if (!hotelId) return [];
  return bookings
    .filter(booking => booking.status === 'CHECKED_OUT' && booking.hotelId === hotelId)
    .sort((a, b) => b.checkOutDate.localeCompare(a.checkOutDate))
    .map(booking => ({ bookingId: booking.id, label: `${formatDay(booking.checkInDate)} – ${formatDay(booking.checkOutDate)}` }));
}

function formatDay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

/** `2026-11` → `11/2026`. */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return year && month ? `${month}/${year}` : yearMonth;
}

/** Composer link that tags the hotel and links the stay of an invitation. */
export function shareStayHref(invitation: { id: string; hotel: { id: string; name: string } | null }): string | null {
  if (!invitation.hotel) return null;
  const params = new URLSearchParams({ hotelId: invitation.hotel.id, hotelName: invitation.hotel.name, stay: invitation.id });
  return `/community/new?${params.toString()}`;
}

export function validateComment(body: string): string | null {
  const length = body.trim().length;
  if (length === 0) return 'Hãy viết bình luận.';
  if (length > LIMITS.commentBody) return `Bình luận tối đa ${LIMITS.commentBody} ký tự.`;
  return null;
}

export function validateReport(reason: ReportReason | null, note: string): string | null {
  if (!reason) return 'Hãy chọn lý do báo cáo.';
  if (reason === 'OTHER' && note.trim().length === 0) return 'Hãy mô tả lý do báo cáo.';
  if (note.trim().length > LIMITS.reportNote) return `Ghi chú tối đa ${LIMITS.reportNote} ký tự.`;
  return null;
}

export function validatePhoto(file: { type: string; size: number }): string | null {
  if (!(LIMITS.photoTypes as readonly string[]).includes(file.type)) return 'Chỉ nhận ảnh JPEG, PNG hoặc WebP.';
  if (file.size > LIMITS.photoBytes) return 'Ảnh vượt quá 5 MB.';
  if (file.size === 0) return 'Tệp ảnh trống.';
  return null;
}

export function authorName(author: SocialAuthor): string {
  return author.displayName?.trim() || 'Thành viên Checkinn';
}

export function authorInitial(author: SocialAuthor): string {
  const name = author.displayName?.trim();
  return name ? Array.from(name)[0].toUpperCase() : 'C';
}

/** A post is a community place review only when it has both a place and a rating. */
export function isPlaceReview(post: { placeId: string | null; rating: number | null }): boolean {
  return post.placeId !== null && post.rating !== null;
}

export function formatRatingAverage(average: number | null): string | null {
  return average === null || !Number.isFinite(average) ? null : average.toFixed(1);
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return then.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
