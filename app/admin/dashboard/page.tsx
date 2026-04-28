'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />

      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl">
          <section className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
              CheckInn Admin
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Bảng điều khiển Admin</h1>
          </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
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
      </main>
    </div>
  );
}
