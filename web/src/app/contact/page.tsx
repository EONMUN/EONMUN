import { Mail, User, MessageSquare } from "lucide-react";
import { submitContactForm } from "@/actions/contact";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wide text-on-background">
              CONTACT
            </h1>
            <p className="text-lg text-on-surface-variant">
              Get in touch with us. We&apos;d love to hear from you.
            </p>
          </div>

          <form action={submitContactForm} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-on-surface-variant" />
              </div>
              <input
                type="text"
                name="name"
                required
                placeholder="Your Name"
                className="w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-surface text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-on-surface-variant" />
              </div>
              <input
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-surface text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-on-surface-variant" />
              </div>
              <textarea
                name="message"
                required
                rows={6}
                placeholder="Your message..."
                className="w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-surface text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-primary text-on-primary font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity"
            >
              SEND MESSAGE
            </button>

            {params?.success === "true" && (
              <div className="text-center text-green-600 dark:text-green-400 font-medium">
                Thank you! Your message has been sent successfully.
              </div>
            )}

            {params?.error && (
              <div className="text-center text-red-600 dark:text-red-400 font-medium">
                {params.error}
              </div>
            )}
          </form>

          <div className="mt-12 text-center">
            <p className="text-on-surface-variant">
              Or email us directly at{" "}
              <a
                href="mailto:contacts@eonmun.com"
                className="text-on-background font-medium hover:underline"
              >
                contacts@eonmun.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}