'use client';

import { useState } from 'react';
import { socialApi, SocialApiError } from '@/lib/api/social';
import { LIMITS, REPORT_REASONS, validateReport } from '@/lib/community/rules';
import type { ReportReason, ReportTargetType } from '@/types/social';
import { primaryButton, secondaryButton } from './CommunityShell';

interface ReportDialogProps {
  token: string;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}

export default function ReportDialog({ token, targetType, targetId, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const invalid = validateReport(reason, note);
    if (invalid || !reason) {
      setError(invalid ?? '');
      return;
    }
    setSending(true);
    setError('');
    try {
      await socialApi.report(token, targetType, targetId, reason, note);
      setSent(true);
    } catch (failure) {
      setError(failure instanceof SocialApiError ? failure.message : 'Không thể gửi báo cáo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10001] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 md:rounded-2xl">
        <h2 id="report-title" className="text-lg font-semibold text-[#1F2226]">
          {targetType === 'POST' ? 'Báo cáo bài viết' : 'Báo cáo bình luận'}
        </h2>
        {sent ? (
          <>
            <p className="mt-3 text-sm text-[#383E48]" role="status">
              Cảm ơn bạn. Đội kiểm duyệt sẽ xem xét báo cáo này. Danh tính của bạn không được hiển thị công khai.
            </p>
            <div className="mt-5 flex justify-end">
              <button type="button" className={primaryButton} onClick={onClose}>Đóng</button>
            </div>
          </>
        ) : (
          <>
            <fieldset className="mt-4 space-y-2" disabled={sending}>
              <legend className="sr-only">Lý do báo cáo</legend>
              {REPORT_REASONS.map(option => (
                <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#DDDFE3] px-3 py-2 text-sm has-[:checked]:border-[#0057FF] has-[:checked]:bg-[#E8EFFC]">
                  <input type="radio" name="report-reason" value={option.value} checked={reason === option.value} onChange={() => setReason(option.value)} />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <label className="mt-4 block text-sm font-medium text-[#383E48]">
              Ghi chú {reason === 'OTHER' ? '(bắt buộc)' : '(không bắt buộc)'}
              <textarea value={note} onChange={event => setNote(event.target.value)} maxLength={LIMITS.reportNote} rows={3} disabled={sending}
                className="mt-1 w-full rounded-xl border border-[#DDDFE3] p-3 text-sm font-normal outline-none focus:border-[#0057FF]" />
            </label>
            {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={secondaryButton} onClick={onClose} disabled={sending}>Hủy</button>
              <button type="button" className={primaryButton} onClick={submit} disabled={sending}>{sending ? 'Đang gửi…' : 'Gửi báo cáo'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
