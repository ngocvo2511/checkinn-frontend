import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { COMMUNITY_ENABLED } from '@/lib/community/flag';

export const metadata = { title: 'Địa điểm - CheckInn' };

export default function PlacesLayout({ children }: { children: ReactNode }) {
  if (!COMMUNITY_ENABLED) notFound();
  return <>{children}</>;
}
