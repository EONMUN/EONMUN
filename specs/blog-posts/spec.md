# Blog Posts Specification

## Overview

### Problem Statement

EONMUN currently has no way to publish written content alongside the visual portfolio. The artist wants to share announcements about new art and gallery showings, educational content about techniques, and behind-the-scenes insights - all linked to specific artworks and collections. Without a content hub on the EONMUN platform, there is no canonical source to share from, and no way to drive social media traffic back to the site.

### Business Value

- Establishes EONMUN as the primary content hub (create here first, share outward to social media)
- Drives organic traffic through SEO-friendly written content
- Increases engagement by connecting written stories to specific artworks and collections
- Supports sales by contextualizing art pieces with announcements and educational content
- Grows the EONMUN following by giving visitors a reason to return

### Target Users

- **Artist (Admin)**: Creates and manages all blog posts, links them to artworks/collections, controls publication timing
- **Visitor / Collector**: Reads posts to discover art context, learn about techniques, and stay informed about showings and releases
- **Social Media Follower**: Arrives from external platforms, reads content, explores linked artworks, potentially makes purchases

## User Stories

### US-1: Create a Blog Post

**As the** artist
**I want to** create a blog post with a title, body content in Markdown, and a post type
**So that** I can publish written content on my platform

**Acceptance Criteria:**

- [ ] Admin can create a new post with title, slug, body (Markdown), and excerpt
- [ ] Admin can select a post type: Announcement, Educational, Behind the Scenes, or General
- [ ] Admin can preview the rendered Markdown before publishing
- [ ] Post body supports standard Markdown formatting (headings, bold, italic, links, images, lists, code blocks)
- [ ] Slug is auto-generated from the title but can be manually edited

**Edge Cases:**

- Duplicate slugs: System prevents duplicate slugs and suggests alternatives
- Empty body: Post can be saved as draft with empty body but cannot be published

### US-2: Link Posts to Artworks and Collections

**As the** artist
**I want to** link blog posts to specific artworks and collections
**So that** related art pieces appear at the bottom of the post and related posts appear on artwork/collection pages

**Acceptance Criteria:**

- [ ] Admin can associate one or more artworks with a post
- [ ] Admin can associate one or more collections with a post
- [ ] Linked artworks and collections appear in a visual section at the bottom of the published post
- [ ] The artwork/collection links are bidirectional: related posts also appear on artwork and collection detail pages
- [ ] Admin can reference artworks inline in Markdown by slug, rendering as a styled link

**Edge Cases:**

- Linked artwork is unpublished: The link is hidden from public view but preserved in admin
- Linked artwork is deleted: The association is removed; post remains intact
- Post links to both an artwork and the collection containing it: No duplicate display

### US-3: Manage Post Visibility

**As the** artist
**I want to** save posts as drafts, publish them, or schedule them for future publication
**So that** I can prepare content in advance and control when it goes live

**Acceptance Criteria:**

- [ ] Admin can save a post as a draft (not visible to public)
- [ ] Admin can publish a post immediately (visible to public)
- [ ] Admin can set a scheduled publish date/time for future publication
- [ ] Scheduled posts become visible when a visitor loads the page after the scheduled time (request-time evaluation, no background job)
- [ ] Admin can see the current status of each post (Draft, Scheduled, Published) in the post list
- [ ] Admin can unpublish a previously published post (revert to draft)

**Edge Cases:**

- Scheduled date in the past: Treated as immediate publication
- Admin edits a scheduled post: Scheduled date is preserved unless explicitly changed

### US-4: Browse Posts on the Public Site

**As a** visitor
**I want to** browse all published posts on a dedicated posts page
**So that** I can discover the artist's written content

**Acceptance Criteria:**

