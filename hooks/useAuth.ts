import { useState, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { authApi } from '@/lib/api/auth';
import { authUser, authSession, readAuth, storeAuth, clearAuth, type AuthUser } from '@/lib/auth/session';

const AUTH_CHANGED='checkinn:auth-changed';
const announce=() => window.dispatchEvent(new Event(AUTH_CHANGED));
export function useAuth() {
  const [user,setUser]=useState<AuthUser | null>(null);
  const [loading,setLoading]=useState(true);
  const {data:session,status}=useSession();
  useEffect(() => {
    const read=() => { const current=readAuth(localStorage); if (!current) clearAuth(localStorage);setUser(current);setLoading(false); };
    read();window.addEventListener(AUTH_CHANGED,read);window.addEventListener('storage',read);
    return () => {window.removeEventListener(AUTH_CHANGED,read);window.removeEventListener('storage',read);};
  },[]);
  useEffect(() => {
    if (status==='loading') return;
    const internal=authSession(session);
    if (internal) {storeAuth(localStorage,internal);announce();}
    else if (readAuth(localStorage)?.authSource==='nextauth') {clearAuth(localStorage);announce();}
  },[session,status]);
  const login=useCallback(async (data: unknown) => {
    const internal=authUser(data);
    if (!internal) throw new Error('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.');
    // End a different cookie session before accepting a custom login account.
    await signOut({redirect:false});
    storeAuth(localStorage,{...internal,authSource:'custom'});announce();
  },[]);
  const logout=useCallback(async () => {
    const token=localStorage.getItem('token');
    try {if (token) await authApi.logout(token);} catch {console.warn('Server-side logout could not be completed');}
    try {await signOut({redirect:false});} catch {console.warn('Cookie session logout could not be completed');}
    clearAuth(localStorage);announce();
  },[]);
  const updateUser=useCallback((data: Partial<AuthUser>) => {
    const current=readAuth(localStorage);if (!current) return;
    storeAuth(localStorage,{...current,...data,userId:current.userId,role:current.role,token:current.token,provider:current.provider,authSource:current.authSource});announce();
  },[]);
  const hasRole=useCallback((role: string | string[]) => !!user && (Array.isArray(role)?role.includes(user.role):role===user.role),[user]);
  return {user,isLoading:loading || status==='loading',login,logout,updateUser,hasRole,isAuthenticated:!!user};
}
