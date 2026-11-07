import { authUser } from './session.ts';
/** NextAuth credentials uses the same internal request/response as the custom login. */
export async function credentialsUser(credentials: {email?: string; password?: string} | undefined, baseUrl: string, fetcher: typeof fetch = fetch) {
  if (!credentials?.email || !credentials?.password) return null;
  try {
    const response=await fetcher(`${baseUrl}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({usernameOrEmail:credentials.email,password:credentials.password}),signal:AbortSignal.timeout(10000)});
    if (!response.ok) return null;
    const user=authUser(await response.json());
    return user ? {id:user.userId,userId:user.userId,name:user.fullName,email:user.email,role:user.role,accessToken:user.token} : null;
  } catch { return null; }
}
