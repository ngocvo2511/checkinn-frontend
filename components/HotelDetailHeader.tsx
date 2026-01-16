'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { useAuth } from '@/hooks/useAuth';
import { HotelSearchBar } from './HotelSearchBar';

interface Section {
  id: string;
  label: string;
}

interface HotelDetailHeaderProps {
  sections: Section[];
  activeSection: string;
  onSectionClick: (id: string) => void;
  hotelId?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
  rooms?: string;
  onSearchClick?: () => void;
  onLogin?: () => void;
  onSignup?: () => void;
}

export default function HotelDetailHeader({ sections, activeSection, onSectionClick, hotelId, hotelName, checkIn, checkOut, adults, children, rooms, onSearchClick, onLogin, onSignup }: HotelDetailHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY;
          
          setHeaderOffset((prev) => {
            const newOffset = prev + diff;
            // Clamp between 0 and 96 (header height)
            return Math.max(0, Math.min(96, newOffset));
          });
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleEditProfile = () => {
    router.push("/personal-data");
  };

  return (
    <div className="sticky top-0 z-40">
      <div 
        className="transition-transform duration-150 ease-out"
        style={{ transform: `translateY(-${headerOffset}px)` }}
      >
        {/* Header */}
        <header className="bg-white/95 backdrop-blur shadow-sm border-b border-[#E5E7EB]">
          <div className="mx-auto flex h-24 max-w-screen-xl items-center justify-between px-4 md:px-8 lg:px-10">
            <Logo isScrolled={true} />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <button
                      className="hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors text-[#2B3037] hover:bg-[#F1F2F3]"
                      onClick={() => router.push('/booking/history')}
                    >
                      Đặt chỗ của tôi
                    </button>
                    <button
                      className="hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors text-[#2B3037] hover:bg-[#F1F2F3]"
                    >
                      Hợp tác với chúng tôi
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPosition({ 
                            top: rect.bottom + 8, 
                            right: window.innerWidth - rect.right 
                          });
                          setShowMenu(!showMenu);
                        }}
                        className="flex items-center gap-2 rounded-full px-3 py-2 transition-colors bg-[#F1F2F3] hover:bg-[#E1E2E7]"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0057FF] text-xs font-bold text-white">
                          {user.fullName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium transition-colors text-[#2B3037]">{user.fullName || 'User'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      className="hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors text-[#2B3037] hover:bg-[#F1F2F3]"
                      onClick={() => router.push('/booking/history')}
                    >
                      Đặt chỗ của tôi
                    </button>
                    <button
                      className="hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex transition-colors text-[#2B3037] hover:bg-[#F1F2F3]"
                    >
                      Hợp tác với chúng tôi
                    </button>
                    <button
                      className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-colors border-[#0057FF] bg-white text-[#0057FF] hover:bg-[#0057FF] hover:text-white"
                      onClick={onSignup}
                    >
                      Đăng ký
                    </button>
                    <button
                      className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-colors bg-[#0057FF] text-white hover:bg-[#0046CC]"
                      onClick={onLogin}
                    >
                      Đăng nhập
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dropdown Menu - Portal outside sticky container */}
        {showMenu && (
          <div 
            className="fixed w-48 rounded-xl border border-[#DDDFE3] bg-white shadow-lg"
            style={{ 
              top: `${menuPosition.top}px`, 
              right: `${menuPosition.right}px`,
              zIndex: 10000
            }}
          >
                          <button
                            onClick={() => { handleEditProfile(); setShowMenu(false); }}
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

        {/* Search Info Bar - Above Tabs */}
        <div className="bg-white border-b border-[#E5E7EB]">
          <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 py-4">
            <HotelSearchBar
              initialHotelName={hotelName}
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialAdults={adults}
              initialChildren={children}
              initialRooms={rooms}
              onSearch={(data) => {
                const formatDateLocal = (date: Date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                };
                
                const params = new URLSearchParams();
                params.set('checkIn', formatDateLocal(data.checkIn));
                params.set('checkOut', formatDateLocal(data.checkOut));
                params.set('rooms', data.rooms.toString());
                params.set('adults', data.adults.toString());
                params.set('children', data.children.toString());
                
                const queryString = params.toString();
                
                // If selected hotel is different from current hotel, redirect to new hotel directly
                if (data.hotelId && data.hotelId !== hotelId) {
                  router.push(`/hotel/${data.hotelId}?${queryString}`);
                }
                // If selected location is a city (not a hotel), redirect to search page with city filter
                else if (!data.hotelId && data.cityName) {
                  router.push(`/search?cityId=${data.cityId}&cityName=${encodeURIComponent(data.cityName)}&${queryString}`);
                }
                // If staying on same hotel, just update search parameters
                else {
                  const currentUrl = new URL(window.location.href);
                  currentUrl.searchParams.set('checkIn', formatDateLocal(data.checkIn));
                  currentUrl.searchParams.set('checkOut', formatDateLocal(data.checkOut));
                  currentUrl.searchParams.set('rooms', data.rooms.toString());
                  currentUrl.searchParams.set('adults', data.adults.toString());
                  currentUrl.searchParams.set('children', data.children.toString());
                  window.location.href = currentUrl.toString();
                }
              }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
          <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-12 flex items-center gap-2 overflow-x-auto py-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeSection === section.id
                    ? "bg-[#0F172A] text-white shadow"
                    : "text-[#4B5563] hover:text-[#0F172A] hover:bg-[#E5E7EB]"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
