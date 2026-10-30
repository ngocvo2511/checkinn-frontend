import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    role?: string;
  }

  interface Session {
    accessToken?: string;
    provider?: string;
    user: DefaultSession["user"] & {
      id?: string;
      role?: string;
    };
  }
}
