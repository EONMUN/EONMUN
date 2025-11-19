import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/app/auth';

/**
 * Get the current authenticated session
 *
 * Use this in Server Actions when you need to check authentication
 * without throwing. Returns null if not authenticated.
 *
 * @returns The authenticated session or null
 */
export async function getSession() {
  const session = await auth();
  return session?.user ? session : null;
}

/**
 * Check if the current user is an admin
 *
 * Use this in Server Actions when you need to check admin privileges
 * without throwing. Returns null if not authenticated or not admin.
 *
 * @returns The authenticated session if admin, null otherwise
 */
export async function getAdminSession() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const isAdmin = (session.user as { admin?: boolean }).admin;

  return isAdmin ? session : null;
}

/**
 * Require authentication for the current request
 *
 * Use this in Server Components (NOT Server Actions) when you need to
 * ensure a user is authenticated. Redirects to sign-in page if not authenticated.
 *
 * @returns The authenticated session
 * @throws redirect() if user is not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '/';
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return session;
}

/**
 * Require admin privileges for the current request
 *
 * Use this in Server Components (NOT Server Actions) when you need to
 * ensure a user is authenticated AND has admin privileges.
 * Redirects to sign-in page if user is not authenticated or not an admin.
 *
 * @returns The authenticated session (with admin user)
 * @throws redirect() if user is not authenticated or not admin
 */
export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '/admin';
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return session;
}
