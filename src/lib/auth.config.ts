import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Edge-safe Auth.js configuration
 *
 * This configuration is safe to use in Edge Runtime (middleware, edge routes).
 * Heavy dependencies and Node.js-specific code should NOT be imported here.
 *
 * For full auth configuration with database access, see src/app/auth.ts
 */
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth }) {
      // Return true if user is authenticated
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
