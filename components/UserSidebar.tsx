'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserSidebarProps {
  fullName?: string;
  activeMenu?: 'profile' | 'bookings' | 'payments' | 'trips' | 'favorites' | 'help' | 'reviews' | 'settings';
  onLogout?: () => void;
}

export default function UserSidebar({ fullName = 'Đang tải...', activeMenu, onLogout }: UserSidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (onLogout) onLogout();
    router.push("/");
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Dữ liệu cá nhân',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      href: '/personal-data'
    },
    {
      id: 'bookings',
      label: 'Đặt chỗ của tôi',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6h-2V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H9V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2H1v2h2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8h2V6zm0 12H5V8h14v10zm-9-9h2v2h-2zm4 0h2v2h-2zm-8 0h2v2H6z"/>
        </svg>
      ),
      href: '/booking/history'
    },
    {
      id: 'payments',
      label: 'Tài khoản thanh toán',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6h-2V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H9V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2H1v2h2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8h2V6zm0 12H5V8h14v10zm-9-9h2v2h-2zm4 0h2v2h-2zm-8 0h2v2H6z"/>
        </svg>
      ),
      href: '#'
    }
  ];

  return (
    <aside className="w-72 flex-shrink-0">
      <div className="bg-white rounded-2xl p-6 sticky top-28">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-semibold text-lg">
            {fullName ? fullName.charAt(0).toUpperCase() : 'E'}
          </div>
          <div>
            <h3 className="font-semibold text-[#1f2226]">{fullName || 'Đang tải...'}</h3>
            <p className="text-xs text-[#8b94a4]">Du khách</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 border-b border-gray-200"></div>

        {/* Navigation Menu */}
        <nav className="space-y-2 mb-6">
          <Link href="/personal-data" className={`w-full text-left px-5 py-3 rounded-xl font-medium text-base flex items-center gap-2 transition-colors ${
            activeMenu === 'profile' 
              ? 'bg-[#e8effc] text-[#0057ff]' 
              : 'text-[#383e48] hover:bg-gray-50'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Thông tin cá nhân
          </Link>
          
          <button onClick={() => router.push('/booking/history')} className={`w-full text-left px-5 py-3 rounded-xl font-medium text-base flex items-center gap-2 transition-colors ${
            activeMenu === 'bookings' 
              ? 'bg-[#e8effc] text-[#0057ff]' 
              : 'text-[#383e48] hover:bg-gray-50'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper-icon lucide-newspaper"><path d="M15 18h-5"/><path d="M18 14h-8"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="10" y="6" rx="1"/></svg>
            Đặt chỗ của tôi
          </button>
          
          <button 
            onClick={() => router.push('/reviews')} 
            className={`w-full text-left px-5 py-3 rounded-xl font-medium text-base flex items-center gap-2 transition-colors ${
              activeMenu === 'reviews' 
                ? 'bg-[#e8effc] text-[#0057ff]' 
                : 'text-[#383e48] hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            Đánh giá
          </button>
        </nav>

        {/* Divider */}
        <div className="mb-6 border-b border-gray-200"></div>

        {/* Settings */}
        <button className="w-full text-left px-5 py-3 rounded-xl text-[#383e48] font-medium text-base flex items-center gap-2 hover:bg-gray-50 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.64l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.49.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.22-.07.49.12.64l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.64l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.49-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.64l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          Cài đặt
        </button>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full text-left px-5 py-3 rounded-xl text-[#ee0000] font-medium text-base flex items-center gap-2 hover:bg-red-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#ee0000]">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
