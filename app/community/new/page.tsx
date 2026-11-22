'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import CommunityShell, { StateMessage, primaryButton } from '@/components/community/CommunityShell';
import { loginHref } from '@/lib/community/login';
import PostComposer from '@/components/community/PostComposer';

function NewPost() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const placeId = searchParams.get('placeId');
  const initialPlace = placeId ? { id: placeId, name: searchParams.get('placeName') || 'Địa điểm đã chọn' } : null;

  return (
    <CommunityShell>
      <h1 className="mb-5 text-2xl font-semibold text-[#1F2226]">Viết bài mới</h1>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-[#DDDFE3] bg-white" aria-busy="true" />
      ) : !user ? (
        <StateMessage title="Bạn cần đăng nhập để viết bài" detail="Ai cũng có thể đọc, nhưng chỉ thành viên đã đăng nhập mới có thể đăng bài."
          action={<Link href={loginHref(`/community/new${searchParams.size ? `?${searchParams.toString()}` : ''}`)} className={primaryButton}>Đăng nhập</Link>} />
      ) : (
        <PostComposer token={user.token} initialPlace={initialPlace} onSaved={post => router.push(`/community/posts/${post.id}`)} onCancel={() => router.push('/community')} />
      )}
    </CommunityShell>
  );
}

export default function NewPostPage() {
  return <Suspense fallback={null}><NewPost /></Suspense>;
}
