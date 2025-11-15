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
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-on-surface">
                Admin Panel
              </Link>
              <div className="flex space-x-4">
                <Link
                  href="/admin/artworks"
                  className="px-3 py-2 rounded-md text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-primary-container"
                >
                  Artworks
                </Link>
                <Link
                  href="/admin/collections"
                  className="px-3 py-2 rounded-md text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-primary-container"
                >
                  Collections
                </Link>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
