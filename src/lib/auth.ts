// ============================================================
// JCOP v4.0 - NextAuth.js Configuration (Node.js runtime only)
// ============================================================
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { getMemberByEmail } from './sheets';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      // Check if user's email is in the members allowlist
      if (!user.email) return false;
      const member = await getMemberByEmail(user.email);
      return !!member;
    },
    async session({ session }) {
      if (session.user?.email) {
        const member = await getMemberByEmail(session.user.email);
        if (member) {
          (session.user as unknown as Record<string, unknown>).role = member.role;
          session.user.name = member.name;
        }
      }
      return session;
    },
    async jwt({ token }) {
      if (token.email) {
        const member = await getMemberByEmail(token.email);
        if (member) {
          token.role = member.role;
          token.memberName = member.name;
        }
      }
      return token;
    },
  },
});
