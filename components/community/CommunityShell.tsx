'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { loginHref } from '@/lib/community/login';

/** The current page, so signing in from it returns here. */
export function currentPath(): string {
  return typeof window === 'undefined' ? '/community' : window.location.pathname + window.location.search;
}

export default function CommunityShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-[#1F2226]">
      <Header onLogin={() => router.push(loginHref(currentPath()))} onSignup={() => router.push('/')} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:py-10">{children}</main>
      <Footer />
    </div>
  );
}

export function StateMessage({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#DDDFE3] bg-white px-6 py-10 text-center">
      <p className="text-base font-semibold text-[#1F2226]">{title}</p>
      {detail && <p className="mt-2 text-sm text-[#656F81]">{detail}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0046CC] disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDDFE3] bg-white px-4 py-2 text-sm font-semibold text-[#2B3037] transition-colors hover:bg-[#F1F2F3] disabled:cursor-not-allowed disabled:opacity-50';
