'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { useAuth } from '@/hooks/useAuth';
import { socialApi, SocialApiError } from '@/lib/api/social';
import { REPORT_REASONS } from '@/lib/community/rules';
import type { ReportGroup } from '@/types/social';

const REASON_LABELS = Object.fromEntries(REPORT_REASONS.map(reason => [reason.value, reason.label]));
const STATUS_LABELS: Record<string, string> = { PUBLISHED: 'Đang hiển thị', HIDDEN: 'Đang ẩn', DELETED: 'Đã xóa' };
const button = 'rounded-lg border border-[#DDDFE3] bg-white px-3 py-1.5 text-sm font-medium text-[#2B3037] hover:bg-[#F1F2F3] disabled:cursor-not-allowed disabled:opacity-50';

export default function CommunityReportsPage() {
  const { user, isLoading } = useAuth();
  const [groups, setGroups] = useState<ReportGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const token = user?.role === 'ADMIN' ? user.token : null;

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      setGroups(await socialApi.admin.openReports(token));
      setLoaded(true);
    } catch (failure) {
      setError(failure instanceof SocialApiError ? failure.message : 'Không tải được danh sách báo cáo.');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function act(group: ReportGroup, run: (token: string) => Promise<void>) {
    if (!token) return;
    setBusy(group.targetId);
    setError('');
    try {
      await run(token);
      await load();
    } catch (failure) {
      setError(failure instanceof SocialApiError ? failure.message : 'Không thực hiện được thao tác.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex">
      <AdminMenu />
      <main className="ml-[280px] flex-1 space-y-4 p-8">
        <h1 className="text-2xl font-bold">Báo cáo nội dung cộng đồng</h1>
        <p className="max-w-3xl text-sm text-[#656F81]">
          Các báo cáo đang mở, gom theo bài viết hoặc bình luận. Ẩn nội dung sẽ gỡ nó khỏi mọi trang công khai và có thể khôi phục.
          Mọi thao tác đều được ghi nhật ký. Danh tính người báo cáo chỉ hiển thị tại đây.
        </p>
        <button type="button" className={button} onClick={() => void load()} disabled={busy !== null}>Tải lại</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {(isLoading || (token && !loaded && !error)) && <p aria-busy="true">Đang tải báo cáo…</p>}
        {loaded && groups.length === 0 && <p>Không có báo cáo nào đang mở.</p>}
        {groups.map(group => {
          const working = busy === group.targetId;
          const hidden = group.targetStatus === 'HIDDEN';
          return (
            <section key={`${group.targetType}:${group.targetId}`} className="space-y-3 rounded-xl border border-[#DDDFE3] bg-white p-4"
              aria-label={`Báo cáo cho ${group.targetType === 'POST' ? 'bài viết' : 'bình luận'}`} data-testid="report-group">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold">{group.targetType === 'POST' ? 'Bài viết' : 'Bình luận'}</span>
                <span>{group.reportCount} báo cáo</span>
                <span>Trạng thái: {group.targetStatus ? STATUS_LABELS[group.targetStatus] : 'Không còn tồn tại'}</span>
                {group.postId && (
                  <a href={`/community/posts/${group.postId}`} target="_blank" rel="noreferrer" className="text-[#0057FF] underline">Mở bài viết</a>
                )}
              </div>
              {group.excerpt && <blockquote className="whitespace-pre-line break-words rounded-lg bg-[#F7F8FA] p-3 text-sm text-[#2B3037]">{group.excerpt}</blockquote>}
              <ul className="space-y-1 text-sm text-[#383E48]">
                {group.reports.map(report => (
                  <li key={report.id}>
                    <span className="font-medium">{REASON_LABELS[report.reason] ?? report.reason}</span>
                    {report.note && <span> — {report.note}</span>}
                    <span className="text-xs text-[#656F81]"> · người báo cáo {report.reporterId} · {new Date(report.createdAt).toLocaleString('vi-VN')}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {group.targetStatus === 'PUBLISHED' && (
                  <button type="button" className={button} disabled={working}
                    onClick={() => act(group, t => socialApi.admin.moderate(t, group.targetType, group.targetId, 'hide'))}>Ẩn nội dung</button>
                )}
                {hidden && (
                  <button type="button" className={button} disabled={working}
                    onClick={() => act(group, t => socialApi.admin.moderate(t, group.targetType, group.targetId, 'restore'))}>Khôi phục nội dung</button>
                )}
                <button type="button" className={button} disabled={working}
                  onClick={() => act(group, t => socialApi.admin.closeReports(t, group.targetType, group.targetId, 'RESOLVED'))}>Đã xử lý báo cáo</button>
                <button type="button" className={button} disabled={working}
                  onClick={() => act(group, t => socialApi.admin.closeReports(t, group.targetType, group.targetId, 'DISMISSED'))}>Bỏ qua báo cáo</button>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
