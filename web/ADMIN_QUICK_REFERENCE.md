# Admin Panel - Quick Reference

## Routes

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard with links to management pages |
| `/admin/artworks` | List all artworks |
| `/admin/artworks/new` | Create new artwork |
| `/admin/artworks/[documentId]` | Edit artwork |
| `/admin/collections` | List all collections |
| `/admin/collections/new` | Create new collection |
| `/admin/collections/[documentId]` | Edit collection |

## Server Actions

### Artworks
```typescript
import { 
  getAllArtworks, 
  getArtworkById, 
  createArtwork, 
  updateArtwork, 
  deleteArtwork 
} from '@/actions/artwork';

// Get all artworks
const { data, meta } = await getAllArtworks();

// Get artwork by ID
const artwork = await getArtworkById(documentId);

// Create artwork
const result = await createArtwork({
  title: 'My Artwork',
  description: 'Description here',
  year: 2024
});

// Update artwork
const result = await updateArtwork(documentId, {
  title: 'Updated Title'
});

// Delete artwork
const result = await deleteArtwork(documentId);
```

### Collections
```typescript
import { 
  getAllCollections, 
  getCollectionById, 
  createCollection, 
  updateCollection, 
  deleteCollection 
} from '@/actions/collection';

// Get all collections
const { data, meta } = await getAllCollections();

// Get collection by ID
const collection = await getCollectionById(documentId);

// Create collection
const result = await createCollection({
  name: 'My Collection',
  artworks: ['artwork-id-1', 'artwork-id-2']
});

// Update collection
const result = await updateCollection(documentId, {
  name: 'Updated Name',
  artworks: ['artwork-id-1']
});

// Delete collection
const result = await deleteCollection(documentId);
```

## Form Components

### ArtworkForm
```tsx
import ArtworkForm from '@/components/ArtworkForm';

// Create mode
<ArtworkForm />

// Edit mode
<ArtworkForm artwork={artwork} />
```

### CollectionForm
```tsx
import CollectionForm from '@/components/CollectionForm';

// Create mode
<CollectionForm />

// Edit mode
<CollectionForm collection={collection} />
```

## Environment Variables

```bash
# Required for production
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_API_TOKEN=your-api-token-here

# For local development (no token needed)
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_API_TOKEN=
```

## Development

```bash
# Start services
make up

# Access admin panel
# Navigate to: http://localhost:3002/admin
```

## Testing Checklist

- [ ] Navigate to `/admin` dashboard
- [ ] List artworks at `/admin/artworks`
- [ ] Create new artwork
- [ ] Edit existing artwork
- [ ] Delete artwork (with confirmation)
- [ ] List collections at `/admin/collections`
- [ ] Create new collection with artwork selection
- [ ] Edit existing collection
- [ ] Delete collection (with confirmation)
- [ ] Verify cache invalidation (changes appear immediately)
- [ ] Check error handling (submit invalid data)
- [ ] Verify empty states
- [ ] Test on mobile devices

## Common Tasks

### Add a new field to artwork
1. Update Strapi schema: `strapi/src/api/artwork/content-types/artwork/schema.json`
2. Update TypeScript interface: `web/src/lib/strapi.ts`
3. Add field to form: `web/src/components/ArtworkForm.tsx`
4. Update list view if needed: `web/src/app/admin/artworks/page.tsx`

### Add authentication
Currently, the admin panel has no authentication. To add:
1. Implement authentication middleware
2. Protect `/admin/*` routes
3. Add login page and session management
4. Update admin layout with logout button

### Customize styling
- Admin layout: `web/src/app/admin/layout.tsx`
- Forms use Tailwind CSS classes
- Modify form components for consistent styling

## Troubleshooting

### Build fails with Strapi connection error
- This is expected if Strapi is not running during build
- Admin pages are dynamic and don't require Strapi at build time
- The error is from other pages (homepage, sitemap) that pre-render

### Changes not appearing
- Check that cache revalidation is working
- Clear browser cache
- Restart dev server

### API errors
- Verify Strapi is running on correct port
- Check environment variables
- Ensure Strapi has public permissions enabled (local dev)
