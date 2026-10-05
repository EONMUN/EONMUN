# Contributor guide

This repo uses devenv for a reproducible shell and Bun for the active Astro workspace.

## Setup

From the repo root:

```bash
devenv shell
cd code
bun install --frozen-lockfile
```

If using direnv:

```bash
direnv allow
cd code
bun install --frozen-lockfile
```

The local database is managed by devenv. `devenv up` starts local sqld, applies migrations from `code/drizzle/`, seeds fixture data, then starts Astro. The database lives at `.devenv/state/eonmun-dev.sqld`. The setup task unsets Turso credentials so it cannot mutate production.

## Development server

Start the local stack from the repo root:

```bash
devenv up
```

This runs `db:setup` first, then starts Astro. The selected URL is recorded in `code/.env.local` (usually `http://127.0.0.1:4321`). Stop it with:

```bash
devenv processes down
```

## Common commands

Run stack and database tasks from the repo root:

```bash
devenv up
devenv processes down
devenv tasks run db:setup
```

Run validation and Cloudflare commands from `code/`:

```bash
bun run content:sync
bun run astro check
bun run build
bun test
bun run test:e2e
bun run preview
bun run cf-typegen
```

Content sync regenerates repository posts. `bun run build` runs that sync and then `astro build`.

## Content editing

Turso is the production source for artwork, collections, relationships, products, prices, and availability. Files in `fixtures/` seed local development only. Posts remain repository content and are regenerated into `code/src/content/posts/`.

### Add artwork

Use `/admin/artworks` to create and publish artwork. Uploads go through the authenticated Worker endpoint to the bound R2 bucket. Prices are stored in USD cents and shown on published artwork pages only while the product is available for purchase.

The public Pinterest catalog feed is `https://eonmun.com/pinterest-catalog.csv`. It includes only published artwork marked available for purchase with a positive price and an image. The admin price and availability fields control it automatically. It remains available for inspection, but the current Pinterest proof uses direct API batches instead of registering the CSV as a data source. The artwork page and checkout check live availability even while Pinterest is processing a catalog change. Checkout does not reserve inventory yet; a timed reservation is a separate inventory change. A second paid order for an already-sold artwork is recorded and flagged on `/admin/orders`.

With the Pinterest app secret configured, saving a published artwork as available for purchase submits that artwork to Pinterest automatically. Later price, content, availability, and publication changes update or remove that artwork. The editor checks the submitted batch and shows a warning if Pinterest rejects it. A confirmed Stripe sale submits a removal and checks briefly for an asynchronous failure; later failures require manual reconciliation. `/admin/pinterest` remains a full-catalog retry and reconciliation tool. It derives USD item prices from the same sale-eligible catalog query as the CSV feed and checks each item's asynchronous result. It removes previously submitted artworks that still exist in the site database when they become unavailable. Do not attach the CSV feed to the same Pinterest catalog while using the batch API. The existing 24-hour test token lacks `catalogs:write` and cannot run this sync.

The Pinterest app ID and catalog ID are non-secret Worker variables. To enable the admin sync, the Pinterest app owner must have two-factor authentication enabled and the app must be allowed to mint a client-credentials token with `catalogs:read` and `catalogs:write`. Set `PINTEREST_APP_SECRET` as an `eonmun-astro` Worker secret, then use the admin page to test the first batch and inspect its item result. Keep the app secret out of source, shell history, and chat. If Pinterest denies client-credentials access to this catalog, use an authorization-code connection instead.

`PINTEREST_AD_ACCOUNT_ID` identifies the Pinterest ad account used for catalog API authorization. It is separate from `PINTEREST_CATALOG_ID`. The configured ad account is `549770850256`; if a catalog batch still returns HTTP 403, confirm this account has Catalog Admin access to the catalog before changing site inventory.

Google Merchant API sync uses the same sale-eligible artwork query. After configuration, saving a published saleable artwork submits its product input in USD; changing availability or receiving a paid Stripe webhook removes it. New artworks start as drafts and sync when published. A Monday 09:00 UTC Worker schedule refreshes the catalog weekly; `/admin/google` retries and reconciles it on demand. API submission is not Google approval or a guaranteed live listing; check Merchant Center product diagnostics. The API source must be a **primary API product data source** with U.S. feed label, not an HTML website or file source. Do not also manage the same products through a separate automatic website source, since a sold artwork may reappear after API removal.

