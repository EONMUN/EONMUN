# Artworks CRUD Implementation

This document outlines the complete CRUD (Create, Read, Update, Delete) implementation for the Artworks page using Strapi as the backend.

## Files Created

### 1. Strapi Client Configuration (`src/lib/strapi.ts`)
- Configures the Strapi client with base URL and authentication
- Defines TypeScript interfaces for Artwork data structures
- Implements API functions for all CRUD operations:
  - `getAll()` - Fetch all artworks with pagination and filtering
  - `getById()` - Fetch single artwork by documentId
  - `create()` - Create new artwork
  - `update()` - Update existing artwork
  - `delete()` - Delete artwork
  - `getBySlug()` - Fetch artwork by slug

### 2. Artworks Page (`src/app/artworks/page.tsx`)
- Main page component with full CRUD functionality
- Features:
  - List all artworks with statistics dashboard
  - Create new artworks via modal form
  - Edit existing artworks
  - Delete artworks with confirmation
  - Loading states and error handling
  - Responsive design with Tailwind CSS

### 3. Artwork Form Component (`src/components/ArtworkForm.tsx`)
- Reusable form component for creating and editing artworks
- Features:
  - Form validation (required title, year range validation)
  - Support for all artwork fields (title, description, year, images)
  - Modal interface with proper accessibility
  - Loading states during submission
  - Error handling and display

### 4. Artwork List Component (`src/components/ArtworkList.tsx`)
- Displays artworks in a clean list layout
- Features:
  - Image thumbnails with fallback placeholder
  - Artwork metadata display (creation date, year, image count)
  - Publication status indicators
  - Edit and delete action buttons
  - Empty state when no artworks exist
  - Responsive design

## Environment Setup

### Required Environment Variables (`.env.local`)
```bash
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_API_TOKEN=your_api_token_here
```

### Strapi API Token Setup
1. Start your Strapi backend
2. Go to Strapi Admin Panel -> Settings -> API Tokens
3. Create a new API token with the following permissions:
   - Token name: "Frontend API Token"
   - Token duration: Unlimited (or as needed)
   - Token type: Read-Write
4. Copy the generated token and add it to your `.env.local` file

## Dependencies Added

```bash
# Strapi Client
@strapi/client

# Icons
@heroicons/react
```

## Strapi Content Type

The implementation expects an "artwork" content type in Strapi with the following fields:
- `title` (Text, required)
- `slug` (UID, auto-generated from title)
- `description` (Text, optional)
- `year` (Number, optional, min: 0, max: 2050)
- `images` (Media, multiple files allowed)

## Features Implemented

### ✅ Complete CRUD Operations
- **Create**: Add new artworks with form validation
- **Read**: List all artworks with detailed view
- **Update**: Edit existing artworks
- **Delete**: Remove artworks with confirmation

### ✅ User Interface
- Responsive design with Tailwind CSS
- Modal forms for create/edit operations
- Statistics dashboard showing artwork counts
- Loading states and error handling
- Image thumbnail display with fallbacks

### ✅ Data Management
- TypeScript interfaces for type safety
- Proper error handling and user feedback
- Form validation and sanitization
- Optimistic UI updates

### ✅ Strapi Integration
- Official Strapi client implementation
- Proper API token authentication
- Image population and handling
- Filtering and sorting support

## Usage

1. **Access the Artworks Page**: Navigate to `/artworks`
2. **View Artworks**: See all artworks in a list format with images and metadata
3. **Create Artwork**: Click "Add Artwork" button to open the creation form
4. **Edit Artwork**: Click "Edit" button on any artwork to modify it
5. **Delete Artwork**: Click "Delete" button and confirm to remove an artwork

## Future Enhancements

- [ ] File upload functionality for images
- [ ] Bulk operations (delete multiple, batch edit)
- [ ] Advanced filtering and search
- [ ] Pagination for large datasets
- [ ] Image gallery view
- [ ] Export functionality
- [ ] Drag and drop image reordering

## Notes

- Image upload is currently shown as a placeholder in the form
- The implementation uses the new Strapi v5 client and document system
- All CRUD operations include proper error handling
- The UI is fully responsive and accessible
- TypeScript provides full type safety throughout the application