- [ ] A public `/posts` page lists all published posts, newest first, accessible from the main site navigation
- [ ] Each post in the listing shows: title, excerpt, post type, publication date, and a cover image if available
- [ ] Visitors can filter posts by type (Announcement, Educational, Behind the Scenes, General)
- [ ] Each post has its own detail page at `/posts/[slug]`
- [ ] Post detail page renders the full Markdown body with proper formatting
- [ ] Linked artworks and collections appear as an image grid with titles at the bottom of the post, clicking navigates to the artwork/collection page

**Edge Cases:**

- No published posts: Page shows an appropriate empty state
- Post with no excerpt: Listing shows a truncated version of the body

### US-5: Discover Related Posts on Artwork and Collection Pages

**As a** visitor viewing an artwork or collection
**I want to** see related blog posts at the bottom of the page
**So that** I can learn more about the context, story, or techniques behind the art

**Acceptance Criteria:**

- [ ] Artwork detail pages show a "Related Posts" section at the bottom with posts linked to that artwork
- [ ] Collection detail pages show a "Related Posts" section at the bottom with posts linked to that collection
- [ ] Related posts display as cards with title, excerpt, type, and date
- [ ] The related posts section is only shown if there are related posts (no empty section)

**Edge Cases:**

- Artwork linked to many posts: Show a reasonable number (e.g., most recent) with option to view all
- Draft posts linked to an artwork: Not shown in the public related posts section

### US-6: Edit and Delete Posts

**As the** artist
**I want to** edit existing posts and delete posts I no longer want
**So that** I can keep my content current and remove outdated material

**Acceptance Criteria:**

- [ ] Admin can edit all fields of an existing post (title, body, type, excerpt, slug, linked artworks/collections, publish status, scheduled date)
- [ ] Admin can delete a post with a confirmation step
- [ ] Deleting a post removes all associations with artworks and collections
- [ ] The admin post list supports searching and filtering by status and type

**Edge Cases:**

- Editing a published post's slug: Old URL should ideally redirect or return 404 (not serve stale content)
- Deleting a post that's linked from external social media: Returns 404

### US-7: Post Cover Images

**As the** artist
**I want to** optionally set a cover image for a blog post
**So that** posts look visually appealing in listings and when shared on social media

**Acceptance Criteria:**

- [ ] Admin can upload a cover image for a post or select from existing artwork images
- [ ] Cover image is displayed in the post listing on `/posts`
- [ ] Cover image is used as the Open Graph image when the post URL is shared on social media
- [ ] If no cover image is set and the post links to artworks, the first linked artwork's image may be used as fallback

**Edge Cases:**

- No cover image and no linked artworks: Use a default site OG image

## Requirements

### Functional Requirements

| ID    | Requirement                                                       | Priority    | Notes                             |
| ----- | ----------------------------------------------------------------- | ----------- | --------------------------------- |
| FR-1  | CRUD operations for blog posts in admin                           | Must Have   |                                   |
| FR-2  | Post types: Announcement, Educational, Behind the Scenes, General | Must Have   |                                   |
| FR-3  | Markdown body with rendered preview                               | Must Have   |                                   |
| FR-4  | Link posts to artworks (many-to-many)                             | Must Have   |                                   |
| FR-5  | Link posts to collections (many-to-many)                          | Must Have   |                                   |
| FR-6  | Published/Draft toggle                                            | Must Have   |                                   |
| FR-7  | Scheduled publishing with future date/time                        | Should Have |                                   |
| FR-8  | Public `/posts` listing page with type filtering                  | Must Have   |                                   |
| FR-9  | Public `/posts/[slug]` detail page with rendered Markdown         | Must Have   |                                   |
| FR-10 | Related posts section on artwork detail pages                     | Must Have   |                                   |
| FR-11 | Related posts section on collection detail pages                  | Must Have   |                                   |
| FR-12 | Linked artworks/collections gallery at bottom of post detail      | Must Have   |                                   |
| FR-13 | Cover image upload or selection from linked artwork images        | Should Have |                                   |
| FR-14 | Inline artwork references in Markdown (by slug)                   | Should Have | Renders as styled link to artwork |
| FR-15 | Open Graph metadata for social media sharing                      | Should Have | Title, excerpt, cover image       |
| FR-16 | Admin post list with search, filter by status and type            | Must Have   |                                   |