To connect the Worker, create a Google Cloud service account with Merchant API enabled. The Connect flow adds its email to Merchant Center account `5867265608` automatically with Standard access. Account ID `5867265608` and API data source ID `10758370300` are configured as public `eonmun-astro` Worker vars. Set the complete service-account JSON as the `GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON` Worker secret. Never commit or paste the key in chat. Configure Merchant Center with U.S. shipping included in the price and the site's final-sale returns policy. Use `/admin/google` for the initial backfill and inspect one processed product before treating the integration as live.

The Google OAuth web client used by Better Auth must belong to the same Cloud project as the service account. Keep its authorized redirect URI as `https://eonmun.com/api/auth/callback/google`. From production `/admin/google`, select **Connect Google Merchant**, use the same Google account as your admin session, and grant Merchant Center access. This registers the Cloud project using your Merchant Center Admin identity, adds the configured service account with Standard access if needed, and accepts its pending invitation through the API. The extra scope is requested only for this setup; the Google user token remains in memory for the callback and is not stored. If Google is still applying the registration, wait five minutes and select **Retry all artwork listings** to finish verification and backfill. Normal artwork saves, Stripe callbacks, and the weekly refresh continue using the service account.

### Add a post

1. Add the post entry to `fixtures/posts.json`.
2. Put the Markdown or MDX body in the `body` field.
3. Use `artworkSlugs` and `collectionSlugs` to connect the post to existing content.
4. If using a cover image, upload it to R2 first and set `coverImageUrl` to the public URL.
5. Set `createdAt` and `updatedAt` when adding a post. Advance `updatedAt` when changing its published content; the sitemap uses it for `<lastmod>`.
6. From `code/`, run `bun run posts:sync`.
7. Review the generated file in `code/src/content/posts/`.

Post fixture fields:

```json
{
  "title": "Post title",
  "slug": "post-title",
  "body": "## Heading\n\nPost body.",
  "excerpt": "Short summary for listing pages.",
  "postType": "announcement",
  "publishedAt": "2026-05-28T00:00:00.000Z",
  "scheduledAt": null,
  "createdAt": "2026-05-28T00:00:00.000Z",
  "updatedAt": "2026-05-28T00:00:00.000Z",
  "locale": "en",
  "artworkSlugs": [],
  "collectionSlugs": []
}
```

Allowed `postType` values are `announcement`, `educational`, `behind_the_scenes`, and `general`.

### Add a collection

Use `/admin/collections` to create collections, manage membership, and select the artwork whose default image is the collection cover.

Published collections have dedicated `/collections/[slug]` pages showing their published artwork. Artwork links from a collection carry `?collection=<slug>` for analytics attribution. Legacy `/artworks?collection=<slug>` links navigate to the dedicated page in the browser.

## Cloudflare

Production deploys run through GitHub Actions on pushes to `main` that touch `code/**`, `.github/workflows/deploy.yml`, or `.github/actions/cloudflare-deploy/**`.

Pull requests from branches in this repository get a versioned Cloudflare preview URL from the `Preview Astro` workflow.

Astro 7 route rules cache the home page, artwork gallery and detail pages, posts, and sitemaps at the Cloudflare edge for five minutes, with one minute of stale-while-revalidate. Successful admin artwork and collection writes purge their shared `public-content` cache tag, then request the canonical public pages to fill the cache with the saved content before responding. Other runtime routes, including admin, checkout, auth, and inventory, are not cached. Post changes require a deploy; each Worker version starts with a separate cache.

To check a deployed preview, request a public route twice and confirm `CF-Cache-Status` changes from `MISS` to `HIT`; subsequent hits include `Age`. Confirm admin and inventory routes show `BYPASS`. Cloudflare consumes the provider's cache control and tag headers, so they may not appear in client responses. Local Astro dev and preview do not reproduce the deployed Worker cache or its purge API.

Normal deploys preserve the Stripe secrets configured directly on `eonmun-astro`. `PUBLIC_STRIPE_PUBLISHABLE_KEY` is a public Wrangler variable exposed to the browser through the purchase form's `data-stripe-publishable-key` attribute. Checkout uses a server-created Stripe session and a redirect, so it does not require Stripe.js on the artwork page.

