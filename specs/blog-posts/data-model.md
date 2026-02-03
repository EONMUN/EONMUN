# Blog Posts Data Model

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   artworks   │◄──────│ postsToArtworks   │──────►│    posts     │
│              │       │ (junction)        │       │              │
│ id (PK)      │       │ postId (FK, PK)   │       │ id (PK)      │
│ slug         │       │ artworkId (FK, PK)│       │ slug (UNIQUE) │
│ title        │       └──────────────────┘       │ title        │
│ publishedAt  │                                   │ body         │
│ ...          │                                   │ excerpt      │
└──────────────┘       ┌──────────────────┐       │ postType     │
                       │postsToCollections │       │ coverImageUrl│
┌──────────────┐       │ (junction)        │       │ publishedAt  │
│ collections  │◄──────│ postId (FK, PK)   │──────►│ scheduledAt  │
│              │       │collectionId(FK,PK)│       │ locale       │
│ id (PK)      │       └──────────────────┘       │ createdAt    │
│ slug         │                                   │ updatedAt    │
│ name         │                                   └──────────────┘
│ ...          │
└──────────────┘
```

## Entities

### posts

| Field         | Type    | Constraints                 | Description                                                   |
| ------------- | ------- | --------------------------- | ------------------------------------------------------------- |
| id            | integer | PK, auto-increment          | Unique identifier                                             |
| slug          | text    | UNIQUE, NOT NULL, indexed   | URL-friendly identifier                                       |
| title         | text    | NOT NULL                    | Post title                                                    |
| body          | text    | NOT NULL, default ''        | Markdown content                                              |
| excerpt       | text    | nullable                    | Short summary for listings and OG description                 |
| postType      | text    | NOT NULL, default 'general' | One of: announcement, educational, behind_the_scenes, general |
| coverImageUrl | text    | nullable                    | URL to cover image on R2                                      |
| publishedAt   | integer | nullable                    | Unix timestamp when published (null = draft)                  |
| scheduledAt   | integer | nullable                    | Unix timestamp for scheduled future publication               |
| locale        | text    | NOT NULL, default 'en'      | Content locale (consistency with existing schema)             |
| createdAt     | integer | NOT NULL                    | Unix timestamp of creation                                    |
| updatedAt     | integer | NOT NULL                    | Unix timestamp of last update                                 |

**Indexes:**

- `posts_slug_unique` - Unique index on `slug` for URL lookups
- `posts_published_at_idx` - Index on `publishedAt` for filtering published posts
- `posts_post_type_idx` - Index on `postType` for type filtering

**Notes:**

- `publishedAt` follows the existing artwork pattern: `null` means draft, a timestamp means published
- `scheduledAt` is separate from `publishedAt`. When `scheduledAt` is set and `publishedAt` is null, the post is "scheduled". At request time, if `scheduledAt <= now`, the system treats it as published.
- Timestamp fields use integer (Unix epoch) matching the existing libSQL/Drizzle pattern in the codebase

### postsToArtworks

| Field     | Type    | Constraints          | Description          |
| --------- | ------- | -------------------- | -------------------- |
| postId    | integer | PK, FK → posts.id    | Reference to post    |
| artworkId | integer | PK, FK → artworks.id | Reference to artwork |

**Constraints:**

- Composite primary key: `(postId, artworkId)`
- Cascade delete on both foreign keys (deleting a post or artwork removes the association)

### postsToCollections

| Field        | Type    | Constraints             | Description             |
| ------------ | ------- | ----------------------- | ----------------------- |
| postId       | integer | PK, FK → posts.id       | Reference to post       |
| collectionId | integer | PK, FK → collections.id | Reference to collection |

**Constraints:**

- Composite primary key: `(postId, collectionId)`
- Cascade delete on both foreign keys

## Publication State Logic

A post's visibility is determined by evaluating these fields at query time:

| publishedAt | scheduledAt | State             | Public Visible                       |
| ----------- | ----------- | ----------------- | ------------------------------------ |
| null        | null        | Draft             | No                                   |
| null        | future      | Scheduled         | No                                   |
| null        | past        | Scheduled (ready) | Treated as published at request time |
| timestamp   | any         | Published         | Yes                                  |

**Public query filter:**
Posts are visible when `publishedAt IS NOT NULL` OR (`scheduledAt IS NOT NULL AND scheduledAt <= now`).

When a scheduled post's time arrives and a public query evaluates it, the action/model layer sets `publishedAt = scheduledAt` to permanently mark it as published (avoiding repeated evaluation).

## Migrations

This feature introduces three new tables with no modifications to existing tables.

**Migration strategy:**

1. Run `drizzle-kit generate` after schema file creation to generate migration SQL
2. Run `drizzle-kit migrate` to apply
3. Migration is fully additive - safe to run on production with no downtime
4. Rollback: drop `postsToCollections`, `postsToArtworks`, `posts` tables in that order

**Seed data:**
Add sample posts to `src/database/fixtures/` for development and testing:

- 1 published announcement post linked to an artwork
- 1 published educational post linked to a collection
- 1 draft behind-the-scenes post
- 1 scheduled general post (future date)
