'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminMenuItems } from './menuItems';
import Logo from '@/components/Logo';

export default function AdminMenu() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] shrink-0 border-r border-[#E8E9F1] bg-white shadow-sm overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-[#E8E9F1]">
        <div className="mb-4 flex ml-3 mt-3">
          <Logo isScrolled={true} />
        </div>
        <div className="text-sm font-semibold text-[#0B2E68] ml-3">Admin Dashboard</div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 p-3">
        {adminMenuItems.map((item) => {
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

      <div className="mt-3 border-t border-[#E8E9F1] pt-3 px-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 border border-transparent hover:border-red-100"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 17L21 12L16 7M21 12H9M12 19H5C4.44772 19 4 18.5523 4 18V6C4 5.44772 4.44772 5 5 5H12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
