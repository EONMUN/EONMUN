# Admin Panel Structure

```
/admin (Admin Dashboard)
├── Layout: Navigation header with Artworks and Collections links
└── Page: Cards for Artworks and Collections management

/admin/artworks (Artworks Management)
├── List View
│   ├── Table with artwork details (thumbnail, title, year, status)
│   ├── Edit and View links for each artwork
│   └── New Artwork button
├── /new (Create Artwork)
│   └── Form: Title*, Description, Year
└── /[documentId] (Edit Artwork)
    └── Form: Title*, Description, Year + Delete button

/admin/collections (Collections Management)
├── List View
│   ├── Table with collection details (name, artwork count, status)
│   ├── Edit and View links for each collection
│   └── New Collection button
├── /new (Create Collection)
│   └── Form: Name*, Artwork selection (checkbox list with thumbnails)
└── /[documentId] (Edit Collection)
    └── Form: Name*, Artwork selection + Delete button
```

## Data Flow

```
User Action (Form Submit)
    ↓
Client Component (ArtworkForm / CollectionForm)
    ↓
Server Action (createArtwork / updateArtwork / etc.)
    ↓
Strapi API Client (artworkAPI / collectionAPI)
    ↓
Strapi CMS (HTTP API)
    ↓
Database (SQLite)
    ↓
← Response with data or error
    ↓
Cache Revalidation (revalidatePath)
    ↓
Router Redirect + Refresh
    ↓
Updated List View
```

## Key Components

### Forms (Client Components)
- **ArtworkForm.tsx**
  - Props: `artwork?: Artwork`
  - State: formData (title, description, year)
  - Actions: Create, Update, Delete
  - Validation: Title required, year 0-2050

- **CollectionForm.tsx**
  - Props: `collection?: Collection`
  - State: formData (name, artworks[])
  - Loads: Available artworks on mount
  - Actions: Create, Update, Delete
  - Features: Interactive checkbox list with artwork preview

### Pages (Server Components)
- **List Pages**: Fetch and display all items with table layout
- **Create Pages**: Render empty form
- **Edit Pages**: Fetch item by documentId and render pre-filled form

### Server Actions
- **artwork.ts**: getAllArtworks, getArtworkById, createArtwork, updateArtwork, deleteArtwork
- **collection.ts**: getAllCollections, getCollectionById, createCollection, updateCollection, deleteCollection

## Features

✅ CRUD operations for artworks
✅ CRUD operations for collections
✅ Artwork-Collection relationships
✅ Form validation
✅ Error handling
✅ Loading states
✅ Confirmation dialogs for deletions
✅ Cache revalidation
✅ Responsive design
✅ Empty states
✅ Success/error feedback

## Security

✅ Server actions only (no client-side API calls)
✅ API token not exposed to client
✅ No CodeQL security alerts
✅ Input validation

## Performance

✅ Set-based operations for artwork selection
✅ Automatic cache revalidation
✅ Optimized re-renders
