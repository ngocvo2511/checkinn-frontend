'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/lib/api/social';
import { COMMUNITY_ENABLED } from '@/lib/community/flag';
import { loginHref } from '@/lib/community/login';
import PostFeed from './PostFeed';
import { secondaryButton } from './CommunityShell';

interface HotelCommunitySectionProps {
  hotelId: string;
  hotelName: string;
}

/** Community posts that tag this hotel. Kept apart from, and never mixed into, the verified hotel reviews. */
export default function HotelCommunitySection({ hotelId, hotelName }: HotelCommunitySectionProps) {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const load = useCallback(
    (cursor: string | null) => socialApi.feed({ hotelId, cursor, limit: 5 }, token),
    [hotelId, token]);

  if (!COMMUNITY_ENABLED || !hotelId) return null;

  const compose = `/community/new?${new URLSearchParams({ hotelId, hotelName }).toString()}`;
  return (
    <section id="community" className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 pt-10 pb-10" data-testid="hotel-community">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#1F2226]">Từ cộng đồng</h2>
          <p className="mt-1 text-sm text-[#656F81]">
            Chia sẻ của thành viên, không phải đánh giá khách sạn và không tính vào điểm khách sạn.
          </p>
        </div>
        <Link href={user ? compose : loginHref(compose)} className={secondaryButton}>
          <PenLine className="h-4 w-4" />
          Viết bài về khách sạn này
        </Link>
      </div>
      <div className="mt-5 max-w-3xl">
        <PostFeed load={load} emptyTitle="Chưa có bài viết nào về khách sạn này"
          emptyDetail="Sau kỳ lưu trú, bạn có thể chia sẻ trải nghiệm của mình tại đây." />
      </div>
    </section>
  );
}
