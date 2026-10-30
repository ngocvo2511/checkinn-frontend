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
  photos: PlacePhoto[];
  reviews: PlaceReview[];
}

export type PlaceCategoryFilter = 'ALL' | 'ATTRACTION' | 'RESTAURANT' | 'CAFE' | 'HISTORICAL' | 'ENTERTAINMENT';
