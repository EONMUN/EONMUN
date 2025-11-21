import { signIn, auth } from '@/app/auth';
import { redirect, notFound } from 'next/navigation';

/**
 * Sign In Page
 *
 * Development: Shows password form for credentials provider
 * Production: Shows Google OAuth button
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // If already authenticated, redirect to callback URL or home
  const session = await auth();
  const params = await searchParams;
  if (session?.user) {
    const callbackUrl = params.callbackUrl || '/';
    const isAdmin = (session.user as { admin?: boolean }).admin;

    // If trying to access admin routes but not an admin, return 404
    if (callbackUrl.startsWith('/admin') && !isAdmin) {
      notFound();
    }

    redirect(callbackUrl);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to EONMUN
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Admin access required
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Development: Credentials Form */}
          {isDevelopment && (
            <form
              action={async (formData: FormData) => {
                'use server';
                await signIn('password', {
                  password: formData.get('password'),
                  redirectTo: params.callbackUrl || '/admin',
                });
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password (password or admin)"
                />
              </div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in with Password
              </button>
            </form>
          )}

          {/* Divider */}
          {isDevelopment && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
              </div>
            </div>
          )}

          {/* Google OAuth */}
          <form
            action={async () => {
              'use server';
              await signIn('google', {
                redirectTo: params.callbackUrl || '/admin',
              });
            }}
          >
            <button
              type="submit"
              className="group relative w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Development hint */}
          {isDevelopment && (
            <p className="text-xs text-center text-gray-500 mt-4">
              Dev mode: Use &quot;password&quot; for regular user or &quot;admin&quot; for admin
              access
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
