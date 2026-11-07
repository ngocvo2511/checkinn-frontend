export type InternalRole = 'CUSTOMER' | 'OWNER' | 'ADMIN';
export interface AuthUser {
  userId: string; token: string; role: InternalRole; email: string; fullName: string;
  emailVerified?: boolean; avatar?: string; provider: 'credentials'; authSource: 'custom' | 'nextauth';
}
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): ObjectValue | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ObjectValue : null;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value !== 'undefined' && value !== 'null';
/** Shape adapter only; the backend verifies signatures, ownership and revocation on every request. */
export function authUser(value: unknown, storedToken?: string | null): AuthUser | null {
  const data=object(value);
  if (!data || (data.provider != null && data.provider !== 'credentials')) return null;
  const token=data.token ?? storedToken;
  const role=typeof data.role==='string' ? data.role.toUpperCase() : '';
  if (!text(data.userId) || !text(token) || !['CUSTOMER','OWNER','ADMIN'].includes(role)) return null;
  return {userId:data.userId,token,role:role as InternalRole,email:typeof data.email==='string'?data.email:'',
    fullName:typeof data.fullName==='string'?data.fullName:'',emailVerified:typeof data.emailVerified==='boolean'?data.emailVerified:undefined,
    avatar:typeof data.avatar==='string'?data.avatar:undefined,provider:'credentials',authSource:data.authSource==='nextauth'?'nextauth':'custom'};
}
export function authSession(value: unknown): AuthUser | null {
  const session=object(value), user=object(session?.user);
  if (!session || session.provider!=='credentials' || !user) return null;
  return authUser({userId:user.id,token:session.accessToken,role:user.role,email:user.email,fullName:user.name,avatar:user.image,provider:'credentials',authSource:'nextauth'});
}
export type AuthStorage = Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function readAuth(storage: AuthStorage): AuthUser | null {
  try { return authUser(JSON.parse(storage.getItem('user') || 'null'),storage.getItem('token')); } catch { return null; }
}
export function clearAuth(storage: AuthStorage) { storage.removeItem('token');storage.removeItem('user'); }
export function storeAuth(storage: AuthStorage, user: AuthUser) { storage.setItem('user',JSON.stringify(user));storage.setItem('token',user.token); }
