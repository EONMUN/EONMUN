import { aboutAPI } from "@/lib/strapi";
import { DynamicZone } from "@/components/DynamicZone";
import { notFound } from "next/navigation";

export default async function AboutPage() {
  const about = await aboutAPI.get();

  if (!about) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-on-background mb-4 uppercase">
            {about.title || "About"}
          </h1>
        </div>

        {/* Dynamic Content */}
        <DynamicZone blocks={about.blocks} />
      </div>
    </div>
  );
}
