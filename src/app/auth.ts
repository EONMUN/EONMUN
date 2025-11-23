import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from '@/lib/auth.config';
import { db } from '@/database';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';

/**
 * Auth.js (NextAuth.js v5) Configuration
 *
 * Strategy: Pure JWT (no database adapter)
 * - Development: Credentials provider with password-based auth
 * - Production: Google OAuth provider
 * - Session Management: JWT tokens stored in cookies
 *
 * Authentication Flow:
 * 1. User signs in (OAuth or Credentials)
 * 2. JWT callback looks up or creates user in database
 * 3. User data encoded into JWT token
 * 4. Session callback adds user data to session object
 */

// Configure providers based on environment
const providers = process.env.NODE_ENV === 'development'
  ? [
      // Development: Google OAuth + Credentials
      Google,
      Credentials({
        id: 'password',
        name: 'Password',
        credentials: {
          password: {
            label: 'Password',
            type: 'password',
            placeholder: 'password or admin',
          },
        },
        authorize: async (credentials) => {
          // Accept "password" or "admin" with optional suffix
          // Examples: "password", "password-123", "admin", "admin-456"
          const password = credentials.password as string;
          const passwordMatch = password.match(/^(password|admin)(?:-.*)?$/);

          if (!passwordMatch) {
            return null;
          }

          const [, baseType] = passwordMatch;
          const isAdmin = baseType === 'admin';
          const email = isAdmin ? 'admin@example.com' : 'user@example.com';

          // Look up user in database
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            admin: user.admin ?? false,
          };
        },
      }),
    ]
  : [
      // Production: Google OAuth only
      Google,
    ];

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers, // Use our configured providers array
  adapter: undefined, // Pure JWT - NO database adapter

  callbacks: {
    /**
     * JWT Callback - Runs on sign-in and token refresh
     *
     * Called whenever a JWT is created (at sign in) or updated (when session is accessed).
     * We look up the user in the database and store their ID and admin status in the token.
     */
    async jwt({ token, user }) {
      // On sign-in with Credentials provider, user object is fully populated with DB data
      if (user && user.id) {
        token.id = user.id;
        token.admin = (user as { admin?: boolean }).admin ?? false;
        return token;
      }

      // For OAuth providers (Google) or token refresh, look up user by email
      const { email, name, picture: image } = token;
      if (!email) {
        throw new Error('No email found during JWT callback');
      }

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email as string))
        .limit(1);

      if (existingUser) {
        token.id = existingUser.id.toString();
        token.admin = existingUser.admin ?? false;
        return token;
      }

      // Create new user for OAuth sign-ins
      const [newUser] = await db
        .insert(users)
        .values({
          email: email as string,
          name: (name as string | null) ?? 'User',
          image: image as string | null,
          admin: false,
        })
        .returning();

      token.id = newUser.id.toString();
      token.admin = newUser.admin ?? false;
      return token;
    },

    /**
     * Session Callback - Runs on every session access
     *
     * Adds user ID and admin status from JWT to session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { admin?: boolean }).admin = token.admin as boolean;
      }
      return session;
    },
  },

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Enable debug logs in development
  debug: process.env.NODE_ENV === 'development',
});

/**
 * Server-side authentication check
 *
 * Use this in Server Components and Server Actions when you need to
 * ensure a user is authenticated. Throws an error if not authenticated.
 */
export async function authRequired() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session;
}

/**
 * Check if current user is an admin
 *
 * Use this in Server Components and Server Actions for admin-only routes
 */
export async function requireAdmin() {
  const session = await authRequired();
  const isAdmin = (session.user as { admin?: boolean }).admin;

  if (!isAdmin) {
    throw new Error('Admin access required');
  }

  return session;
}
