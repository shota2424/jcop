// ============================================================
// JCOP v4.0 - NextAuth.js Configuration (Node.js runtime only)
// ============================================================
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { getMemberByEmail } from './sheets';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET?.trim(),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const member = await getMemberByEmail(user.email);
        return !!member;
      } catch (e) {
        console.error('[signIn] Sheets error:', e);
        return false;
      }
    },
    async session({ session }) {
      if (session.user?.email) {
        try {
          const member = await getMemberByEmail(session.user.email);
          if (member) {
            (session.user as unknown as Record<string, unknown>).role = member.role;
            session.user.name = member.name;
          }
        } catch (e) {
          console.error('[session] Sheets error:', e);
        }
      }
      return session;
    },
    async jwt({ token }) {
      if (token.email) {
        try {
          const member = await getMemberByEmail(token.email);
          if (member) {
            token.role = member.role;
            token.memberName = member.name;
          }
        } catch (e) {
          console.error('[jwt] Sheets error:', e);
        }
      }
      return token;
    },
  },
});
