import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-utils';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will throw notFound() if user is not admin
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation */}
      <nav className="bg-surface shadow-sm border-b border-outline">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-8 min-w-0 flex-1">
              <Link href="/admin" className="text-lg sm:text-xl font-bold text-on-surface whitespace-nowrap">
                Admin
              </Link>
              <div className="flex space-x-2 sm:space-x-4">
                <Link
                  href="/admin/artworks"
                  className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-primary-container whitespace-nowrap"
                >
                  Artworks
                </Link>
                <Link
                  href="/admin/collections"
                  className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-primary-container whitespace-nowrap"
                >
                  Collections
                </Link>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface whitespace-nowrap ml-2"
            >
              <span className="hidden sm:inline">← Back to Site</span>
              <span className="sm:hidden">← Site</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
