'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AdminStatCard from '@/components/AdminStatCard';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { adminApi, AdminDashboardStats } from '@/lib/api/admin';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasAccess } = useProtectedRoute('ADMIN');
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalApprovedHotels: 0,
    pendingHotels: 0,
    totalUsers: 0,
    totalBookings: 0,
    todayBookings: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Redirect if not authenticated or no access
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/admin');
        return;
      }
      if (!hasAccess) {
        router.push('/');
        return;
      }
    }
  }, [isLoading, isAuthenticated, hasAccess, router]);

  // Fetch dashboard stats only after auth is confirmed
  useEffect(() => {
    const fetchStats = async () => {
      if (!isLoading && isAuthenticated && hasAccess) {
        try {
          const token = localStorage.getItem('token');
          console.log('Token found:', !!token);
          console.log('Auth state:', { isLoading, isAuthenticated, hasAccess });
          
          if (token) {
            console.log('Fetching admin dashboard stats...');
            const data = await adminApi.getDashboardStats(token);
            console.log('Dashboard stats received:', data);
            setStats(data);
          } else {
            console.error('No token found in localStorage');
          }
        } catch (error) {
          console.error('Failed to fetch admin dashboard stats:', error);
          // Keep default zero values if fetch fails
        } finally {
          setIsLoadingStats(false);
        }
      }
    };

    fetchStats();
  }, [isLoading, isAuthenticated, hasAccess]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#656F81]">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // Don't render if no access or not authenticated
  if (!isAuthenticated || !hasAccess) {
    return null;
  }
  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <AdminMenu />

          <div className="flex-1 flex flex-col gap-8">
            <section className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                CheckInn admin
              </div>
              <div className="mt-4 space-y-2">
                <h1 className="text-3xl font-semibold leading-[38px]">Bảng điều khiển Admin</h1>
                <p className="max-w-2xl text-sm text-white/85">
                  Giám sát kiểm duyệt khách sạn, booking và người dùng. Dữ liệu được cập nhật từ backend trong thời gian thực.
                </p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard
                label="Tổng khách sạn đã duyệt"
                value={isLoadingStats ? '...' : String(stats.totalApprovedHotels)}
                helper="Cập nhật real-time từ backend"
                trendLabel="Từ danh sách tất cả khách sạn"
                trendPositive={true}
              />
              <AdminStatCard
                label="Khách sạn chờ duyệt"
                value={isLoadingStats ? '...' : String(stats.pendingHotels)}
                helper="Ưu tiên theo SLA 24h"
                trendLabel="Cần xử lý trong 24 giờ"
                trendPositive={stats.pendingHotels > 0}
              />
              <AdminStatCard
                label="Số user"
                value={isLoadingStats ? '...' : String(stats.totalUsers)}
                helper="Tổng người dùng đã đăng ký"
                trendLabel="Cập nhật từ user-service"
                trendPositive={true}
              />
              <AdminStatCard
                label="Booking trong ngày"
                value={isLoadingStats ? '...' : String(stats.todayBookings)}
                helper="Booking tạo trong hôm nay"
                trendLabel="Real-time data"
                trendPositive={stats.todayBookings > 0}
              />
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
