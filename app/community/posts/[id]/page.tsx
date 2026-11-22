'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { socialApi, SocialApiError } from '@/lib/api/social';
import type { SocialPost } from '@/types/social';
import CommunityShell, { StateMessage, primaryButton, secondaryButton } from '@/components/community/CommunityShell';
import PostCard from '@/components/community/PostCard';
import CommentSection from '@/components/community/CommentSection';
import ReportDialog from '@/components/community/ReportDialog';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const token = user?.token ?? null;

  useEffect(() => {
    if (authLoading) return;
    let current = true;
    socialApi.post(id, token).then(loaded => {
      if (!current) return;
      setPost(loaded);
      setState('ready');
    }).catch(failure => {
      if (!current) return;
      if (failure instanceof SocialApiError && (failure.code === 'NOT_FOUND' || failure.code === 'VALIDATION')) {
        setState('missing');
      } else {
        setError(failure instanceof SocialApiError ? failure.message : 'Không thể tải bài viết.');
        setState('error');
      }
    });
    return () => { current = false; };
  }, [id, token, authLoading, attempt]);

  async function remove() {
    if (!user || !post || !window.confirm('Xóa bài viết này? Bạn không thể khôi phục sau khi xóa.')) return;
    setDeleting(true);
    try {
      await socialApi.deletePost(user.token, post.id);
      router.push('/community');
    } catch (failure) {
      setError(failure instanceof SocialApiError ? failure.message : 'Không thể xóa bài viết.');
      setDeleting(false);
    }
  }

  const isAuthor = !!user && !!post && user.userId === post.author.id;
  const canManage = isAuthor || user?.role === 'ADMIN';

  return (
    <CommunityShell>
      <Link href="/community" className="text-sm font-medium text-[#0057FF] hover:underline">← Cộng đồng du lịch</Link>
      <div className="mt-4 space-y-4">
        {state === 'loading' && <div className="h-56 animate-pulse rounded-2xl border border-[#DDDFE3] bg-white" aria-busy="true" />}
        {state === 'missing' && (
          <StateMessage title="Không tìm thấy bài viết" detail="Bài viết không tồn tại hoặc không còn hiển thị."
            action={<Link href="/community" className={primaryButton}>Về trang cộng đồng</Link>} />
        )}
        {state === 'error' && (
          <StateMessage title="Không tải được bài viết" detail={error}
            action={<button type="button" className={secondaryButton} onClick={() => { setState('loading'); setAttempt(count => count + 1); }}>Thử lại</button>} />
        )}
        {state === 'ready' && post && (
          <>
            <PostCard post={post} onChange={setPost} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {error && <span className="mr-auto text-sm text-red-600" role="alert">{error}</span>}
              {canManage && <Link href={`/community/posts/${post.id}/edit`} className={secondaryButton}>Chỉnh sửa</Link>}
              {canManage && <button type="button" className={secondaryButton} onClick={remove} disabled={deleting}>{deleting ? 'Đang xóa…' : 'Xóa bài'}</button>}
              {user && !isAuthor && <button type="button" className={secondaryButton} onClick={() => setReporting(true)}>Báo cáo</button>}
            </div>
            <CommentSection postId={post.id}
              onCountChange={delta => setPost(previous => previous ? { ...previous, commentCount: Math.max(0, previous.commentCount + delta) } : previous)} />
          </>
        )}
      </div>
      {reporting && user && post && <ReportDialog token={user.token} targetType="POST" targetId={post.id} onClose={() => setReporting(false)} />}
    </CommunityShell>
  );
}
