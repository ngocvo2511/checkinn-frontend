import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { COMMUNITY_ENABLED } from '@/lib/community/flag';

export const metadata = { title: 'Cộng đồng du lịch - CheckInn' };

export default function CommunityLayout({ children }: { children: ReactNode }) {
  if (!COMMUNITY_ENABLED) notFound();
  return <>{children}</>;
}
