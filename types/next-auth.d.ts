import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      roles?: string[];
      capabilities?: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    roles?: string[];
    capabilities?: string[];
  }
}
