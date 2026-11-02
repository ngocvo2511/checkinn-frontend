import { Suspense, type ReactNode } from 'react';

export default function BookingLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status">Đang tải thông tin đặt phòng…</p>}>{children}</Suspense>;
}
