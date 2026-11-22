'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PersonalDataForm from '@/components/PersonalDataForm';
import { CustomerOnlyRoute } from '@/components/CustomerOnlyRoute';

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const tokenSnapshot = () => Boolean(localStorage.getItem('token'));
const serverTokenSnapshot = () => false;

export default function PersonalDataPage() {
  const router = useRouter();
  const canRender = useSyncExternalStore(subscribeStorage, tokenSnapshot, serverTokenSnapshot);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/');
      return;
    }
  }, [router]);

  if (!canRender) {
    return null;
  }

  return (
    <CustomerOnlyRoute>
      <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PersonalDataForm />
      </main>
      </div>
    </CustomerOnlyRoute>
  );
}
