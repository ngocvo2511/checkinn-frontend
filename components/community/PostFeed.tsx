'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SocialApiError } from '@/lib/api/social';
import type { SocialPage, SocialPost } from '@/types/social';
import PostCard from './PostCard';
import { StateMessage, secondaryButton } from './CommunityShell';

interface PostFeedProps {
  /** Loads one page; a null cursor is the first page. Must be stable between renders (useCallback). */
  load: (cursor: string | null) => Promise<SocialPage<SocialPost>>;
  emptyTitle: string;
  emptyDetail?: string;
}

export default function PostFeed({ load, emptyTitle, emptyDetail }: PostFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const fetchPage = useCallback(async (after: string | null) => {
    const current = ++requestId.current;
    if (after) setLoadingMore(true); else setLoading(true);
    setError('');
    try {
      const page = await load(after);
      if (current !== requestId.current) return;
      setPosts(previous => after ? [...previous, ...page.items.filter(item => !previous.some(existing => existing.id === item.id))] : page.items);
      setCursor(page.nextCursor);
    } catch (failure) {
      if (current !== requestId.current) return;
      setError(failure instanceof SocialApiError ? failure.message : 'Không thể tải bài viết lúc này.');
    } finally {
      if (current === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [load]);

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    void fetchPage(null);
  }, [fetchPage]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Đang tải bài viết">
        {[0, 1, 2].map(row => <div key={row} className="h-40 animate-pulse rounded-2xl border border-[#DDDFE3] bg-white" />)}
      </div>
    );
  }
  if (error && posts.length === 0) {
    return <StateMessage title="Không tải được bài viết" detail={error}
      action={<button type="button" className={secondaryButton} onClick={() => fetchPage(null)}>Thử lại</button>} />;
  }
  if (posts.length === 0) {
    return <StateMessage title={emptyTitle} detail={emptyDetail} />;
  }
  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} compact
          onChange={updated => setPosts(previous => previous.map(item => item.id === updated.id ? updated : item))} />
      ))}
      {error && <p className="text-center text-sm text-red-600" role="alert">{error}</p>}
      {cursor && (
        <div className="flex justify-center pt-2">
          <button type="button" className={secondaryButton} disabled={loadingMore} onClick={() => fetchPage(cursor)}>
            {loadingMore ? 'Đang tải…' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  );
}
