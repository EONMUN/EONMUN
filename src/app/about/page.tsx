import Link from "next/link";

// Force dynamic rendering - disable build-time caching
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wide text-on-background">
              ABOUT EONMUN
            </h1>
            <p className="text-lg text-on-surface-variant">
              Artist • Creator • Visionary
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Artist Statement */}
            <section className="bg-surface border border-outline rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-on-background">
                Artist Statement
              </h2>
              <div className="prose prose-lg max-w-none text-on-surface-variant space-y-4">
                <p>
                  EONMUN creates contemporary artworks that explore the intersection 
                  of traditional techniques and modern expression. Through a unique 
                  blend of mediums including watercolor, acrylic, and mixed media, 
                  each piece invites viewers into a dialogue between form and emotion.
                </p>
                <p>
                  The artistic practice is rooted in a deep appreciation for both 
                  Eastern and Western artistic traditions, resulting in works that 
                  transcend cultural boundaries while maintaining a distinct and 
                  recognizable aesthetic.
                </p>
              </div>
            </section>

            {/* Practice & Approach */}
            <section className="bg-surface border border-outline rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-on-background">
                Practice & Approach
              </h2>
              <div className="prose prose-lg max-w-none text-on-surface-variant space-y-4">
                <p>
                  Each artwork begins with an exploration of materials and their 
                  inherent properties. The creative process emphasizes spontaneity 
                  and intentionality in equal measure, allowing for both planned 
                  compositions and serendipitous discoveries.
                </p>
                <p>
                  Working primarily with watercolor and acrylics on canvas and paper, 
                  the focus remains on capturing moments of beauty, contemplation, 
                  and emotional resonance through color, form, and texture.
                </p>
              </div>
            </section>

            {/* Collections */}
            <section className="bg-surface border border-outline rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-on-background">
                Collections
              </h2>
              <div className="prose prose-lg max-w-none text-on-surface-variant space-y-4">
                <p>
                  EONMUN&apos;s work is organized into thematic collections, each 
                  representing a distinct exploration of style, technique, or subject 
                  matter. From the minimalist elegance of the Black and White series 
                  to the vibrant energy of Oriental-inspired pieces, each collection 
                  offers a unique window into the artist&apos;s creative vision.
                </p>
                <p>
                  Browse the collections to explore the full range of available works 
                  and discover pieces that resonate with your aesthetic sensibility.
                </p>
              </div>
            </section>

            {/* Contact CTA */}
            <section className="text-center bg-surface border border-outline rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-on-background">
                Get in Touch
              </h2>
              <p className="text-on-surface-variant mb-6">
                Interested in commissioning a piece or learning more about available works?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/collections"
                  className="px-6 py-3 bg-primary text-on-primary font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity"
                >
                  VIEW COLLECTIONS
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 border-2 border-primary text-primary font-bold tracking-wide rounded-lg hover:bg-primary hover:text-on-primary transition-colors"
                >
                  CONTACT US
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata() {
  return {
    title: "About EONMUN - Artist Biography",
    description: "Learn about EONMUN, a contemporary artist exploring the intersection of traditional techniques and modern expression through watercolor, acrylic, and mixed media.",
  };
}
