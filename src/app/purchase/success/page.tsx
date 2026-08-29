import Link from "next/link";
import { getProductBySlug } from "@/actions/product";
import Image from "@/components/Image";
import PurchaseSuccessTracker from "@/components/PurchaseSuccessTracker";

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    product_slug?: string;
  }>;
}

export default async function PurchaseSuccessPage(props: SuccessPageProps) {
  const { session_id, product_slug } = await props.searchParams;

  // Fetch product details if slug is provided
  const product = product_slug ? await getProductBySlug(product_slug) : null;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Client-side analytics: completes the purchase funnel started in PurchaseButton */}
      <PurchaseSuccessTracker
        sessionId={session_id}
        productId={product?.id}
        productName={product?.name}
        productSlug={product?.slug}
        priceCents={product?.price}
      />
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-on-background mb-4">
          Purchase Successful!
        </h1>

        <p className="text-xl text-on-surface-variant mb-8">
          Thank you for your purchase. Your payment has been processed
          successfully.
        </p>

        {/* Product Details */}
        {product && (
          <div className="bg-surface border border-outline rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-on-surface mb-4">
              You&apos;ve purchased:
            </h2>

            <div className="flex items-center gap-4 justify-center">
              {(product.imageUrl || product.artwork?.defaultImageUrl) && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-outline">
                  <Image
                    src={
                      product.imageUrl || product.artwork?.defaultImageUrl || ""
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="text-left">
                <h3 className="text-xl font-bold text-on-background">
                  {product.name}
                </h3>
                {product.artwork?.year && (
                  <p className="text-on-surface-variant">
                    {product.artwork.year}
                  </p>
                )}
                <p className="text-lg font-semibold text-green-600 mt-1">
                  $
                  {(product.price / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session Information */}
        {session_id && (
          <div className="bg-primary-container/10 border border-primary rounded-lg p-4 mb-8">
            <p className="text-sm text-on-surface-variant">
              <strong>Transaction ID:</strong> {session_id}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Please save this ID for your records
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="text-left bg-surface border border-outline rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-on-surface mb-3">
            What&apos;s next?
          </h3>
          <ul className="space-y-2 text-on-surface-variant">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              You&apos;ll receive a confirmation email shortly
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Your certificate of authenticity will be sent within 24 hours
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Digital files will be available for download in your account
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/store"
            className="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Browse More Products
          </Link>

          {product?.artwork && (
            <Link
              href={`/artworks/${product.artwork.slug}`}
              className="px-6 py-3 border border-outline text-on-surface rounded-lg font-semibold hover:bg-surface-variant transition-colors"
            >
              View Artwork Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ searchParams }: SuccessPageProps) {
  const { product_slug } = await searchParams;

  return {
    title: "Purchase Successful - EONMUN",
    description: product_slug
      ? `Successfully purchased product. Thank you for your purchase!`
      : "Purchase completed successfully",
  };
}
