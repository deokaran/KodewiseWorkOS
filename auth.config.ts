import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginRoute = nextUrl.pathname.startsWith('/login');

      if (isLoginRoute) {
        if (isLoggedIn) {
          const role = auth.user.role;
          if (role === 'TEAM_LEADER') return Response.redirect(new URL('/tl', nextUrl));
          return Response.redirect(new URL('/employee', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      // Role based protection
      const isTlRoute = nextUrl.pathname.startsWith('/tl');
      if (isTlRoute) {
        const isCollabRoute = nextUrl.pathname.startsWith('/tl/fc/collaborations');
        const userCapabilities = (auth?.user as any)?.capabilities || [];
        const hasCollabCapability = userCapabilities.includes('Collaborator');
        if (auth.user.role !== 'TEAM_LEADER' && !(isCollabRoute && hasCollabCapability)) {
          return Response.redirect(new URL('/employee', nextUrl));
        }
      }

      const isEmployeeRoute = nextUrl.pathname.startsWith('/employee');
      if (isEmployeeRoute && auth.user.role === 'TEAM_LEADER') {
        // TL can technically access everything, but if they go to /employee they might be redirected
        // Let's just allow it or redirect. Prompt says "TL can access all internal modules."
        return true; 
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.roles = (user as any).roles;
        token.id = user.id;
        token.capabilities = user.capabilities;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
        session.user.id = token.id as string;
        session.user.capabilities = token.capabilities as string[];
      }
      return session;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