For first-time automated Stripe setup, set the live `STRIPE_SECRET_KEY` in GitHub Actions and manually run **Deploy Astro** with `configure_stripe` enabled. This validates the Stripe account, creates the payment webhook at `https://eonmun.com/api/webhooks/stripe` when none exists, stores its signing secret directly on the Worker, and checks authentication with an unpaid event before installing the checkout key. An existing endpoint with a missing Worker signing secret requires restoring that endpoint's secret before retrying. Preview uploads never provision secrets.

Required production Worker secrets for `eonmun-astro`:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

The artwork editor's optional writing assistant uses `OPENAI_API_KEY` as a Worker secret. It sends the editor's current artwork fields and cover image to OpenAI when an admin requests suggestions. Suggested copy is never published until the admin applies it and saves the artwork.

The facet release applied migrations `0011` through `0015` to production on 2026-10-03. Facets use `namespace`/`key`/`value` and shared `artworks_to_facets` memberships. Migration `0016` restores width, height and depth as nullable numeric artwork columns with a unit, copying measurements from facets before removing those facet records. The editor has dedicated Dimensions, Materials and surface, and Subject and style sections. Categorical values remain shared facets internally. Orientation derives from complete measurements. Size labels are not stored or edited: frontend size criteria must compare numeric dimensions after unit conversion. Migration `0017` removes the old artwork size memberships and values. Editor version 2 requires the named attribute fields; older generic-facet payloads receive a reload-required response.

Historical SQL migrations remain necessary for fresh databases and migration history; they are not runtime compatibility code. Temporary release scripts, workflow controls, and database backup tables were removed after live verification. See [Artwork facet model and catalog audit](docs/artwork-facets.md) for migration decisions and verification.


Configure Stripe to send `checkout.session.completed` and `checkout.session.async_payment_succeeded` events to `https://eonmun.com/api/webhooks/stripe`. Contact-email secrets are required only by the contact runtime endpoint.

## Orders

Migration `0020_stripe_orders.sql` adds the `orders` table. Apply it before deploying the webhook change; production CI runs `bun run db:migrate` before promoting the Worker.

The Stripe webhook stores one order per paid Checkout Session: `checkout.session.completed` with `payment_status` `paid`, or `checkout.session.async_payment_succeeded`. Unpaid completions are ignored until the delayed payment succeeds. Only signed events are processed. The order and the artwork's sold mark are written in one transaction, so neither exists without the other.

Each order keeps:

- Stripe Checkout Session, PaymentIntent, Customer (when Stripe created one), and the recording event ID and type
- buyer email, name, business name, phone, and complete billing address
- recipient name and shipping address, with a recipient phone only when Stripe supplies one separately
- currency, purchased artwork amount, subtotal, discount, shipping, tax, and total
- the artwork title and slug shown when Checkout was created, the linked artwork and product IDs, payment time, fulfillment status, and an attention flag

Card details and the raw webhook payload are never stored. Missing optional Stripe fields are stored as empty.

The webhook endpoint uses the Stripe account's default API version. Since `2025-03-31.basil`, Checkout reports shipping under `collected_information.shipping_details`; older versions use top-level `shipping_details`. The parser reads both.

Checkout requires a full billing address (`billing_address_collection=required`). It does not ask for a phone number: Stripe makes an enabled phone field mandatory. A phone is stored when Stripe supplies one, for example from a wallet, and the shipping label uses it.

Checkout writes the artwork title and slug into the session metadata, and the order keeps those values, so renaming an artwork while Checkout is open or before a delayed payment settles does not change the order. Sessions without title metadata, created before this change or outside the site, use the Stripe line item name, fetched with `STRIPE_SECRET_KEY` only for a new order. If Stripe cannot answer, the webhook returns 500 and Stripe retries. Without a key or a line item, the order uses the catalog title and marks that source. The order page links to the artwork's current admin page.

Repeated deliveries for a session return the stored order and do not change inventory or raise a flag. Orders need attention when:

- `artwork_already_sold`: a separate paid session bought an artwork another order already sold. Refund it in Stripe.
- `artwork_not_found`: the session has no matching artwork product, such as a Payment Link created in Stripe. The payment is kept rather than discarded.

