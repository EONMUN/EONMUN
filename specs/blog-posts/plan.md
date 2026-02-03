# Blog Posts Implementation Plan

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                    Public Pages                          │
│  /posts (listing)    /posts/[slug] (detail)             │
│  /artworks/[slug] (related posts)                       │
│  /collections/[slug] (related posts)                    │
└──────────────┬──────────────────────────────────────────┘
               │ Server Components
┌──────────────▼──────────────────────────────────────────┐
│              Models (Query Layer)                        │
│  findPosts()   findPostsWithRelations()                 │
│  getRelatedPostsForArtwork()                            │
│  getRelatedPostsForCollection()                         │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Database (Drizzle + libSQL)                 │
│  posts  postsToArtworks  postsToCollections              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Admin Pages                           │
│  /admin/posts (list)  /admin/posts/new  /admin/posts/edit/[slug] │
└──────────────┬──────────────────────────────────────────┘
               │ Client Components (PostForm)
┌──────────────▼──────────────────────────────────────────┐
│              Server Actions                              │
│  src/actions/admin/post.ts (CRUD, relationships)        │
│  src/actions/post.ts (public reads)                     │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Image Upload (existing)                     │
│  /api/upload → Cloudflare R2                            │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

- **`posts` table**: Stores post content, metadata, type, and publication state
- **`postsToArtworks` junction table**: Many-to-many linking posts to artworks
- **`postsToCollections` junction table**: Many-to-many linking posts to collections
- **`src/models/post.ts`**: Query layer with filter-based lookups and relationship loading
- **`src/actions/admin/post.ts`**: Admin CRUD server actions with auth guards
- **`src/actions/post.ts`**: Public read-only server actions for published posts
- **`src/components/PostForm.tsx`**: Client-side form for creating/editing posts
- **`src/components/PostCard.tsx`**: Reusable card for post listings and related posts sections
- **`src/app/posts/`**: Public listing and detail pages
- **`src/app/admin/posts/`**: Admin listing, create, and edit pages

### Integration Points

- **Existing artworks/collections**: Bidirectional relationships via junction tables. Related posts rendered on artwork and collection detail pages.
- **Existing image upload**: Reuse `ImageUpload` component and `/api/upload` route for cover images.
- **Existing auth**: Admin layout's `requireAdmin()` protects all `/admin/posts/*` routes automatically.
- **Existing navigation**: Add "Posts" link to `Navigation.tsx` and admin sidebar.
- **Markdown rendering**: New dependency for rendering post body content.

## Technology Stack

### Markdown Rendering

**Chosen**: `react-markdown` + `remark-gfm` + `rehype-sanitize`
**Alternatives Considered**: `marked` (no React integration), `next-mdx-remote` (heavier, designed for MDX component embedding), plain `remark`/`rehype` pipeline (lower-level)
**Rationale**: `react-markdown` renders directly to React components, integrates naturally with Next.js server components, and supports plugins for GFM (tables, strikethrough) and sanitization. Lightweight and well-maintained.
**Constitution Alignment**: Simplicity over flexibility - this is the simplest approach that meets the Markdown rendering requirement without introducing a complex content pipeline.

### Scheduled Publishing

**Chosen**: Request-time evaluation using separate `publishedAt` and `scheduledAt` timestamp fields
**Alternatives Considered**: Background cron job, Cloudflare Workers scheduled events
**Rationale**: Per `research.md` and `data-model.md`, we use two separate fields: `scheduledAt` controls when a post should become publicly visible (future scheduling), and `publishedAt` records when it was actually published. Public queries filter posts with `WHERE (publishedAt IS NOT NULL AND publishedAt <= now()) OR (scheduledAt IS NOT NULL AND scheduledAt <= now())` so scheduled posts automatically become visible at request time without additional infrastructure.
**Constitution Alignment**: Simplicity - no background job infrastructure, just timestamp fields and request-time WHERE clauses.

### Slug Generation

**Chosen**: Utility function using existing codebase patterns (lowercase, hyphenated, from title)
**Rationale**: Follows the same slug pattern used for artworks and collections. Auto-generated from title with manual override in the form.

## Implementation Strategy

### Phase 1: Data Foundation

- Create Drizzle schema for `posts`, `postsToArtworks`, `postsToCollections`
- Generate and run database migration
- Create model layer (`src/models/post.ts`) with filter-based queries
- Create server actions for admin CRUD and public reads

### Phase 2: Admin UI

- Create admin post list page (`/admin/posts`)
- Create PostForm component with Markdown editor, type selector, artwork/collection selectors, cover image upload, publish controls
- Create new/edit pages wired to server actions
- Add "Posts" to admin sidebar navigation

### Phase 3: Public Pages

- Install and configure `react-markdown` with sanitization
- Create public `/posts` listing page with type filtering
- Create `/posts/[slug]` detail page with Markdown rendering and linked artworks gallery
- Add "Posts" to main site navigation
- Generate Open Graph metadata for social sharing

### Phase 4: Bidirectional Integration

- Add "Related Posts" section to existing artwork detail page (`/artworks/[slug]`)
- Add "Related Posts" section to existing collection detail page (`/collections/[slug]`)
- Create `PostCard` component for reuse across related posts sections and listing

## Security Considerations

- **Admin auth**: All write operations use `guardAdmin()`. Admin pages protected by `requireAdmin()` in admin layout.
- **Draft/scheduled post protection**: Public queries filter by `(publishedAt IS NOT NULL AND publishedAt <= now()) OR (scheduledAt IS NOT NULL AND scheduledAt <= now())`. No public URL exists for unpublished content.
- **XSS prevention**: Markdown output sanitized via `rehype-sanitize` before rendering. No raw HTML injection possible.
- **Slug validation**: Slugs validated and sanitized on creation to prevent path traversal or injection.

## Performance Strategy

- **Server-side rendering**: All public pages are server components with `export const dynamic = 'force-dynamic'` (matching existing pattern).
- **Lazy loading**: Artwork images in the linked gallery use `loading="lazy"` on `<Image>` components.
- **Efficient queries**: Related posts queries use indexed foreign keys on junction tables. Post listing queries include only necessary fields.
- **LCP target**: Post listing page targets LCP under 2.5s by keeping initial payload minimal and lazy-loading images below the fold.

## Testing Strategy

- **E2E (Playwright)**: Critical admin flows (create post, edit post, publish/unpublish, link artworks). Public flows (browse posts, view post detail, verify related posts on artwork pages).
- **Fixtures**: Add blog post seed data to existing fixture system for consistent test state.
- **Follow existing patterns**: Tests structured like existing artwork/collection E2E tests.

## Deployment Considerations

- **Migration**: Drizzle migration must run before deployment. New tables only, no modifications to existing tables.
- **Dependencies**: `react-markdown`, `remark-gfm`, and `rehype-sanitize` are lightweight and Cloudflare Workers compatible (no Node.js-specific APIs).
- **Rollback**: Feature is additive only. Removing it requires dropping new tables and removing new routes - no existing functionality is modified (except navigation links and related posts sections on existing pages).
