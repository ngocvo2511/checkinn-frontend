'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PersonalDataForm from '@/components/PersonalDataForm';
import { AuthResponse } from '@/lib/api/auth';

export default function PersonalDataPage() {
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/');
      return;
    }
    
    setCanRender(true);
    setMounted(true);
  }, [router]);

  if (!canRender || !mounted) {
    return null;
  }

  return (
    <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PersonalDataForm />
      </main>
    </div>
  );
}
