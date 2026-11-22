export interface PlacePhoto {
  id?: string;
  photoUrl: string;
  displayOrder?: number;
}

export interface PlaceReview {
  id?: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  rating: number;
  comment: string;
  relativeTimeDescription?: string;
  publishTime?: string;
}

export interface NearbyPlace {
  id?: string;
  googlePlaceId?: string;
  name: string;
  category: 'ATTRACTION' | 'HISTORICAL' | 'RESTAURANT' | 'CAFE' | 'ENTERTAINMENT' | string;
  address?: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  userRatingsTotal?: number;
  coverImageUrl?: string | null;
  detailUrl?: string | null;
  provinceName?: string | null;
  distanceKm: number;
  estimatedTravelTimeMinutes: number;
  isRoadDistance?: boolean;
  originLatitude?: number | null;
  originLongitude?: number | null;
  photos: PlacePhoto[];
  reviews: PlaceReview[];
}

export type PlaceCategoryFilter = 'ALL' | 'ATTRACTION' | 'RESTAURANT' | 'CAFE' | 'HISTORICAL' | 'ENTERTAINMENT';

/** Public catalog fields returned by place search and batch lookups. */
export interface PlaceSummary {
  id: string;
  name: string;
  category: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  provinceName?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  coverImageUrl?: string | null;
}

export interface PlaceSearchPage {
  items: PlaceSummary[];
  nextCursor: string | null;
}
