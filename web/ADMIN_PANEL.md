# Admin Panel Documentation

## Overview

This admin panel provides a web-based interface for managing artworks and collections without needing to access the Strapi CMS admin panel directly.

## Access

The admin panel is accessible at: **`/admin`**

## Features

### Dashboard (`/admin`)
- Central hub with quick access to Artworks and Collections management
- Clean, card-based interface showing available management options

### Artworks Management (`/admin/artworks`)

#### List View
- **URL**: `/admin/artworks`
- **Features**:
  - Table view of all artworks
  - Shows thumbnail, title, slug, year, and publication status
  - Quick links to edit or view each artwork
  - "New Artwork" button to create artworks
  - Empty state with helpful messaging

#### Create Artwork
- **URL**: `/admin/artworks/new`
- **Fields**:
  - Title (required)
  - Description
  - Year (0-2050)
- **Actions**:
  - Save: Creates the artwork and redirects to the list
  - Cancel: Returns to the list without saving

#### Edit Artwork
- **URL**: `/admin/artworks/[documentId]`
- **Features**:
  - Pre-populated form with existing artwork data
  - Update button to save changes
  - Delete button with confirmation dialog
  - Cancel button to discard changes

### Collections Management (`/admin/collections`)

#### List View
- **URL**: `/admin/collections`
- **Features**:
  - Table view of all collections
  - Shows collection name, slug, artwork count, and publication status
  - Quick links to edit or view each collection
  - "New Collection" button
  - Empty state with helpful messaging

#### Create Collection
- **URL**: `/admin/collections/new`
- **Fields**:
  - Name (required)
  - Artworks (checkbox list of all available artworks)
- **Features**:
  - Visual artwork selection with thumbnails
  - Counter showing selected artwork count
- **Actions**:
  - Save: Creates the collection and redirects to the list
  - Cancel: Returns to the list without saving

#### Edit Collection
- **URL**: `/admin/collections/[documentId]`
- **Features**:
  - Pre-populated form with existing collection data
  - Pre-selected artworks
  - Update button to save changes
  - Delete button with confirmation dialog
  - Cancel button to discard changes

## Technical Details

### Server Actions
All CRUD operations are handled through server actions:
- `createArtwork()` - Creates a new artwork
- `updateArtwork()` - Updates an existing artwork
- `deleteArtwork()` - Deletes an artwork
- `createCollection()` - Creates a new collection
- `updateCollection()` - Updates an existing collection
- `deleteCollection()` - Deletes a collection

### Cache Revalidation
After mutations, the following paths are automatically revalidated:
- Artwork operations: `/artworks`, `/admin/artworks`, `/artworks/[slug]`
- Collection operations: `/collections`, `/admin/collections`, `/collections/[slug]`

### Error Handling
- User-friendly error messages displayed in the UI
- Form validation for required fields
- Confirmation dialogs for destructive actions (delete)

### Data Source
All data is managed through the Strapi CMS API:
- In local development: No authentication required
- In production: API token required (configured via environment variables)

## Usage Examples

### Creating an Artwork
1. Navigate to `/admin/artworks`
2. Click "New Artwork"
3. Fill in the title (required) and optional description and year
4. Click "Create Artwork"
5. You'll be redirected to the artworks list

### Creating a Collection
1. Navigate to `/admin/collections`
2. Click "New Collection"
3. Enter a collection name
4. Select artworks from the checkbox list
5. Click "Create Collection"
6. You'll be redirected to the collections list

### Editing an Artwork
1. Navigate to `/admin/artworks`
2. Click "Edit" next to the artwork you want to modify
3. Update the fields as needed
4. Click "Update Artwork" to save or "Delete Artwork" to remove
5. You'll be redirected to the artworks list

### Editing a Collection
1. Navigate to `/admin/collections`
2. Click "Edit" next to the collection you want to modify
3. Update the name or artwork selection
4. Click "Update Collection" to save or "Delete Collection" to remove
5. You'll be redirected to the collections list

## Design Principles

- **Simple and Clean**: Minimal, focused interface
- **Consistent**: Same patterns across artworks and collections
- **Responsive**: Works on desktop and mobile devices
- **User-Friendly**: Clear labels, helpful empty states, confirmation dialogs
- **Fast**: Optimistic updates with cache revalidation
