# EONMUN Architecture

## System Overview

EONMUN is a Next.js 15 App Router application serving as an artist portfolio, e-commerce store, and content platform. It runs on Cloudflare Workers (via OpenNext) in production and Docker Compose locally.

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Portfolio │  │  Store   │  │  Posts   │  │  Admin   │   │
│  │ /artworks │  │ /store   │  │ /posts   │  │ /admin/* │   │
│  │ /collect. │  │ /purchase│  │ /posts/* │  │          │   │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │              │              │              │         │
│  ┌─────▼──────────────▼──────────────▼──────────────▼─────┐  │
│  │              Server Actions (src/actions/)              │  │
│  │  artwork.ts  collection.ts  post.ts  admin/*.ts        │  │
│  └─────────────────────┬──────────────────────────────────┘  │
│                        │                                      │
│  ┌─────────────────────▼──────────────────────────────────┐  │
│  │              Models (src/models/)                       │  │
│  │  artwork.ts  artworks.ts  collection.ts  post.ts       │  │
│  └─────────────────────┬──────────────────────────────────┘  │
│                        │                                      │
│  ┌─────────────────────▼──────────────────────────────────┐  │
│  │              Drizzle ORM (src/database/)                │  │
│  │  schema.artworks.ts  schema.posts.ts  schema.*.ts      │  │
│  └─────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │   libSQL / Turso (DB)   │
            └─────────────────────────┘

External Services:
  - Stripe (payments)
  - Cloudflare R2 (image storage)
  - Google OAuth (admin auth via NextAuth)
```

## Layer Architecture

### 1. Pages (src/app/)

Server components that fetch data and render UI. Organized by route group:

- **Portfolio**: `/artworks`, `/artworks/[slug]`, `/collections`, `/collections/[slug]`
- **Store**: `/store`, `/store/[slug]`, `/purchase`
- **Posts**: `/posts`, `/posts/[slug]`
- **Admin**: `/admin/artworks`, `/admin/collections`, `/admin/posts`, `/admin/orders`
- **Static**: `/about`, `/contact`

### 2. Server Actions (src/actions/)

Business logic layer. Two categories:

- **Public actions** (`src/actions/*.ts`): Read-only, no auth required
- **Admin actions** (`src/actions/admin/*.ts`): Protected by `guardAdmin()`, handle CRUD mutations

Pattern: Actions call model functions, handle errors, revalidate paths, return `{ success, data }` or `{ success: false, error }`.

### 3. Models (src/models/)

Query layer between actions and database. Patterns:

- Filter objects with optional array fields for flexible querying
- `findX(filters)` for base queries, `findXWithRelations(filters)` for eager-loaded data
- Parallel relationship loading via `Promise.all`
- Map-based result combining for efficient relationship assembly

### 4. Database Schema (src/database/)

Drizzle ORM schema definitions. Each domain has its own schema file:

- `schema.artworks.ts`: artworks, artworkImages, artworksToCollections, artworksToFacets
- `schema.collections.ts`: collections
- `schema.posts.ts`: posts, postsToArtworks, postsToCollections
- `schema.products.ts`: products
- `schema.facets.ts`: facets
- `schema.users.ts`: users

Common patterns: auto-increment ID, unique slug, `publishedAt` for visibility, `createdAt`/`updatedAt` timestamps, `locale` field, cascade deletes on junction tables.

## Data Model

### Core Entities and Relationships

```
artworks ──────── artworkImages (1:N)
    │
    ├──── artworksToCollections ──── collections
    │     (M:N junction)
    │
    ├──── artworksToFacets ──── facets
    │     (M:N junction)
    │
    ├──── postsToArtworks ──── posts
    │     (M:N junction)
    │
    └──── products (1:1, nullable)

collections ──── postsToCollections ──── posts
                 (M:N junction)

users (admin auth)
```

## Authentication

- NextAuth v5 with JWT strategy (no database sessions)
- Google OAuth provider
- Admin flag on user model
- `guardAuth()` / `guardAdmin()` guards on server actions
- `requireAdmin()` in admin layout for route protection

## Image Storage

- Upload via `/api/upload` route → Cloudflare R2
- Unique filenames: `${timestamp}-${randomStr}${ext}`
- Public URLs via R2_PUBLIC_URL
- `ImageUpload` component handles client-side validation and upload

## Deployment

- **Development**: Docker Compose (libSQL), `npm run dev` with Turbopack
- **Production**: Cloudflare Workers via OpenNext (`opennextjs-cloudflare build && deploy`)
- **Database**: Turso (hosted libSQL) in production
