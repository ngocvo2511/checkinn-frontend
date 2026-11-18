'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PenLine, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/lib/api/social';
import { loginHref } from '@/lib/community/login';
import CommunityShell, { StateMessage, primaryButton, secondaryButton } from '@/components/community/CommunityShell';
import PostFeed from '@/components/community/PostFeed';

function CommunityFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const query = (searchParams.get('q') ?? '').trim();
  const mine = searchParams.get('view') === 'mine';
  const [keyword, setKeyword] = useState(query);
  const token = user?.token ?? null;

  const load = useCallback((cursor: string | null) => {
    if (mine && token) return socialApi.myPosts(token, { cursor, limit: 10 });
    if (query) return socialApi.search(query, { cursor, limit: 10 }, token);
    return socialApi.feed({ cursor, limit: 10 }, token);
  }, [mine, query, token]);

  function submitSearch() {
    const term = keyword.trim();
    router.push(term ? `/community?q=${encodeURIComponent(term)}` : '/community');
  }

  const tab = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-[#0057FF] text-white' : 'bg-white text-[#383E48] hover:bg-[#F1F2F3]'}`;

  return (
    <CommunityShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2226]">Cộng đồng du lịch</h1>
          <p className="mt-1 text-sm text-[#656F81]">Chia sẻ và đánh giá địa điểm từ các thành viên. Đây không phải đánh giá khách sạn đã xác minh qua đặt phòng.</p>
        </div>
        <Link href={user ? '/community/new' : loginHref('/community/new')} className={primaryButton}>
          <PenLine className="h-4 w-4" />
          {user ? 'Viết bài' : 'Đăng nhập để viết bài'}
        </Link>
      </div>

      <form className="mt-5 flex gap-2" role="search" onSubmit={event => { event.preventDefault(); submitSearch(); }}>
        <label htmlFor="community-search" className="sr-only">Tìm bài viết</label>
        <input id="community-search" type="search" value={keyword} onChange={event => setKeyword(event.target.value)} maxLength={100}
          placeholder="Tìm trong bài viết…" className="min-w-0 flex-1 rounded-xl border border-[#DDDFE3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0057FF]" />
        <button type="submit" className={secondaryButton}><Search className="h-4 w-4" />Tìm</button>
      </form>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Bộ lọc bài viết">
        <Link href="/community" className={tab(!mine && !query)}>Mới nhất</Link>
        {user && <Link href="/community?view=mine" className={tab(mine)}>Bài của tôi</Link>}
        {query && <span className={tab(true)}>Kết quả cho “{query}”</span>}
      </nav>

      <div className="mt-5">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl border border-[#DDDFE3] bg-white" aria-busy="true" />
        ) : mine && !user ? (
          <StateMessage title="Bạn cần đăng nhập" detail="Đăng nhập để xem các bài viết của bạn."
            action={<Link href={loginHref('/community?view=mine')} className={primaryButton}>Đăng nhập</Link>} />
        ) : (
          <PostFeed load={load}
            emptyTitle={query ? 'Không có bài viết phù hợp' : mine ? 'Bạn chưa có bài viết nào' : 'Chưa có bài viết nào'}
            emptyDetail={query ? 'Hãy thử từ khóa khác.' : 'Hãy là người đầu tiên chia sẻ trải nghiệm.'} />
        )}
      </div>
    </CommunityShell>
  );
}

export default function CommunityPage() {
  return <Suspense fallback={null}><CommunityFeed /></Suspense>;
}
