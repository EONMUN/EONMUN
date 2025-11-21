import { getSession, getAdminSession } from './auth-utils';

/**
 * Action result type for unauthorized requests
 */
export type UnauthorizedResult = {
  success: false;
  error: string;
};

/**
 * Check if user is authenticated in a server action
 *
 * Usage:
 * ```ts
 * export async function myAction() {
 *   const session = await requireAuthAction();
 *   if (!session) return { success: false, error: 'Unauthorized' };
 *   // ... rest of action
 * }
 * ```
 *
 * Or with the guard helper:
 * ```ts
 * export async function myAction() {
 *   const authResult = await guardAuth();
 *   if (authResult) return authResult; // Return error if not authenticated
 *   // ... rest of action
 * }
 * ```
 */
export async function requireAuthAction() {
  const session = await getSession();
  return session;
}

/**
 * Check if user is admin in a server action
 *
 * Usage:
 * ```ts
 * export async function myAction() {
 *   const session = await requireAdminAction();
 *   if (!session) return { success: false, error: 'Unauthorized - admin access required' };
 *   // ... rest of action
 * }
 * ```
 *
 * Or with the guard helper:
 * ```ts
 * export async function myAction() {
 *   const authResult = await guardAdmin();
 *   if (authResult) return authResult; // Return error if not admin
 *   // ... rest of action
 * }
 * ```
 */
export async function requireAdminAction() {
  const session = await getAdminSession();
  return session;
}

/**
 * Guard helper for authenticated server actions
 *
 * Returns an error result if not authenticated, null if authenticated.
 * Use this at the start of server actions that require authentication.
 *
 * @returns UnauthorizedResult if not authenticated, null if authenticated
 *
 * @example
 * ```ts
 * export async function getMyData() {
 *   const authError = await guardAuth();
 *   if (authError) return authError;
 *
 *   // User is authenticated, proceed with action
 *   const data = await fetchData();
 *   return { success: true, data };
 * }
 * ```
 */
export async function guardAuth(): Promise<UnauthorizedResult | null> {
  const session = await requireAuthAction();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }
  return null;
}

/**
 * Guard helper for admin-only server actions
 *
 * Returns an error result if not admin, null if admin.
 * Use this at the start of server actions that require admin privileges.
 *
 * @returns UnauthorizedResult if not admin, null if admin
 *
 * @example
 * ```ts
 * export async function deleteUser(id: number) {
 *   const authError = await guardAdmin();
 *   if (authError) return authError;
 *
 *   // User is admin, proceed with action
 *   await deleteUserFromDb(id);
 *   return { success: true };
 * }
 * ```
 */
export async function guardAdmin(): Promise<UnauthorizedResult | null> {
  const session = await requireAdminAction();
  if (!session) {
    return { success: false, error: 'Unauthorized - admin access required' };
  }
  return null;
}
