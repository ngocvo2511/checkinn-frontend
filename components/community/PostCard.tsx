'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { socialApi, SocialApiError } from '@/lib/api/social';
import { authorInitial, authorName, isPlaceReview, relativeTime } from '@/lib/community/rules';
import type { SocialPost } from '@/types/social';
import { StarsDisplay } from './Stars';

const STATUS_LABELS: Record<string, string> = {
  HIDDEN: 'Đang bị ẩn bởi kiểm duyệt',
  DELETED: 'Đã xóa',
};

export function CommunityBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#E8EFFC] px-2 py-0.5 text-xs font-medium text-[#0B2E68]"
      title="Nội dung do thành viên chia sẻ, chưa được xác minh qua đặt phòng">
      Cộng đồng · Chưa xác minh
    </span>
  );
}

interface PostCardProps {
  post: SocialPost;
  /** Feed cards clamp the text and link to the detail page. */
  compact?: boolean;
  onChange?: (post: SocialPost) => void;
}

export default function PostCard({ post, compact = false, onChange }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState('');
  const detailHref = `/community/posts/${post.id}`;
  const review = isPlaceReview(post);

  async function toggleLike() {
    if (!user) {
      router.push('/');
      return;
    }
    setLiking(true);
    setLikeError('');
    try {
      const state = post.likedByMe ? await socialApi.unlike(user.token, post.id) : await socialApi.like(user.token, post.id);
      onChange?.({ ...post, ...state });
    } catch (error) {
      setLikeError(error instanceof SocialApiError ? error.message : 'Không thể cập nhật lượt thích.');
    } finally {
      setLiking(false);
    }
  }

  return (
    <article className="rounded-2xl border border-[#DDDFE3] bg-white p-4 md:p-6" data-testid="post-card">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0057FF] text-sm font-bold text-white" aria-hidden>
          {authorInitial(post.author)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-[#1F2226]">{authorName(post.author)}</span>
            <CommunityBadge />
          </div>
          <p className="mt-0.5 text-xs text-[#656F81]">
            <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
            {post.updatedAt !== post.createdAt && ' · Đã chỉnh sửa'}
          </p>
        </div>
      </header>

      {post.status && post.status !== 'PUBLISHED' && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800" role="status">
          {STATUS_LABELS[post.status] ?? post.status}
        </p>
      )}

      {(post.place || review) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {post.place && (
            <Link href={`/places/${post.place.id}`} className="inline-flex items-center gap-1 font-medium text-[#0057FF] hover:underline">
              <MapPin className="h-4 w-4" />
              {post.place.name}
              {post.place.provinceName && <span className="font-normal text-[#656F81]">· {post.place.provinceName}</span>}
            </Link>
          )}
          {review && post.rating !== null && (
            <span className="inline-flex items-center gap-1.5 text-[#383E48]">
              <StarsDisplay value={post.rating} />
              <span className="text-xs text-[#656F81]">Đánh giá của cộng đồng</span>
            </span>
          )}
        </div>
      )}

      {compact ? (
        <Link href={detailHref} className="mt-3 block">
          <p className="line-clamp-5 whitespace-pre-line break-words text-sm leading-6 text-[#2B3037]">{post.body}</p>
        </Link>
      ) : (
        <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-[#2B3037]">{post.body}</p>
      )}

      {post.media.length > 0 && (
        <div className={`mt-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
          {post.media.map(media => (
            // eslint-disable-next-line @next/next/no-img-element -- photos come from external storage with no fixed dimensions
            <img key={media.id} src={media.url} alt="Ảnh do thành viên chia sẻ" loading="lazy"
              className={`w-full rounded-xl bg-[#F1F2F3] object-cover ${post.media.length === 1 ? 'max-h-[420px]' : 'aspect-square'}`} />
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-4 border-t border-[#F1F2F3] pt-3 text-sm text-[#656F81]">
        <button type="button" onClick={toggleLike} disabled={liking} aria-pressed={post.likedByMe === true}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-[#F1F2F3] disabled:opacity-50">
          <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span data-testid="like-count">{post.likeCount}</span>
          <span className="sr-only">lượt thích</span>
        </button>
        <Link href={`${detailHref}#comments`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-[#F1F2F3]">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentCount}</span>
          <span className="sr-only">bình luận</span>
        </Link>
        {likeError && <span className="text-xs text-red-600" role="alert">{likeError}</span>}
      </footer>
    </article>
  );
}
