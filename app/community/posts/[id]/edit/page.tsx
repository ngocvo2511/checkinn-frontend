'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/lib/api/social';
import type { SocialPost } from '@/types/social';
import CommunityShell, { StateMessage, primaryButton } from '@/components/community/CommunityShell';
import PostComposer from '@/components/community/PostComposer';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const token = user?.token ?? null;
  const userId = user?.userId ?? null;
  const isAdmin = user?.role === 'ADMIN';
  const view = !isLoading && !token ? 'unavailable' : state;

  useEffect(() => {
    if (isLoading || !token) return;
    let current = true;
    // Admins see hidden posts on the detail endpoint. Authors load their own post, hidden or not,
    // from /me/posts/{id}, which works however old the post is.
    (isAdmin ? socialApi.post(id, token) : socialApi.myPost(token, id))
      .then(loaded => {
        if (!current) return;
        if (loaded.author.id !== userId && !isAdmin) {
          setState('unavailable');
          return;
        }
        setPost(loaded);
        setState('ready');
      })
      .catch(() => { if (current) setState('unavailable'); });
    return () => { current = false; };
  }, [id, token, userId, isAdmin, isLoading]);

  return (
    <CommunityShell>
      <h1 className="mb-5 text-2xl font-semibold text-[#1F2226]">Chỉnh sửa bài viết</h1>
      {view === 'loading' && <div className="h-64 animate-pulse rounded-2xl border border-[#DDDFE3] bg-white" aria-busy="true" />}
      {view === 'unavailable' && (
        <StateMessage title="Không thể chỉnh sửa bài viết này" detail="Bài viết không tồn tại hoặc bạn không phải tác giả."
          action={<Link href="/community" className={primaryButton}>Về trang cộng đồng</Link>} />
      )}
      {view === 'ready' && post && token && (
        <>
          {post.status === 'HIDDEN' && (
            <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
              Bài viết đang bị ẩn bởi kiểm duyệt. Bạn vẫn có thể chỉnh sửa, nhưng bài sẽ tiếp tục bị ẩn cho đến khi được khôi phục.
            </p>
          )}
          <PostComposer token={token} initial={post}
            onSaved={saved => router.push(saved.status === 'HIDDEN' ? '/community?view=mine' : `/community/posts/${saved.id}`)}
            onCancel={() => router.back()} />
        </>
      )}
    </CommunityShell>
  );
}
