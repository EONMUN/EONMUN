# Fixtures

Rails-style fixtures for seeding the database with sample data.

## Overview

Fixtures are declarative JSON files that define sample data for development and testing. This approach provides:

- **Version controlled data** - Fixtures are committed to git
- **Easy to edit** - Simple JSON format, no code required
- **Automatic loading** - Fixtures load automatically on app startup in development
- **Idempotent** - Each load clears and recreates data
- **Type safe** - Validated by TypeScript loader

## Directory Structure

```
fixtures/
├── collections.json    # Collection fixtures
├── artworks.json      # Artwork fixtures
└── README.md          # This file
```

## Fixture Format

### Collections

```json
[
  {
    "name": "Collection Name",
    "slug": "collection-slug",
    "description": "Optional description",
    "publishedAt": "2024-01-01T00:00:00Z",
    "locale": "en"
  }
]
```

### Artworks

```json
[
  {
    "title": "Artwork Title",
    "slug": "artwork-slug",
    "description": "Optional description",
    "artist": "Artist Name",
    "year": 2023,
    "price": 100000,
    "images": [
      "/artworks/slug/image1.webp",
      "/artworks/slug/image2.jpeg"
    ],
    "collectionSlug": "collection-slug",
    "publishedAt": "2024-01-01T00:00:00Z",
    "locale": "en"
  }
]
```

**Note**: Images should be placed in `/public/artworks/{slug}/` directory.

## Usage

### Automatic Loading (Development)

Fixtures automatically load when the app starts in development mode:

```bash
npm run dev
```

Output:
```
🚀 Loading fixtures...
🗑️  Clearing existing data...
✅ Data cleared

📦 Loading collections...
  ✓ Created collection: Featured Artworks (featured)

🖼️  Loading artworks...
  ✓ Created artwork: Soleil et Montagnes (soleil-et-montagnes) 4 images
  ✓ Created artwork: Quiescent Citadel (quiescent-citadel) 1 images

✨ Fixtures loaded successfully!
```

### Manual Loading

To manually reload fixtures:

```bash
npm run db:fixtures:load
```

### Tests

Fixtures do **not** load during test runs. Tests use factories to create data as needed.

## How It Works

1. **Database Initialization** (`src/lib/db/index.ts`):
   - Creates in-memory database
   - Runs migrations to create tables
   - Loads fixtures (development only)

2. **Fixtures Loader** (`src/database/fixtures/load.ts`):
   - Reads JSON fixture files
   - Clears existing data
   - Inserts collections (for foreign keys)
   - Inserts artworks with collection relationships
   - Processes images into JSON structure

3. **Environment Detection**:
   - **Development**: Fixtures load automatically
   - **Production**: Fixtures do not load (uses Turso database)
   - **Test**: Fixtures do not load (uses factories)

## Adding New Fixtures

1. Edit `collections.json` or `artworks.json`
2. Add images to `/public/artworks/{slug}/`
3. Restart dev server or run `npm run db:fixtures:load`

## Tips

- Use unique slugs to avoid conflicts
- Keep fixture data minimal but representative
- Use realistic data for better development experience
- Price is in cents (e.g., 100000 = $1,000.00)
- Images paths should start with `/artworks/`
