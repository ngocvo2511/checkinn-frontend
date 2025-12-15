'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Logo from '@/components/Logo';
import AdminHeroPanel from '@/components/AdminHeroPanel';
import AdminInputField from '@/components/AdminInputField';
import { authApi } from '@/lib/api/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({
        usernameOrEmail: username,
        password,
      });

      const role = response.role?.toLowerCase?.() || '';
      if (!role.includes('admin')) {
        setError('The account does not have access.');
        return;
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response));
      localStorage.setItem('rememberAdmin', String(remember));
      setStatus('Login successful. Redirecting to the admin console...');
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[1.05fr_1fr] items-stretch">
          <AdminHeroPanel />

          <form
            onSubmit={handleSubmit}
            className="relative bg-white rounded-2xl border border-[#E8E9F1] shadow-[0_18px_45px_rgba(0,0,0,0.12)] p-6 sm:p-8 flex flex-col gap-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#8B94A4]">Admin login</p>
                <h2 className="text-2xl font-semibold text-[#1F2226]">Welcome back</h2>
                <p className="text-sm text-[#656F81]">
                  Use your admin credentials to enter the dashboard.
                </p>
              </div>
              <div className="hidden sm:block shrink-0">
                <Logo />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {status ? (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-[#0F5132]">
                {status}
              </div>
            ) : null}

            <AdminInputField
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="admin"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.009 10.75C9.66503 10.75 7.75903 8.843 7.75903 6.5C7.75903 4.157 9.66503 2.25 12.009 2.25C14.353 2.25 16.259 4.157 16.259 6.5C16.259 8.843 14.353 10.75 12.009 10.75ZM12.009 3.75C10.492 3.75 9.25903 4.983 9.25903 6.5C9.25903 8.017 10.492 9.25 12.009 9.25C13.526 9.25 14.759 8.017 14.759 6.5C14.759 4.983 13.525 3.75 12.009 3.75ZM15.9969 21.75H8.00305C5.58305 21.75 4.25 20.425 4.25 18.019C4.25 15.358 5.756 12.25 10 12.25H14C18.244 12.25 19.75 15.357 19.75 18.019C19.75 20.425 18.4169 21.75 15.9969 21.75ZM10 13.75C6.057 13.75 5.75 17.017 5.75 18.019C5.75 19.583 6.42405 20.25 8.00305 20.25H15.9969C17.5759 20.25 18.25 19.583 18.25 18.019C18.25 17.018 17.943 13.75 14 13.75H10Z" fill="#8B94A4" />
                </svg>
              }
            />

            <div className="space-y-2">
              <AdminInputField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.9996 10.75H6.00113C5.03555 10.75 4.25 11.5356 4.25 12.5011V18.2489C4.25 19.2144 5.03555 20 6.00113 20H17.9996C18.9652 20 19.7507 19.2144 19.7507 18.2489V12.5011C19.7507 11.5356 18.9652 10.75 17.9996 10.75Z" stroke="#8B94A4" strokeWidth="1.5" />
                    <path d="M7.5 10.75V7.5C7.5 5.29086 9.29086 3.5 11.5 3.5C13.7091 3.5 15.5 5.29086 15.5 7.5V10.75" stroke="#8B94A4" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M12 14.5C12.5523 14.5 13 14.0523 13 13.5C13 12.9477 12.5523 12.5 12 12.5C11.4477 12.5 11 12.9477 11 13.5C11 14.0523 11.4477 14.5 12 14.5Z" fill="#8B94A4" />
                  </svg>
                }
              />
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-[#383E48]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-[#DDDFE3] text-[#0057FF] focus:ring-0"
                  />
                  Remember this device
                </label>
                <a className="font-semibold text-[#0057FF] hover:underline" href="#">
                  Forgot access?
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#0057FF] text-sm font-semibold text-white shadow-sm transition hover:bg-[#0046CC] disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#8B94A4]">
              <span className="h-px flex-1 bg-[#E0E2E7]" />
              <span className="px-3">Secure workspace · Admin only</span>
              <span className="h-px flex-1 bg-[#E0E2E7]" />
            </div>
          </form>
        </div>
      </main>

    </div>
  );
}
