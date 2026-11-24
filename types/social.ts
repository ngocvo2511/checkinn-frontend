export type ContentStatus = 'PUBLISHED' | 'HIDDEN' | 'DELETED';
export type ReportTargetType = 'POST' | 'COMMENT';
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_MEDIA' | 'MISLEADING' | 'OTHER';

export interface SocialAuthor {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface SocialPlaceRef {
  id: string;
  name: string;
  category: string;
  provinceName: string | null;
}

/** Public display data of a published hotel; null when the hotel is no longer published. */
export interface SocialHotelRef {
  id: string;
  name: string;
  cityName: string | null;
  provinceName: string | null;
  starRating: number | null;
  coverImageUrl: string | null;
}

export interface SocialMedia {
  id: string;
  url: string;
  order: number;
}

/**
 * `source` is always COMMUNITY and `verified` always false: never a booking-verified hotel review.
 * `verifiedStay` only says the author completed a stay booked through Checkinn. `stayBookingId` is
 * present only in the author's own views.
 */
export interface SocialPost {
  id: string;
  author: SocialAuthor;
  body: string;
  rating: number | null;
  source: 'COMMUNITY';
  verified: false;
  placeId: string | null;
  place: SocialPlaceRef | null;
  hotelId: string | null;
  hotel: SocialHotelRef | null;
  verifiedStay: boolean;
  stayBookingId?: string | null;
  media: SocialMedia[];
  likeCount: number;
  likedByMe: boolean | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  status?: ContentStatus;
}

export interface SocialComment {
  id: string;
  postId: string;
  author: SocialAuthor;
  body: string;
  createdAt: string;
}

export interface SocialPage<T> {
  items: T[];
  nextCursor: string | null;
}

/** PUT replaces every field, so edits must send the hotel and stay link again to keep them. */
export interface PostInput {
  body: string;
  placeId: string | null;
  rating: number | null;
  mediaIds: string[];
  hotelId: string | null;
  stayBookingId: string | null;
}

/** `id` is the owner's own booking id. */
export interface StayInvitation {
  id: string;
  hotel: SocialHotelRef | null;
  checkOutMonth: string;
  createdAt: string;
  expiresAt: string;
}

export interface LikeState {
  likeCount: number;
  likedByMe: boolean;
}

export interface PlaceRating {
  placeId: string;
  count: number;
  average: number | null;
}

export interface UploadedMedia {
  id: string;
  url: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reason: ReportReason;
  note: string | null;
  createdAt: string;
}

export interface ReportGroup {
  targetType: ReportTargetType;
  targetId: string;
  postId: string | null;
  targetAuthorId: string | null;
  targetStatus: ContentStatus | null;
  excerpt: string | null;
  reportCount: number;
  reasons: Partial<Record<ReportReason, number>>;
  firstReportedAt: string;
  reports: ReportItem[];
}
