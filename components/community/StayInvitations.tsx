'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BedDouble, X } from 'lucide-react';
import { socialApi, SocialApiError } from '@/lib/api/social';
import { COMMUNITY_ENABLED } from '@/lib/community/flag';
import { formatMonth, shareStayHref } from '@/lib/community/rules';
import type { StayInvitation } from '@/types/social';
import { primaryButton, secondaryButton } from './CommunityShell';

interface StayInvitationsProps {
  token: string | null | undefined;
}

/**
 * Invitations are a prompt, not content: while loading, on failure or when there are none, nothing is shown,
 * so the page around them never breaks.
 */
export default function StayInvitations({ token }: StayInvitationsProps) {
  const [invitations, setInvitations] = useState<StayInvitation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!COMMUNITY_ENABLED || !token) return;
    let current = true;
    socialApi.myInvitations(token)
      .then(items => { if (current) setInvitations(items.filter(item => item.hotel !== null)); })
      .catch(() => { if (current) setInvitations([]); });
    return () => { current = false; };
  }, [token]);

  if (!COMMUNITY_ENABLED || !token || invitations.length === 0) return null;

  async function dismiss(invitation: StayInvitation) {
    if (!token) return;
    setBusy(invitation.id);
    setError('');
    try {
      await socialApi.dismissInvitation(token, invitation.id);
      setInvitations(previous => previous.filter(item => item.id !== invitation.id));
    } catch (failure) {
      setError(failure instanceof SocialApiError ? failure.message : 'Không thể ẩn lời mời lúc này.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="Chia sẻ chuyến đi của bạn" className="space-y-3" data-testid="stay-invitations">
      {invitations.map(invitation => {
        const hotel = invitation.hotel!;
        const share = shareStayHref(invitation);
        return (
          <div key={invitation.id} className="rounded-2xl border border-[#BFD3FF] bg-[#F3F7FF] p-4" data-testid="stay-invitation">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <BedDouble className="mt-0.5 h-5 w-5 shrink-0 text-[#0057FF]" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1F2226]">Chuyến đi của bạn tại {hotel.name} thế nào?</p>
                  <p className="mt-0.5 text-xs text-[#656F81]">
                    Trả phòng {formatMonth(invitation.checkOutMonth)}{hotel.cityName ? ` · ${hotel.cityName}` : ''}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => void dismiss(invitation)} disabled={busy === invitation.id}
                aria-label={`Ẩn lời mời cho ${hotel.name}`} className="rounded p-1 text-[#656F81] hover:bg-white disabled:opacity-40">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {share && <Link href={share} className={primaryButton}>Chia sẻ chuyến đi</Link>}
              <Link href={`/reviews/new?bookingId=${encodeURIComponent(invitation.id)}&hotelId=${encodeURIComponent(hotel.id)}`}
                className={secondaryButton}>Đánh giá khách sạn</Link>
            </div>
          </div>
        );
      })}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </section>
  );
}
