export function amenityTitles(categories?: { items?: { title?: string }[] }[] | null): string[] {
  return [...new Set((categories ?? []).flatMap(category => (category.items ?? [])
    .map(item => item.title?.trim()).filter((title): title is string => !!title)))];
}

/** Literal hotel-level label matching: AND, case-sensitive, no inferred room/alias mapping. */
export function matchesHotelAmenities(actual: string[], selected: string[]): boolean {
  return selected.every(label => actual.includes(label));
}

export function guestReviewFacts(stats: { averageRating?: number; totalReviews?: number } | null | undefined): {
  rating: number | null; reviewCount: number | null;
} {
  const count = stats?.totalReviews;
  if (count == null || !Number.isInteger(count) || count < 0) return { rating: null, reviewCount: null };
  if (count === 0) return { rating: null, reviewCount: 0 };
  const rating = stats?.averageRating;
  return { rating: typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 10 ? rating : null, reviewCount: count };
}
