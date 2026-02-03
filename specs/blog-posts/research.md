# Blog Posts Research

## Technology Evaluations

### Markdown Rendering Libraries

| Library                   | Pros                                                     | Cons                                                                         | Verdict                                    |
| ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| `react-markdown`          | React-native rendering, plugin ecosystem, SSR compatible | Slightly larger bundle than raw parsers                                      | **Selected**                               |
| `marked`                  | Fast, small, mature                                      | Returns HTML string (requires dangerouslySetInnerHTML), no React integration | Rejected                                   |
| `next-mdx-remote`         | Full MDX support, custom components                      | Heavier, designed for MDX not plain Markdown, overkill for this use case     | Rejected                                   |
| `remark` + `rehype` (raw) | Maximum flexibility, full plugin ecosystem               | Low-level, requires assembling pipeline manually                             | Used indirectly via react-markdown plugins |

**Decision**: `react-markdown` with `remark-gfm` (GitHub Flavored Markdown) and `rehype-sanitize` (XSS prevention). This gives us tables, strikethrough, and task lists while keeping output safe.

### Markdown Editor for Admin

| Approach                      | Pros                                                                   | Cons                                                                        | Verdict              |
| ----------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------- |
| Plain textarea + preview      | Simple, no extra dependencies, consistent with existing admin patterns | No syntax highlighting, no toolbar                                          | **Selected for MVP** |
| CodeMirror with Markdown mode | Syntax highlighting, keyboard shortcuts                                | Additional dependency, complexity                                           | Future enhancement   |
| TipTap / ProseMirror WYSIWYG  | Rich editing experience                                                | Heavy dependency, complex state management, diverges from existing patterns | Out of scope         |

**Decision**: Plain textarea with a side-by-side or toggle preview using `react-markdown`. Matches the simplicity principle in the constitution and the existing admin form patterns (which use basic inputs, not rich editors).

### Scheduled Publishing Approaches

| Approach                 | Pros                                    | Cons                                                               | Verdict        |
| ------------------------ | --------------------------------------- | ------------------------------------------------------------------ | -------------- |
| Request-time evaluation  | Zero infrastructure, simple query logic | Post doesn't appear until someone visits                           | **Selected**   |
| Cloudflare Cron Triggers | Exact timing, runs independently        | Requires additional worker configuration, more complexity          | Rejected       |
| Database trigger/event   | Automatic, precise                      | libSQL/SQLite doesn't support triggers in the same way as Postgres | Not applicable |

**Decision**: Request-time evaluation. When a public query runs, it checks `publishedAt IS NOT NULL OR (scheduledAt IS NOT NULL AND scheduledAt <= now())`. On first match of a scheduled post, the model layer promotes it by setting `publishedAt = scheduledAt`. This is a one-time write that prevents repeated evaluation.

## Design Decisions

### 1. Separate `publishedAt` and `scheduledAt` fields

Rather than overloading a single `publishedAt` field with future dates, we use two separate fields. This makes the state machine explicit:

- `publishedAt = null, scheduledAt = null` → Draft
- `publishedAt = null, scheduledAt = future` → Scheduled
- `publishedAt = timestamp` → Published

This avoids ambiguity and makes admin status display straightforward.

### 2. Junction tables for post-artwork and post-collection relationships

Following the existing `artworksToCollections` pattern. Composite primary keys, cascade deletes on both sides. No additional metadata on the junction tables (unlike `artworksToCollections` which has `isDefaultForCollection`).

### 3. Cover image as URL field, not separate table

Unlike artworks (which have multiple images via `artworkImages` table), posts have at most one cover image. A simple `coverImageUrl` text field on the `posts` table is sufficient. The existing `ImageUpload` component and `/api/upload` route handle the upload; we just store the resulting URL.

### 4. Post types as text field, not separate table

Four fixed types (announcement, educational, behind_the_scenes, general) stored as a text field with application-level validation. A separate `post_types` table would be over-engineering for a fixed set of values that the artist controls. If types need to become dynamic in the future, migration to a lookup table is straightforward.

### 5. No separate slug redirect table

The spec mentions that changing a published post's slug should "ideally redirect or return 404." For MVP, we return 404 for old slugs. A redirect table or slug history would add complexity with minimal benefit given the low volume of slug changes expected.

## Codebase Pattern Alignment

The implementation follows these existing patterns discovered during codebase analysis:

- **Schema**: Auto-increment ID + unique slug, `publishedAt` for visibility, `createdAt`/`updatedAt` timestamps, `locale` field
- **Models**: Filter objects with optional array fields, `findX()` and `findXWithRelations()` pattern, parallel relationship loading with Promise.all
- **Actions**: `guardAdmin()` at top, `{ success, data }` / `{ success: false, error }` return types, `revalidatePath()` for cache invalidation
- **Admin UI**: Server component pages wrapping client form components, responsive mobile cards + desktop table, existing ImageUpload component reuse
- **Public UI**: `export const dynamic = 'force-dynamic'`, `generateMetadata()` for SEO, `notFound()` for missing items, card components for listings

## Dependencies

### New npm packages

| Package           | Version | Purpose                                                  | Size  |
| ----------------- | ------- | -------------------------------------------------------- | ----- |
| `react-markdown`  | ^9.x    | Render Markdown to React components                      | ~30KB |
| `remark-gfm`      | ^4.x    | GitHub Flavored Markdown support (tables, strikethrough) | ~5KB  |
| `rehype-sanitize` | ^6.x    | Sanitize HTML output to prevent XSS                      | ~10KB |

Total new dependency footprint: ~45KB (reasonable for the functionality provided).

### Existing dependencies leveraged

- Drizzle ORM (schema, queries, migrations)
- Next.js App Router (pages, server components, server actions)
- NextAuth (admin authentication)
- Cloudflare R2 (image storage via existing upload route)
- Tailwind CSS (styling)

## References

- [react-markdown documentation](https://github.com/remarkjs/react-markdown)
- [Drizzle ORM SQLite schema reference](https://orm.drizzle.team/docs/column-types/sqlite)
- [Next.js App Router Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Existing codebase patterns in `src/database/schema.artworks.ts`, `src/models/artwork.ts`, `src/actions/admin/artwork.ts`
