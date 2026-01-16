'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Logo from '@/components/Logo';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/hooks/useAuth';

export default function HostLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!username || !password) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({
        usernameOrEmail: username,
        password,
      });

      const role = response.role?.toUpperCase?.() || '';
      if (role !== 'OWNER') {
        setError('Tài khoản này không có quyền truy cập Host Panel.');
        setLoading(false);
        return;
      }

      setStatus('Đăng nhập thành công. Đang chuyển hướng...');
      
      // Use the login hook to save user data
      await login(response);
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/host/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-[#E8E9F1]">
            <div className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-[#8B94A4] uppercase tracking-wide">Chủ khách sạn</p>
                  <h1 className="text-2xl font-semibold text-[#1F2226]">Đăng nhập</h1>
                </div>
                <div className="hidden sm:block">
                  <Logo />
                </div>
              </div>
              <p className="text-sm text-[#656F81]">
                Sử dụng thông tin tài khoản chủ khách sạn của bạn để tiếp tục.
              </p>
            </div>

            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {status ? (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {status}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2226]">
                  Email hoặc tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className="w-full rounded-lg border border-[#E8E9F1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0057FF] focus:ring-1 focus:ring-[#0057FF]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2226]">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full rounded-lg border border-[#E8E9F1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0057FF] focus:ring-1 focus:ring-[#0057FF]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0057FF] px-4 py-3 font-semibold text-white transition hover:bg-[#0046CC] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-6 border-t border-[#E8E9F1] pt-6 text-center">
              <p className="text-xs text-[#8B94A4]">
                Chỉ tài khoản chủ khách sạn (OWNER) mới có thể truy cập
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
