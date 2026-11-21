'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronDown, Clock, ExternalLink, EyeOff, FileText, Flag, Loader2,
  MessageSquare, RefreshCw, RotateCcw, ShieldAlert, ShieldCheck, XCircle,
} from 'lucide-react';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { useAuth } from '@/hooks/useAuth';
import { socialApi, SocialApiError } from '@/lib/api/social';
import { REPORT_REASONS } from '@/lib/community/rules';
import type { ContentStatus, ReportGroup, ReportReason } from '@/types/social';

const REASON_LABELS = Object.fromEntries(REPORT_REASONS.map(reason => [reason.value, reason.label]));

const STATUS_STYLES: Record<ContentStatus, { label: string; className: string }> = {
  PUBLISHED: { label: 'Đang hiển thị', className: 'bg-[#E8F7EF] text-[#0F7B4A]' },
  HIDDEN: { label: 'Đang ẩn', className: 'bg-[#FFF4E0] text-[#B25E00]' },
  DELETED: { label: 'Đã xóa', className: 'bg-[#F1F2F3] text-[#656F81]' },
};

type Filter = 'ALL' | 'POST' | 'COMMENT';

const actionBase = 'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const actionStyles = {
  hide: `${actionBase} border border-[#F5C2C0] bg-white text-[#C62828] hover:bg-[#FDECEC]`,
  restore: `${actionBase} border border-[#BFE6D1] bg-white text-[#0F7B4A] hover:bg-[#E8F7EF]`,
  resolve: `${actionBase} bg-[#0066FF] text-white shadow-[0_6px_16px_rgba(0,102,255,0.25)] hover:bg-[#0052CC]`,
  dismiss: `${actionBase} border border-[#E8E9F1] bg-white text-[#383E48] hover:bg-[#F7F8FA]`,
};

function formatTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}…` : value;
}

function StatCard({ label, value, hint, icon, tone }: { label: string; value: number | string; hint: string; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#1F2226]">{value}</p>
          <p className="mt-1 text-sm text-[#656F81]">{hint}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      </div>
    </div>
  );
}

function ReportGroupCard({ group, working, disabled, onAct }: {
  group: ReportGroup;
  working: boolean;
  disabled: boolean;
  onAct: (run: (token: string) => Promise<void>) => void;
}) {
  const isPost = group.targetType === 'POST';
  const status = group.targetStatus ? STATUS_STYLES[group.targetStatus] : null;
  const reasons = (Object.entries(group.reasons ?? {}) as [ReportReason, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition ${working ? 'border-[#B3D1FF]' : 'border-[#E8E9F1]'}`}
      aria-label={`Báo cáo cho ${isPost ? 'bài viết' : 'bình luận'}`}
      data-testid="report-group"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${group.reportCount >= 3 ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} aria-hidden="true" />
      <div className="space-y-4 p-5 pl-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#0B2E68]">
              {isPost ? <FileText className="h-3.5 w-3.5" aria-hidden="true" /> : <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />}
              {isPost ? 'Bài viết' : 'Bình luận'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status?.className ?? 'bg-[#F1F2F3] text-[#656F81]'}`}>
              {status?.label ?? 'Không còn tồn tại'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-3 py-1 text-xs font-semibold text-[#C62828]">
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              {group.reportCount} báo cáo
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#656F81]">
            {group.firstReportedAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Báo cáo đầu tiên {formatTime(group.firstReportedAt)}
              </span>
            )}
            {group.postId && (
              <a href={`/community/posts/${group.postId}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#0066FF] hover:underline">
                Mở bài viết
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {group.excerpt ? (
          <blockquote className="whitespace-pre-line break-words rounded-xl border-l-4 border-[#C7D2E3] bg-[#F7F8FA] px-4 py-3 text-sm leading-relaxed text-[#2B3037]">
            {group.excerpt}
          </blockquote>
        ) : (
          <p className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm italic text-[#8B94A4]">Không có trích đoạn nội dung.</p>
        )}

        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reasons.map(([reason, count]) => (
              <span key={reason} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E9F1] bg-white px-2.5 py-1 text-xs font-medium text-[#383E48]">
                {REASON_LABELS[reason] ?? reason}
                <span className="rounded-md bg-[#F1F2F3] px-1.5 text-[11px] font-semibold text-[#2B3037]">{count}</span>
              </span>
            ))}
          </div>
        )}

        <details className="group rounded-xl border border-[#E8E9F1]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold text-[#2B3037] hover:bg-[#F7F8FA]">
            Chi tiết từng báo cáo
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="divide-y divide-[#F1F2F3] border-t border-[#E8E9F1]">
            {group.reports.map(report => (
              <li key={report.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-[#1F2226]">{REASON_LABELS[report.reason] ?? report.reason}</span>
                  {report.note && <p className="mt-0.5 break-words text-[#656F81]">{report.note}</p>}
                </div>
                <span className="shrink-0 text-xs text-[#8B94A4]" title={report.reporterId}>
                  Người báo cáo {shortId(report.reporterId)} · {formatTime(report.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>

        <div className="flex flex-wrap items-center gap-2 border-t border-[#F1F2F3] pt-4">
          {group.targetStatus === 'PUBLISHED' && (
            <button type="button" className={actionStyles.hide} disabled={disabled}
              onClick={() => onAct(t => socialApi.admin.moderate(t, group.targetType, group.targetId, 'hide'))}>
              <EyeOff className="h-4 w-4" aria-hidden="true" />Ẩn nội dung
            </button>
          )}
          {group.targetStatus === 'HIDDEN' && (
            <button type="button" className={actionStyles.restore} disabled={disabled}
              onClick={() => onAct(t => socialApi.admin.moderate(t, group.targetType, group.targetId, 'restore'))}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />Khôi phục nội dung
            </button>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className={actionStyles.dismiss} disabled={disabled}
              onClick={() => onAct(t => socialApi.admin.closeReports(t, group.targetType, group.targetId, 'DISMISSED'))}>
              <XCircle className="h-4 w-4" aria-hidden="true" />Bỏ qua báo cáo
            </button>
            <button type="button" className={actionStyles.resolve} disabled={disabled}
              onClick={() => onAct(t => socialApi.admin.closeReports(t, group.targetType, group.targetId, 'RESOLVED'))}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              Đã xử lý báo cáo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải báo cáo…">
      {[0, 1].map(index => (
        <div key={index} className="animate-pulse space-y-3 rounded-2xl border border-[#E8E9F1] bg-white p-5">
          <div className="flex gap-2">
            <div className="h-6 w-24 rounded-full bg-[#F1F2F3]" />
            <div className="h-6 w-28 rounded-full bg-[#F1F2F3]" />
          </div>
          <div className="h-16 rounded-xl bg-[#F1F2F3]" />
          <div className="h-9 w-64 rounded-xl bg-[#F1F2F3]" />
        </div>
      ))}
    </div>
  );
}

export default function CommunityReportsPage() {
  const { user, isLoading } = useAuth();
  const [groups, setGroups] = useState<ReportGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
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

  const stats = useMemo(() => ({
    groups: groups.length,
    reports: groups.reduce((sum, group) => sum + group.reportCount, 0),
    posts: groups.filter(group => group.targetType === 'POST').length,
    comments: groups.filter(group => group.targetType === 'COMMENT').length,
    hidden: groups.filter(group => group.targetStatus === 'HIDDEN').length,
  }), [groups]);

  const visible = filter === 'ALL' ? groups : groups.filter(group => group.targetType === filter);
  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: 'ALL', label: 'Tất cả', count: stats.groups },
    { value: 'POST', label: 'Bài viết', count: stats.posts },
    { value: 'COMMENT', label: 'Bình luận', count: stats.comments },
  ];
  const loading = isLoading || (token !== null && !loaded && !error);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />
      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl space-y-5">
          <section className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-5 text-white">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
                Kiểm duyệt cộng đồng
              </div>
              <h1 className="mt-2 text-2xl font-semibold">Báo cáo nội dung cộng đồng</h1>
              <p className="mt-1 text-sm text-white/75">
                Các báo cáo đang mở, gom theo bài viết hoặc bình luận. Ẩn nội dung sẽ gỡ nó khỏi mọi trang công khai và có thể khôi phục.
                Mọi thao tác đều được ghi nhật ký. Danh tính người báo cáo chỉ hiển thị tại đây.
              </p>
            </div>
            {token && (
              <button type="button" onClick={() => void load()} disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20 disabled:opacity-50">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />Tải lại
              </button>
            )}
          </section>

          {!isLoading && !token && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#E8E9F1] bg-white p-6 text-[#383E48]">
              <ShieldAlert className="h-6 w-6 text-[#F59E0B]" aria-hidden="true" />
              Chỉ quản trị viên mới xem được trang này. Hãy đăng nhập bằng tài khoản quản trị.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#F5C2C0] bg-[#FDECEC] px-5 py-4 text-sm text-[#B71C1C]" role="alert">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {token && (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Nhóm đang mở" value={stats.groups} hint="Nội dung cần xem xét"
                icon={<Flag className="h-5 w-5" aria-hidden="true" />} tone="bg-[#FDECEC] text-[#C62828]" />
              <StatCard label="Tổng báo cáo" value={stats.reports} hint="Từ mọi người dùng"
                icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />} tone="bg-[#FFF4E0] text-[#B25E00]" />
              <StatCard label="Bài viết / Bình luận" value={`${stats.posts} / ${stats.comments}`} hint="Phân theo loại nội dung"
                icon={<FileText className="h-5 w-5" aria-hidden="true" />} tone="bg-[#EEF4FF] text-[#0B2E68]" />
              <StatCard label="Đang ẩn" value={stats.hidden} hint="Chờ đóng báo cáo"
                icon={<EyeOff className="h-5 w-5" aria-hidden="true" />} tone="bg-[#F1F2F3] text-[#383E48]" />
            </section>
          )}

          {token && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo loại nội dung">
              {tabs.map(tab => (
                <button key={tab.value} type="button" role="tab" aria-selected={filter === tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === tab.value ? 'bg-[#0B2E68] text-white' : 'border border-[#E8E9F1] bg-white text-[#383E48] hover:bg-[#F7F8FA]'}`}>
                  {tab.label}
                  <span className={`rounded-md px-1.5 text-xs ${filter === tab.value ? 'bg-white/20' : 'bg-[#F1F2F3]'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
          )}

          {loading && <LoadingSkeleton />}

          {loaded && groups.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#D5D9E2] bg-white px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F7EF] text-[#0F7B4A]">
                <ShieldCheck className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-base font-semibold text-[#1F2226]">Không có báo cáo nào đang mở.</p>
              <p className="text-sm text-[#656F81]">Cộng đồng đang sạch sẽ. Báo cáo mới sẽ xuất hiện tại đây.</p>
            </div>
          )}

          {loaded && groups.length > 0 && visible.length === 0 && (
            <p className="rounded-2xl border border-[#E8E9F1] bg-white px-6 py-8 text-center text-sm text-[#656F81]">
              Không có báo cáo nào cho loại nội dung này.
            </p>
          )}

          <div className="space-y-4">
            {visible.map(group => (
              <ReportGroupCard key={`${group.targetType}:${group.targetId}`} group={group}
                working={busy === group.targetId} disabled={busy !== null}
                onAct={run => void act(group, run)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
