import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    provider?: string;
    user: DefaultSession["user"] & {
      id?: string;
      role?: string;
    };
  }
}
