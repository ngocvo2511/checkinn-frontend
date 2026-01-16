'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import { useAuth } from '@/hooks/useAuth';

export default function Header({ onLogin, onSignup, onEditProfile }: { onLogin?: () => void; onSignup?: () => void; onEditProfile?: () => void } = {}) {
  const [showMenu, setShowMenu] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(!isHome);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Check initial scroll position when component mounts
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  // Hide/show header on scroll - only for search and hotel detail pages
  useEffect(() => {
    const isSearchPage = pathname.includes('/search');
    const isHotelPage = pathname.includes('/hotel/');
    
    if (!isSearchPage && !isHotelPage) return;

    const handleScrollVisibility = () => {
      const currentScrollY = window.scrollY;
      
      // Show header if at top or scrolling up
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } 
      // Hide header if scrolling down and not at top
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScrollVisibility);
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, [lastScrollY, pathname]);

  return (
    <header className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="mx-auto flex h-24 max-w-screen-xl items-center justify-between px-4 md:px-8 lg:px-10">
        <Logo isScrolled={isScrolled} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                className={`hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors ${isScrolled ? 'text-[#2B3037] hover:bg-[#F1F2F3]' : 'text-white hover:bg-white/10'}`}
                onClick={() => router.push('/booking/history')}
              >
                Đặt chỗ của tôi
              </button>
              <button
                className={`hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors ${isScrolled ? 'text-[#2B3037] hover:bg-[#F1F2F3]' : 'text-white hover:bg-white/10'}`}
              >
                Hợp tác với chúng tôi
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${isScrolled ? 'bg-[#F1F2F3] hover:bg-[#E1E2E7]' : 'bg-white/20 hover:bg-white/30'}`}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0057FF] text-xs font-bold text-white">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#2B3037]' : 'text-white'}`}>{user.fullName || 'User'}</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#DDDFE3] bg-white shadow-lg z-[9999]">
                    <button
                      onClick={() => { onEditProfile?.(); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-[#2B3037] hover:bg-[#F1F2F3]"
                    >
                      Thông tin cá nhân
                    </button>
                    <button
                      onClick={() => { router.push('/booking/history'); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-[#2B3037] hover:bg-[#F1F2F3]"
                    >
                      Đặt chỗ của tôi
                    </button>
                    
                    <hr className="my-1 border-[#DDDFE3]" />
                    <button
                      onClick={() => { logout(); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className={`hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors ${isScrolled ? 'text-[#2B3037] hover:bg-[#F1F2F3]' : 'text-white hover:bg-white/10'}`}
                onClick={() => router.push('/booking/history')}
              >
                Đặt chỗ của tôi
              </button>
              <button
                className={`hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors ${isScrolled ? 'text-[#2B3037] hover:bg-[#F1F2F3]' : 'text-white hover:bg-white/10'}`}
              >
                Hợp tác với chúng tôi
              </button>
              <button
                className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${isScrolled ? 'border-[#0057FF] bg-white text-[#0057FF] hover:bg-[#0057FF] hover:text-white' : 'border-white bg-transparent text-white hover:bg-white hover:text-[#0057FF]'}`}
                onClick={onSignup}
              >
                Sign Up
              </button>
              <button
                className={`rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-colors ${isScrolled ? 'bg-[#0057FF] text-white hover:bg-[#0046CC]' : 'bg-white text-[#0057FF] hover:bg-white/90'}`}
                onClick={onLogin}
              >
                Login
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
