import Link from "next/link";
import { buildSocialMetadata, SITE_NAME } from "@/utils/metadata";

// Near-static page: revalidate once a day so a future swap-in of
// real bio copy (or a DB-backed source) does not require a redeploy.
// CRITICAL: do not reintroduce `dynamic = "force-dynamic"` here — see PR #72.
export const revalidate = 86400;

const PAGE_TITLE = `About ${SITE_NAME}`;
const PAGE_DESCRIPTION =
  "Biography and artist statement of EONMUN — original artworks and collections.";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="container mx-auto px-4 py-16">
        <article className="max-w-3xl mx-auto">
          {/* Hero */}
          <header className="mb-12 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-on-background mb-4">
              {SITE_NAME}
            </h1>
            {/* TODO(artist): replace tagline with one the artist endorses. */}
            <p className="text-lg text-on-surface-variant">
              Original artworks and collections.
            </p>
          </header>

          {/* Bio */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-on-background mb-4">
              Biography
            </h2>
            <div className="prose prose-lg max-w-none text-on-surface prose-headings:text-on-background prose-strong:text-on-surface space-y-4">
              {/*
                TODO(artist): replace placeholder biography below with the
                artist-approved long-form bio. Keep to 2–3 paragraphs and
                cover: where the artist is based, formal training (if any),
                primary mediums, and notable past exhibitions or
                publications. Do not invent biographical details; ship empty
                paragraphs rather than fabricated ones.
              */}
              <p>
                Biography coming soon. The full artist biography will appear
                here, including background, training, and the path that led to
                the current body of work.
              </p>
              <p>
                In the meantime, the work itself is the most accurate
                introduction. Browse the{" "}
                <Link
                  href="/collections"
                  className="text-primary hover:underline"
                >
                  collections
                </Link>{" "}
                or get in touch directly via the{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Artist statement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-on-background mb-4">
              Artist statement
            </h2>
            <div className="prose prose-lg max-w-none text-on-surface prose-headings:text-on-background prose-strong:text-on-surface space-y-4">
              {/*
                TODO(artist): replace placeholder statement with the
                artist's own words. One paragraph in editorial voice. Avoid
                generic "exploring the intersection of X and Y" filler.
              */}
              <p>
                Artist statement coming soon. This section is reserved for a
                short, first-person reflection on what the work is about and why
                it is being made.
              </p>
            </div>
          </section>

          {/* TODO(artist): add an Exhibitions & Press section once the
              artist provides a verified list. Tracked separately so this
              first ship does not hold on it. */}

          {/* CTA */}
          <section className="mt-16 pt-8 border-t border-outline">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/collections"
                className="px-6 py-3 bg-primary text-on-primary font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity text-center"
              >
                View collections
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 border border-outline text-on-background font-bold tracking-wide rounded-lg hover:bg-surface transition-colors text-center"
              >
                Contact
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return buildSocialMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/about",
    type: "website",
  });
}
