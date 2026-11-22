'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Hotel, MapPin, PenLine, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { placesApi } from '@/lib/api/places';
import { socialApi } from '@/lib/api/social';
import { formatRatingAverage } from '@/lib/community/rules';
import { loginHref } from '@/lib/community/login';
import type { NearbyPlace } from '@/types/place';
import type { PlaceRating } from '@/types/social';
import CommunityShell, { StateMessage, primaryButton, secondaryButton } from '@/components/community/CommunityShell';
import PostFeed from '@/components/community/PostFeed';
import { StarsDisplay } from '@/components/community/Stars';

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [place, setPlace] = useState<NearbyPlace | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [rating, setRating] = useState<PlaceRating | null>(null);
  const token = user?.token ?? null;

  useEffect(() => {
    let current = true;
    placesApi.getPlaceById(id).then(loaded => {
      if (!current) return;
      setPlace(loaded);
      setState(loaded ? 'ready' : 'missing');
    });
    // The community rating is supplementary: the page still renders when it cannot be loaded.
    socialApi.placeRating(id).then(loaded => { if (current) setRating(loaded); }).catch(() => { if (current) setRating(null); });
    return () => { current = false; };
  }, [id]);

  const loadPosts = useCallback((cursor: string | null) => socialApi.feed({ placeId: id, cursor, limit: 10 }, token), [id, token]);

  if (state === 'loading') {
    return <CommunityShell><div className="h-72 animate-pulse rounded-2xl border border-[#DDDFE3] bg-white" aria-busy="true" /></CommunityShell>;
  }
  if (state === 'missing' || !place) {
    return (
      <CommunityShell>
        <StateMessage title="Không tìm thấy địa điểm" detail="Địa điểm không tồn tại hoặc tạm thời không tải được."
          action={<Link href="/community" className={primaryButton}>Về trang cộng đồng</Link>} />
      </CommunityShell>
    );
  }

  const communityAverage = formatRatingAverage(rating?.average ?? null);
  const cover = place.coverImageUrl || place.photos?.[0]?.photoUrl;
  const composePath = `/community/new?placeId=${encodeURIComponent(id)}&placeName=${encodeURIComponent(place.name)}`;
  const composeHref = user ? composePath : loginHref(composePath);

  return (
    <CommunityShell>
      <section className="overflow-hidden rounded-2xl border border-[#DDDFE3] bg-white">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- catalog images come from external providers
          <img src={cover} alt={place.name} className="h-56 w-full object-cover md:h-72" />
        )}
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-semibold text-[#1F2226]">{place.name}</h1>
          {(place.address || place.provinceName) && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-[#656F81]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {[place.address, place.provinceName].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {place.provinceName && (
              <Link href={`/search?cityName=${encodeURIComponent(place.provinceName)}`} className={primaryButton} data-testid="nearby-hotels">
                <Hotel className="h-4 w-4" />
                Tìm khách sạn tại {place.provinceName}
              </Link>
            )}
            <Link href={composeHref} className={secondaryButton}>
              <PenLine className="h-4 w-4" />
              {user ? 'Viết đánh giá' : 'Đăng nhập để đánh giá'}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Điểm đánh giá theo nguồn">
        <div className="rounded-2xl border border-[#DDDFE3] bg-white p-4" data-testid="community-rating">
          <h2 className="text-sm font-semibold text-[#1F2226]">Đánh giá của cộng đồng Checkinn</h2>
          {communityAverage && rating ? (
            <p className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-semibold text-[#1F2226]">{communityAverage}</span>
              <StarsDisplay value={rating.average ?? 0} />
              <span className="text-sm text-[#656F81]">({rating.count} lượt)</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#656F81]">Chưa có đánh giá từ cộng đồng.</p>
          )}
          <p className="mt-2 text-xs text-[#656F81]">Do thành viên chia sẻ, chưa được xác minh.</p>
        </div>
        <div className="rounded-2xl border border-[#DDDFE3] bg-white p-4" data-testid="provider-rating">
          <h2 className="text-sm font-semibold text-[#1F2226]">Đánh giá từ nguồn bên ngoài</h2>
          {place.rating ? (
            <p className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-semibold text-[#1F2226]">{place.rating.toFixed(1)}</span>
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              {place.userRatingsTotal ? <span className="text-sm text-[#656F81]">({place.userRatingsTotal.toLocaleString('vi-VN')} lượt)</span> : null}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#656F81]">Chưa có dữ liệu.</p>
          )}
          <p className="mt-2 text-xs text-[#656F81]">Tổng hợp từ nhà cung cấp dữ liệu địa điểm.</p>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="community-posts-title">
        <h2 id="community-posts-title" className="mb-4 text-lg font-semibold text-[#1F2226]">Bài viết của cộng đồng</h2>
        <PostFeed load={loadPosts} emptyTitle="Chưa có bài viết về địa điểm này" emptyDetail="Hãy là người đầu tiên chia sẻ trải nghiệm." />
      </section>

      {place.reviews?.length > 0 && (
        <section className="mt-8" aria-labelledby="provider-reviews-title">
          <h2 id="provider-reviews-title" className="text-lg font-semibold text-[#1F2226]">Nhận xét từ nguồn bên ngoài</h2>
          <p className="mb-4 mt-1 text-xs text-[#656F81]">Các nhận xét này do nhà cung cấp dữ liệu địa điểm tổng hợp, không phải từ thành viên Checkinn.</p>
          <ul className="space-y-3">
            {place.reviews.map((review, index) => (
              <li key={review.id ?? index} className="rounded-2xl border border-[#DDDFE3] bg-white p-4" data-testid="provider-review">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-[#1F2226]">{review.authorName}</span>
                  <StarsDisplay value={review.rating} size={14} />
                  {review.relativeTimeDescription && <span className="text-xs text-[#656F81]">{review.relativeTimeDescription}</span>}
                </p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-[#2B3037]">{review.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </CommunityShell>
  );
}
