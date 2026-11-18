'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { socialApi, SocialApiError } from '@/lib/api/social';
import { LIMITS, authorInitial, authorName, relativeTime, validateComment } from '@/lib/community/rules';
import type { SocialComment } from '@/types/social';
import { primaryButton, secondaryButton } from './CommunityShell';
import ReportDialog from './ReportDialog';

const messageOf = (failure: unknown, fallback: string) => failure instanceof SocialApiError ? failure.message : fallback;

export default function CommentSection({ postId, onCountChange }: { postId: string; onCountChange?: (delta: number) => void }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const token = user?.token ?? null;

  const loadPage = useCallback(async (after: string | null) => {
    setLoading(true);
    setLoadError('');
    try {
      const page = await socialApi.comments(postId, { cursor: after, limit: 20 }, token);
      setComments(previous => after ? [...previous, ...page.items.filter(item => !previous.some(existing => existing.id === item.id))] : page.items);
      setCursor(page.nextCursor);
    } catch (failure) {
      setLoadError(messageOf(failure, 'Không thể tải bình luận.'));
    } finally {
      setLoading(false);
    }
  }, [postId, token]);

  useEffect(() => {
    if (!authLoading) void loadPage(null);
  }, [authLoading, loadPage]);

  async function submit() {
    if (!user) {
      router.push('/');
      return;
    }
    const invalid = validateComment(draft);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    setSending(true);
    setFormError('');
    try {
      const created = await socialApi.addComment(user.token, postId, draft.trim());
      setComments(previous => [...previous, created]);
      setDraft('');
      onCountChange?.(1);
    } catch (failure) {
      setFormError(messageOf(failure, 'Không thể gửi bình luận.'));
    } finally {
      setSending(false);
    }
  }

  async function remove(comment: SocialComment) {
    if (!user || !window.confirm('Xóa bình luận này?')) return;
    try {
      await socialApi.deleteComment(user.token, comment.id);
      setComments(previous => previous.filter(item => item.id !== comment.id));
      onCountChange?.(-1);
    } catch (failure) {
      setLoadError(messageOf(failure, 'Không thể xóa bình luận.'));
    }
  }

  return (
    <section id="comments" className="rounded-2xl border border-[#DDDFE3] bg-white p-4 md:p-6" aria-label="Bình luận">
      <h2 className="text-base font-semibold text-[#1F2226]">Bình luận</h2>

      <div className="mt-4">
        <label htmlFor="comment-draft" className="sr-only">Viết bình luận</label>
        <textarea id="comment-draft" value={draft} onChange={event => setDraft(event.target.value)} rows={3} maxLength={LIMITS.commentBody}
          disabled={sending} placeholder={user ? 'Chia sẻ suy nghĩ của bạn…' : 'Đăng nhập để bình luận'}
          className="w-full rounded-xl border border-[#DDDFE3] p-3 text-sm outline-none focus:border-[#0057FF]" />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-[#656F81]">{draft.length}/{LIMITS.commentBody}</span>
          <button type="button" className={primaryButton} onClick={submit} disabled={sending}>
            {sending ? 'Đang gửi…' : user ? 'Gửi bình luận' : 'Đăng nhập để bình luận'}
          </button>
        </div>
        {formError && <p className="mt-2 text-sm text-red-600" role="alert">{formError}</p>}
      </div>

      <ul className="mt-6 space-y-4">
        {comments.map(comment => (
          <li key={comment.id} className="flex gap-3" data-testid="comment">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8EFFC] text-xs font-bold text-[#0B2E68]" aria-hidden>
              {authorInitial(comment.author)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-[#1F2226]">{authorName(comment.author)}</span>
                <time className="ml-2 text-xs text-[#656F81]" dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time>
              </p>
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-[#2B3037]">{comment.body}</p>
              {user && (
                <div className="mt-1 flex gap-3 text-xs font-medium text-[#656F81]">
                  {(user.userId === comment.author.id || user.role === 'ADMIN') && (
                    <button type="button" className="hover:text-red-600" onClick={() => remove(comment)}>Xóa</button>
                  )}
                  {user.userId !== comment.author.id && (
                    <button type="button" className="hover:text-[#0057FF]" onClick={() => setReporting(comment.id)}>Báo cáo</button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!loading && !loadError && comments.length === 0 && <p className="mt-2 text-sm text-[#656F81]">Chưa có bình luận nào. Hãy là người đầu tiên.</p>}
      {loading && <p className="mt-4 text-sm text-[#656F81]" aria-busy="true">Đang tải bình luận…</p>}
      {loadError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {loadError} <button type="button" className="underline" onClick={() => loadPage(null)}>Thử lại</button>
        </p>
      )}
      {cursor && !loading && (
        <div className="mt-4 flex justify-center">
          <button type="button" className={secondaryButton} onClick={() => loadPage(cursor)}>Xem thêm bình luận</button>
        </div>
      )}

      {reporting && user && <ReportDialog token={user.token} targetType="COMMENT" targetId={reporting} onClose={() => setReporting(null)} />}
    </section>
  );
}
