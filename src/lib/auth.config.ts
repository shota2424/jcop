// ============================================================
// JCOP v4.0 - NextAuth Edge-compatible config (no Node.js modules)
// ============================================================
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  providers: [
    Google({
      clientId: (process.env.GOOGLE_CLIENT_ID ?? '').trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET ?? '').trim(),
    }),
  ],
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