### Non-Functional Requirements

#### Performance

- Post listing page should load within acceptable thresholds for SEO (LCP under 2.5s)
- Markdown rendering should not block page load
- Image-heavy linked artwork galleries should use lazy loading

#### Security

- Only authenticated admin users can create, edit, or delete posts
- Draft and scheduled posts are not accessible via public URLs
- Markdown rendering must sanitize output to prevent XSS

#### Accessibility

- Post content must be navigable with keyboard
- Images must have alt text
- Proper heading hierarchy in rendered Markdown
- Related posts section must be accessible to screen readers

## Scope

### In Scope

- Blog post CRUD in admin
- Four post types (Announcement, Educational, Behind the Scenes, General)
- Markdown editing with preview
- Linking posts to artworks and collections (many-to-many)
- Published/Draft status with scheduled publishing
- Public posts listing page with filtering
- Public post detail pages
- Related posts on artwork and collection pages
- Linked art gallery at bottom of post pages
- Cover images for posts
- Basic Open Graph metadata for social sharing

### Out of Scope

- Comments or reader interaction on posts
- RSS feed (future enhancement)
- Email newsletter integration (future enhancement)
- Automatic cross-posting to social media platforms (manual sharing only for now)
- Post categories or tags beyond the four defined post types
- Multi-author support (single author: EONMUN)
- Post versioning or revision history
- Analytics or view counts on posts

### Assumptions

- The existing admin authentication system will protect blog post admin routes
- The existing image upload infrastructure (R2) will be used for cover images
- The existing artwork and collection detail pages can be extended with a related posts section
- The admin UI will follow the same patterns as existing artwork/collection admin pages

### Dependencies

- Existing artwork and collection data models and detail pages
- Existing admin authentication and layout
- Existing image upload and storage (Cloudflare R2)

## Clarifications

### 2026-02-02 Clarification Session

**Q1: Should the /posts page be in the main site navigation?**
A: Yes, add "Posts" to the main site navigation bar alongside existing items (Artworks, Collections, Store, etc.).
Impact: Updated US-4 to specify navigation placement. The posts page is a first-class section of the site, not a hidden feature.

**Q2: What is the desired URL structure?**
A: `/posts/[slug]` - consistent with the page name.
Impact: Confirmed throughout spec. All references use `/posts` and `/posts/[slug]`.

**Q3: For scheduled publishing, is request-time checking sufficient?**
A: Yes, request-time check is sufficient. When a visitor loads a page, the system checks if the scheduled date has passed and displays the post if so. No background job infrastructure needed.
Impact: Updated US-3 to clarify that scheduled publishing uses request-time evaluation. Posts appear as soon as someone visits after the scheduled time, with no guaranteed exact-second publishing.

**Q4: How should the linked artworks gallery display at the bottom of posts?**
A: Image grid with titles. Each artwork shows its image and title; clicking navigates to the artwork detail page.
Impact: Updated US-2 and US-4 to specify the gallery is an image grid with titles, not a carousel or card layout.

## Open Questions

None - all questions resolved.

## Acceptance Checklist

### User Stories

- [x] All stories have 3+ acceptance criteria
- [x] All criteria are testable/measurable
- [x] Edge cases are documented for each story

### Requirements

- [x] Performance thresholds defined (LCP under 2.5s)
- [x] Security requirements are specific (admin auth, draft protection, XSS sanitization)
- [x] Accessibility standards identified (keyboard nav, alt text, heading hierarchy)

### Scope

- [x] In-scope items are detailed
- [x] Out-of-scope items are explicit
- [x] Assumptions are documented

### Completeness

- [x] No open questions remain
- [x] All ambiguities resolved
- [x] Ready for technical planning
