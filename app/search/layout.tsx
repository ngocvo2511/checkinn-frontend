import { Suspense, type ReactNode } from 'react';

export default function SearchLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status">Đang tải tìm kiếm…</p>}>{children}</Suspense>;
}
