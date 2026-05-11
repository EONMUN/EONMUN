// Static page — no DB fetch, no per-request data. Default Next.js
// caching is fine; do not set force-dynamic.
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">About</h1>
      <p className="text-lg text-gray-600">
        Page temporarily unavailable. Content will be added from database
        fixtures.
      </p>
    </div>
  );
}
