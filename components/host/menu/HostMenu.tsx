'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { hostMenuItems } from './menuItems';

export default function HostMenu() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <aside className="w-[260px] shrink-0 rounded-2xl border border-[#E8E9F1] bg-white p-3 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
      <nav className="flex flex-col gap-2">
        {hostMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-3 transition ${
                isActive
                  ? 'bg-[#E8EFFC] border border-[#CCE0FF] text-[#0B2E68]'
                  : 'border border-transparent text-[#2B3037] hover:border-[#E8E9F1] hover:bg-[#F7F8FA]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isActive ? 'bg-white text-[#0057FF]' : 'bg-[#F4F6FB] text-[#6A7280]'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d={item.iconPath} fill="currentColor" />
                  </svg>
                </div>
                <span className={`text-sm font-semibold ${isActive ? 'text-[#0B2E68]' : 'text-[#2B3037]'}`}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-[#E8E9F1] pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <span>Đăng xuất</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 17L21 12L16 7M21 12H9M12 19H5C4.44772 19 4 18.5523 4 18V6C4 5.44772 4.44772 5 5 5H12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}
