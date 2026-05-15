'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { userApi, UserDetailResponse } from '@/lib/api/users';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/auth/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token || !userId) return;

    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        const data = await userApi.getUserDetail(token, userId);
        setUser(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user detail:', err);
        setError('Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [token, userId]);

  const handleLockAccount = async () => {
    if (!user) return;

    // Check current state
    if (!user.isActive) {
      alert('Tài khoản này đã ở trạng thái khóa');
      return;
    }

    // Confirm action
    const confirmed = confirm('Bạn có chắc chắn muốn khóa tài khoản này?');
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await userApi.lockAccount(token!, userId);
      alert('Tài khoản đã được khóa thành công');
      router.push('/admin/users');
    } catch (err) {
      console.error('Failed to lock account:', err);
      alert('Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockAccount = async () => {
    if (!user) return;

    // Check current state
    if (user.isActive) {
      alert('Tài khoản này đã ở trạng thái mở khóa');
      return;
    }

    // Confirm action
    const confirmed = confirm('Bạn có chắc chắn muốn mở khóa tài khoản này?');
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await userApi.unlockAccount(token!, userId);
      alert('Tài khoản đã được mở khóa thành công');
      router.push('/admin/users');
    } catch (err) {
      console.error('Failed to unlock account:', err);
      alert('Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackToList = () => {
    router.push('/admin/users');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />

      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-4xl space-y-4">
          {/* Header */}
          <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
              CheckInn Admin
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Chi tiết người dùng</h1>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-center text-[#6A7280]">
              Đang tải thông tin người dùng...
            </div>
          )}

          {/* User Detail */}
          {!loading && user && (
            <div className="space-y-4">
              {/* Main Info Card */}
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[#0B2E68]">
                      Thông tin tài khoản
                    </h2>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive
                        ? 'bg-[#E8FFF3] text-[#0F5132]'
                        : 'bg-[#FFE8E6] text-[#9C1F23]'
                    }`}>
                      {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </div>

                  {/* Grid Info */}
                  <div className="grid grid-cols-2 gap-6 border-t border-[#E8E9F1] pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#6A7280] uppercase tracking-wide">
                        Tên đăng nhập
                      </label>
                      <p className="mt-1 text-sm text-[#383E48]">{user.username}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6A7280] uppercase tracking-wide">
                        Email
                      </label>
                      <p className="mt-1 text-sm text-[#383E48]">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6A7280] uppercase tracking-wide">
                        Tên đầy đủ
                      </label>
                      <p className="mt-1 text-sm text-[#383E48]">{user.fullName || '-'}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6A7280] uppercase tracking-wide">
                        Số điện thoại
                      </label>
                      <p className="mt-1 text-sm text-[#383E48]">{user.phone || '-'}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6A7280] uppercase tracking-wide">
                        Vai trò
                      </label>
                      <p className="mt-1 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'OWNER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6A7280] uppercase tracking-wide">
                        Ngày tạo
                      </label>
                      <p className="mt-1 text-sm text-[#383E48]">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <h3 className="mb-4 text-lg font-semibold text-[#0B2E68]">Hành động quản lý</h3>

                <div className="flex gap-3">
                  {user.isActive ? (
                    <button
                      onClick={handleLockAccount}
                      disabled={actionLoading}
                      className="flex-1 rounded-lg bg-[#DC2626] px-4 py-2 text-center font-medium text-white hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? 'Đang xử lý...' : 'Khóa tài khoản'}
                    </button>
                  ) : (
                    <button
                      onClick={handleUnlockAccount}
                      disabled={actionLoading}
                      className="flex-1 rounded-lg bg-[#059669] px-4 py-2 text-center font-medium text-white hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? 'Đang xử lý...' : 'Mở khóa tài khoản'}
                    </button>
                  )}

                  <button
                    onClick={handleBackToList}
                    disabled={actionLoading}
                    className="flex-1 rounded-lg border border-[#E8E9F1] px-4 py-2 text-center font-medium text-[#6A7280] hover:bg-[#F9F9F9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
