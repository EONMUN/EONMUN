# Database and Testing Setup

This project uses Drizzle ORM for database management and Vitest for testing.

## Database

### Schema
The database schema is defined in `src/db/schema.ts` and includes:
- **Collections**: Store collections of artworks
- **Artworks**: Store individual artworks with references to collections

### Database Location
- Development: `data/eonmun.db`
- Tests: In-memory SQLite database

### Available Commands
```bash
# Generate migrations from schema
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema directly to database (for development)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in UI mode
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

### Test Structure
- Integration tests are located in `tests/integration/`
- Tests use in-memory SQLite databases for isolation
- Each test suite creates fresh database instances

## Models

The `src/models/collections.ts` file provides helper functions for working with collections:
- `getAllCollections()` - Get all collections
- `getCollectionById(id)` - Get a specific collection
- `getCollectionWithArtworks(id)` - Get a collection with its artworks
- `getArtworksByCollectionId(id)` - Get artworks for a collection
- `createCollection(data)` - Create a new collection
- `updateCollection(id, data)` - Update a collection
- `deleteCollection(id)` - Delete a collection
