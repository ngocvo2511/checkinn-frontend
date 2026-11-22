import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { COMMUNITY_ENABLED } from '@/lib/community/flag';

export default function CommunityReportsLayout({ children }: { children: ReactNode }) {
  if (!COMMUNITY_ENABLED) notFound();
  return <>{children}</>;
}