`/admin/orders` lists paid orders newest first. Each order page shows buyer, recipient, addresses, totals, Stripe dashboard links, a copyable shipping label, and a fulfillment status control (`To ship`, `Shipped`, `Delivered`, `Cancelled`). Admin and API routes are `no-store`; Worker logs carry Stripe references only, never buyer details. Order pages set the layout's `privateData` option, which leaves out PostHog and the Pinterest tag, so autocapture and session recording never see buyer details.

Sales made before migration `0020` have no order row. If Stripe retries one of those events after deployment, it is recorded as a new order flagged `artwork_already_sold`; confirm it against Stripe before refunding.

## Validation

Before opening or merging a PR, run:

```bash
cd code
bun install --frozen-lockfile
bun run build
bun test
bun run test:e2e
```

The PR validation workflow runs the Astro build, Bun tests, and Playwright artwork flows. Playwright uses an isolated local database and a test Better Auth session; its purchase test mocks the checkout redirect while `code/test/checkout.test.ts` checks server-side Stripe session creation.

## Admin order notifications

Admins can receive a Web Push alert on each device when an order is paid. Alerts use the standard Push API, so no Apple Developer membership or Firebase project is needed. Each admin enables alerts per device at `/admin/notifications`, linked from `/admin`.

On iPhone and iPad, Web Push requires iOS or iPadOS 16.4 or later and the Home Screen app. Add EONMUN to the Home Screen from Safari, open it, sign in to admin inside the app (it does not share Safari's session), then tap **Enable notifications**. The permission prompt appears only from that tap. Desktop Safari, Chrome, Edge, and Firefox work from a normal tab. The page also shows device status, a one-tap test notification, and per-device removal.

Alerts read "Order paid" with the artwork title and amount, and open `/admin/orders/<orderId>`. They never include buyer names, emails, or addresses, because they appear on lock screens.

### Configuration

| Name | Kind | Value |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY` | Public var in `wrangler.jsonc` | Base64url uncompressed P-256 public key |
| `VAPID_PRIVATE_KEY` | Worker secret | Base64url P-256 private key |
| `VAPID_SUBJECT` | Optional public var | `mailto:` address or HTTPS URL; defaults to `https://eonmun.com` |

To enable production alerts, from `code/`:

1. Run `bun run scripts/generate-vapid-keys.ts | bunx wrangler secret put VAPID_PRIVATE_KEY --name eonmun-astro`. The script refuses to print the private key to a terminal; it prints only the public key.
2. Add the printed `VAPID_PUBLIC_KEY` to `vars` in `wrangler.jsonc` and deploy. Deployment applies migration `0021_admin_push`.
3. Each admin enables alerts on each device and sends a test notification.

Never commit the private key or put it in `vars`. Without both keys, the page reports that push is not configured and orders work without alerts. Replacing the key pair invalidates every enrolled device; admins must enable alerts again.

### Integration and delivery

The Stripe webhook calls `enqueueAdminOrderNotification(env, order.notification)` from `code/src/lib/admin-order-notifications.ts` after storing the order, on every verified paid delivery, including replays. The alert carries the stored order ID, artwork title, total in the currency's minor unit, and currency. The function never throws; it returns `queued`, `duplicate`, `not_configured`, `invalid`, or `failed`. Repeated calls for one order ID send nothing new. If the alert cannot be recorded (`failed` or `invalid`), the webhook returns 500 after the order is stored. Stripe's retry finds the existing order and records the alert. Disabled push (`not_configured`) and push delivery failures never fail the webhook. Recipients are the allowlisted admins' devices enrolled when the order is first recorded, so a device enrolled later never receives an older order.

Delivery starts after the webhook response. The `* * * * *` Worker cron retries queued alerts; the scheduled handler routes by trigger, so the Monday `0 9 * * 1` Google Merchant refresh still runs weekly. Each run sends at most 10 alerts with a 10-second timeout per request. Transient failures (network errors, timeouts, HTTP 408, 429, and 5xx) are retried after 1, 2, 5, 15, and 30 minutes, honouring `Retry-After` up to an hour; the sixth failure is final. Alerts older than 24 hours are not sent. A 404 or 410 response removes the device. Devices of admins removed from `ADMIN_EMAILS`, and devices enrolled under a previous key, are removed instead of receiving alerts. `/admin/notifications` shows the delivery state of recent alerts.

Each delivery is claimed with a short lease, so the cron and the post-webhook attempt do not send the same alert. If a Worker stops mid-send, the alert may be sent again after the lease expires; the push `Topic` and notification tag collapse such duplicates.

SECURITY: subscription endpoints must be HTTPS URLs on Apple (`*.push.apple.com`), Google (`fcm.googleapis.com`), Mozilla (`*.push.services.mozilla.com`), or Windows (`*.notify.windows.com`) push services. Redirects are not followed. A new browser push service needs an allowlist entry in `code/src/lib/push/subscription-input.ts`.

The service worker at `/push-sw.js` is scoped to `/admin/` and has no fetch handler, so it caches nothing.

Automated tests mock the browser and push services. Acceptance requires a physical iPhone: install the Home Screen app, enable alerts, close the app, confirm a test notification and a test-mode paid order both arrive, and confirm that tapping the order alert opens its admin page.

## Analytics

The Astro base layout loads PostHog into the existing US project on `eonmun.com`
and `www.eonmun.com`. Browser analytics requests use the reverse proxy at
`https://fipijgll.eonmun.com`; the PostHog UI and server-side query API remain
on `https://us.posthog.com`. Local and preview hosts disable analytics by default. To
validate against a separate test project, set `PUBLIC_POSTHOG_KEY` at build time.
This is a public ingestion key, never a PostHog personal API key.

Named events support PostHog breakdowns and funnels:

| Event | Properties | Trigger |
| --- | --- | --- |
| `post_clicked` | `post_slug`, `destination_path`, `source_path` | A link to a post, including nested image/text clicks |
| `artwork_clicked` | `artwork_slug`, `destination_path`, `source_path` | A link to an artwork, including related artwork links |
| `checkout_started` | `artwork_slug`, `source_path` | Submission of the Buy form |
| `checkout_returned` | `artwork_slug`, `checkout_status`, `source_path` | Return from Stripe with `success` or `cancelled` |

Use `artwork_clicked → checkout_started → checkout_returned` for the browser
checkout funnel, filtered to `checkout_status = success` on the final step.
A success return is **not** a verified purchase; payment confirmation remains in
the Stripe webhook. `$pageview`, autocapture, and exception capture are enabled.

The browser reads the uncached Better Auth session, identifies signed-in admins by
their stable Google account ID, and resets a previously identified visitor when
the session is empty. Existing sessions must sign in again to replace the old
random Auth.js ID with the stable Google ID. Session lookup failures leave the
existing identity intact. Personal identity is never embedded in public HTML.

Collection analytics records `collection_clicked` with `collection_slug`. Collection pageviews and artwork pageviews reached via `?collection=<slug>` include `collection_slug`, as do artwork-page checkout-start events. This URL parameter records navigation context, not verified membership or identity.

### Admin traffic panel

The top of `/admin` shows public pageviews for 7, 30, or 90 complete UTC days,
a seven-day moving average, the previous-period change, and top ten referring
websites and countries. Missing days count as zero; a zero previous total shows
“No prior baseline.” Referrers describe the pageview's referring domain, not
first-touch marketing attribution. Admin/API routes and non-production hosts
are excluded. Identified visitors whose person email matches `ADMIN_EMAILS`
(case-insensitive) are excluded from every metric; visitors without an email
remain included. This SQL exclusion is independent of PostHog dashboard filters.
Reports are cached internally for five minutes behind admin auth;
browser responses remain `no-store`.

Configure `POSTHOG_PROJECT_ID` and `POSTHOG_PERSONAL_API_KEY` on the
`eonmun-astro` Worker. The personal API key needs `query:read` for that project.
Keep it server-side; do not use a `PUBLIC_` prefix or the public ingestion key.
The panel shows a disconnected state when these are missing and an unavailable
state for query failures. No sample data is displayed as real traffic.

## Preview sign-in

Better Auth uses the OAuth proxy plugin with `AUTH_PROXY_URL=https://eonmun.com`,
checked into `code/wrangler.jsonc` for production and all preview versions.
Google's authorized redirect URI remains
`https://eonmun.com/api/auth/callback/google`. The preview starts sign-in, Google
returns to production, and production sends the encrypted profile back to the
preview to set its own host-only session cookies.

Deploy the Better Auth migration to production before completing sign-in on its
preview. Both ends must speak the same proxy protocol; an Auth.js production
callback cannot process Better Auth state. Older preview branches must merge
this change and redeploy. Existing Auth.js sessions are not migrated; sign in
again after deployment.

Versions of `eonmun-astro` inherit the same `AUTH_SECRET`, which supplies the
shared proxy encryption key as well as session encryption. An optional Worker
secret `OAUTH_PROXY_SECRET` can separate proxy encryption from session encryption;
if configured, use the same value on every participating version. Never put
secrets in `vars`. `AUTH_REDIRECT_PROXY_URL` belonged to Auth.js and is no longer
used. Local proxy login also requires the shared proxy secret; local fixture
tests do not contact Google or production.

Only verified Google emails in `ADMIN_EMAILS` can create an admin session. Every
admin request checks the current allowlist again. Sessions use encrypted cookies
with a fixed 30-day expiry; no auth database migration is needed. Sign-out clears
the browser cookies. As with the previous stateless sessions, signing out does
not centrally revoke a copied cookie; removing an email from `ADMIN_EMAILS`
blocks its admin access.

## Home-screen app

The site includes a standalone web app manifest and home-screen icons. In Safari,
use Share → Add to Home Screen. The manifest launches `/`; saving another page
does not reliably select a different launch route. Admin sign-in is available
directly at `/admin`, which can be saved as a private browser bookmark. It is not
linked in the public navigation. On the homepage, tap the EONMUN logo five times
with less than 1.5 seconds between taps to open admin sign-in, including inside
the installed app. From other pages, the logo returns home normally. Only
allowlisted Google accounts can access administration. The app requires a network connection; it
does not cache pages for offline use.

The homepage includes the first artwork's saved tint in its initial HTML for
the browser theme and page background. Its loading screen remains warm ivory;
ivory also serves as the fallback when no saved color is available. The homepage is locked to the dynamic
viewport height without page scrolling, with navigation overlaid on the artwork.
The slideshow resizes with browser controls and device rotation; caption links
stay inside the visible viewport. It is not a fixed, solid-color layer that
Safari can use to tint its toolbars. The homepage also
opts into a translucent status bar when launched from the iPhone home screen;
navigation and captions respect device safe areas. Other routes retain their own
viewport and status-bar behavior. iOS can keep the homepage status-bar treatment
while navigating within the installed app, so do not rely on that chrome change
alone to distinguish routes.

Acceptance requires checking both a Safari tab and the installed app on a
physical iPhone, in portrait and landscape, confirming the homepage does not scroll, and navigating to another
route and back. Desktop browser tests do not reproduce Safari toolbar, safe-area,
or installed-app behavior.

### Saved homepage colors

Migration `0018_artwork_background_color.sql` adds nullable `background_color`
and `background_image_url` columns to artwork records. Admin saves calculate a
small image average with the Cloudflare Images binding when the cover changes
or its color is missing. Unchanged covers reuse their saved color. Removing a
cover clears it. Failed calculations leave the color empty and retry next save.
Only owned media is fetched, without following redirects.

Migration `0019_backfill_artwork_background_colors.sql` contains the precomputed
colors for existing covers. It matches exact default-image URLs, fills missing
or stale values, and preserves colors already saved for the current cover.
Migration `0018` remains unchanged because it has already been applied.

Production CI runs the standard `bun run db:migrate` after building and before
promoting the Worker, using the production Turso GitHub secrets. The migration
journal ensures each SQL migration runs once. A migration failure stops
deployment. Preview uploads do not modify the database. No image download or
artwork-specific backfill script runs during deployment.

The homepage starts with ivory page and browser-bar colors. Each slide's saved
color is embedded in the HTML, but the first tint is applied only after the
loading overlay has finished fading away, without a second background-color
animation. Subsequent slide changes crossfade the tint. If the image fails, the loading
screen and browser tint stay ivory. Later tints follow slide transitions. No visitor-side image sampling is needed. On iOS only, soft
gradients blend the artwork edges toward that color; desktop and Android display
the artwork without this overlay. The CSS feature query uses the iOS-only
`-webkit-touch-callout` property, so it takes effect before JavaScript runs. Colors use the whole
cover, so rotation does not change the tint. Safari still controls its own
bars; physical iPhone acceptance is required for toolbar colors and transitions.
