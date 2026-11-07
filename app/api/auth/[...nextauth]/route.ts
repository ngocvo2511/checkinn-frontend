import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { credentialsUser } from "@/lib/auth/credentials";

const API_BASE_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const handler = NextAuth({
  // External OAuth tokens cannot authorize internal APIs. Add Google only after a verified server exchange.
  providers: [CredentialsProvider({
    name: "Credentials",
    credentials: {email: {label: "Email hoặc tên đăng nhập", type: "text"}, password: {label: "Password", type: "password"}},
    authorize: credentials => credentialsUser(credentials,API_BASE_URL),
  })],
  callbacks: {
    async signIn({account}) { return account?.provider === 'credentials'; },
    async jwt({token,user,account}) {
      if (user && account?.provider === 'credentials') {
        token.accessToken=user.accessToken;token.id=user.id;token.role=user.role;token.provider='credentials';
      }
      if (token.provider !== 'credentials') {
        delete token.accessToken;delete token.id;delete token.role;delete token.provider;
      }
      return token;
    },
    async session({session,token}) {
      const internal=token.provider === 'credentials';
      session.accessToken=internal ? token.accessToken as string | undefined : undefined;
      session.provider=internal ? 'credentials' : undefined;
      if (session.user) {session.user.id=internal ? token.id as string | undefined : undefined;session.user.role=internal ? token.role as string | undefined : undefined;}
      return session;
    },
  },
  pages: {signIn: "/"},
  secret: process.env.NEXTAUTH_SECRET,
});
export {handler as GET,handler as POST};
