'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PersonalDataForm from '@/components/PersonalDataForm';

export default function PersonalDataPage() {
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    setCanRender(true);
  }, [router]);

  if (!canRender) {
    return null;
  }

  return <PersonalDataForm />;
}
