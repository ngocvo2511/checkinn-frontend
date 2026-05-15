'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { userApi, UserPageResponse, UserResponse } from '@/lib/api/users';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/auth/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data: UserPageResponse = await userApi.getUsers(token, page, PAGE_SIZE);
        setUsers(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Không thể tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, page]);

  const handleViewDetail = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handlePreviousPage = () => {
    setPage((current) => Math.max(current - 1, 0));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages - 1));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />

      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
              CheckInn Admin
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Quản lý tài khoản người dùng</h1>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-center text-[#6A7280]">
              Đang tải danh sách người dùng...
            </div>
          )}

          {!loading && users.length > 0 && (
            <>
              <div className="rounded-2xl border border-[#E8E9F1] bg-white shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E8E9F1] bg-[#F9F9F9]">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6A7280]">Tên đăng nhập</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6A7280]">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6A7280]">Tên đầy đủ</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6A7280]">Vai trò</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6A7280]">Trạng thái</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6A7280]">Ngày tạo</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6A7280]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-[#E8E9F1] hover:bg-[#F9F9F9] transition-colors">
                          <td className="px-6 py-4 text-sm text-[#383E48] font-medium">{user.username}</td>
                          <td className="px-6 py-4 text-sm text-[#6A7280]">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-[#6A7280]">{user.fullName}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'OWNER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              user.isActive
                                ? 'bg-[#E8FFF3] text-[#0F5132]'
                                : 'bg-[#FFE8E6] text-[#9C1F23]'
                            }`}>
                              {user.isActive ? 'Hoạt động' : 'Khóa'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#6A7280]">{formatDate(user.createdAt)}</td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleViewDetail(user.id)}
                              className="text-[#0057FF] hover:underline font-medium"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#E8E9F1] bg-white p-4 text-sm text-[#6A7280] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div>
                  Hiển thị trang {page + 1} / {totalPages} — tổng {totalElements} người dùng
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={page === 0}
                    className="rounded-lg border border-[#E8E9F1] bg-white px-3 py-2 text-sm font-medium text-[#2B3037] transition hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trang trước
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-[#E8E9F1] bg-white px-3 py-2 text-sm font-medium text-[#2B3037] transition hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && users.length === 0 && !error && (
            <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-center text-[#6A7280]">
              Không tìm thấy người dùng nào
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

