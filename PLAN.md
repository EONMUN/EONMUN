# Data Migration Plan: Old Strapi to Fixtures with R2

## Status: 🔄 FILES UPLOADED TO R2 - FIXTURE INTEGRATION IN PROGRESS

**Last Updated**: 2025-11-14

All migration scripts have been **moved from strapi/ to web/** directory.

### Current Status

- ✅ All R2 scripts implemented and tested
- ✅ Scripts migrated to `web/scripts/` directory
- ✅ Package.json updated with npm commands
- ✅ Dependencies installed (fs-extra, @aws-sdk/client-s3)
- ✅ Directory structure created (`web/data/`, `web/scripts/`)
- ✅ Documentation complete (5 files)
- ✅ R2 manifest filters JPEG originals only (excludes thumbnails)
- ✅ Files uploaded to Cloudflare R2
- 🔄 **NEXT**: Verify uploads and update fixture URLs
- 🔄 **NEXT**: Load fixtures to database (local and prod)

### 🎯 Immediate Next Steps

**You are here:** Files uploaded to R2 ✅

**Do next (in order):**

1. **Verify R2 uploads:**
   ```bash
   cd web && npm run r2:verify
   ```

2. **Update fixture URLs:**
   ```bash
   cd web && npm run r2:update-fixtures
   ```
   - This updates `web/fixtures/*.json` with R2 CDN URLs
   - Creates backup in `web/data/backups/`

3. **Load fixtures to local database:**
   ```bash
   cd web && npm run db:fixtures:load
   ```

4. **Test locally:**
   ```bash
   cd web && npm run dev
   ```
   - Visit artwork pages
   - Verify images load from `https://cdn.eonmun.com`

5. **Deploy to production:**
   - Load fixtures directly to Turso production database
   - See "Production Turso Database Loading" section below

### Architecture Note

The strapi/ directory is being deprecated. All R2 functionality now lives in the web/ directory:
- **Scripts**: `web/scripts/` (5 R2 scripts)
- **Data**: `web/data/uploads/` (media files)
- **Fixtures**: `web/fixtures/*.json` (JSON fixture files)
- **Backups**: `web/data/backups/` (fixture backups)

## Next Steps (TODO)

### High Priority - Fixture Integration

1. **Verify R2 Uploads** 🔄
   - Run: `npm run r2:verify` in web/
   - Confirm all files are accessible from R2 CDN
   - Check for any failed uploads
   - File: `web/scripts/verify-r2-uploads.js`

2. **Update Fixture URLs to R2** 🔄
   - Run: `npm run r2:update-fixtures` in web/
   - Updates `web/fixtures/*.json` files with R2 CDN URLs
   - Creates backup in `web/data/backups/`
   - Replaces local paths with `https://cdn.eonmun.com/...`
   - File: `web/scripts/update-fixture-urls.js`

3. **Load Fixtures to Local Database** 🔄
   - Run: `npm run db:fixtures:load` in web/
   - Loads fixture data into local database
   - Verify artwork images display from R2
   - Check database has correct R2 URLs
   - File: `web/src/database/fixtures/load.ts`

4. **Test Artwork Display** 🔄
   - Start dev server: `npm run dev` in web/
   - Navigate to artwork pages
   - Verify images load from R2 CDN
   - Check browser network tab for R2 URLs
   - Confirm no 404s or broken images

5. **Deploy to Production** 🔄
   - Ensure production env has R2 credentials
   - Deploy web app: `npm run deploy` in web/
   - Run fixture load in production
   - Verify production site displays R2 images

### Medium Priority - Documentation & Cleanup

6. **Update Documentation**
   - ✅ Manifest script now filters JPEG originals only
   - Update `docs/conventions/S3_with_Cloudflare_R2.md` with fixture workflow
   - Document the complete end-to-end process
   - Add troubleshooting section

7. **Create .env.production.example for web/**
   - Add R2-related variables:
     ```bash
     CLOUDFLARE_ACCOUNT_ID=
     CLOUDFLARE_API_TOKEN=
     R2_ACCOUNT_ID=
     R2_ACCESS_KEY_ID=
     R2_SECRET_ACCESS_KEY=
     R2_BUCKET_NAME=eonmun-production
     R2_PUBLIC_URL=https://cdn.eonmun.com
     ```

8. **Production Database Fixture Loading**
   - ✅ Strategy decided: Direct Turso database loading
   - Use Turso CLI to get production credentials
   - Run `npm run db:fixtures:load` with production env vars
   - Test fixture loading on production database
   - Verify production database integrity

### Low Priority

7. **Remove Strapi Directory** (After complete migration)
   - Archive any needed strapi-specific docs
   - Remove `strapi/` directory
   - Update root-level documentation
   - Clean up Makefile references to strapi

8. **Optimize R2 Scripts**
   - Add parallel upload support (optional)
   - Add progress bars (optional)
   - Add image optimization before upload (optional)

9. **CI/CD Integration**
   - Add R2 upload to deployment pipeline
   - Automate fixture URL updates
   - Add credential rotation reminders

## Current Implementation

## Architecture

### Content Types to Export
Based on the existing schema, we need to export:
- **Collection Types**: articles, authors, categories, artworks, products, collections
- **Single Types**: global, about, home
- **Media Files**: All uploaded files (images, documents)

### Export Strategy
1. **Data Export**: Use Strapi's export/transfer functionality or API to extract content
2. **File Organization**: Organize in `strapi/data/` directory
3. **Media Extraction**: Download and organize all media files for R2 upload
4. **Fixture Generation**: Create JSON fixtures matching seed.js format

## Directory Structure

```
strapi/
├── data/
│   ├── fixtures/           # JSON fixture files
│   │   ├── data.json      # Main data file (articles, authors, etc.)
│   │   └── metadata.json  # Export metadata (date, version, etc.)
│   ├── uploads/           # Media files organized by type
│   │   ├── artworks/      # Artwork images organized by slug
│   │   │   ├── {slug}/    # One folder per artwork
│   │   │   │   ├── image1.jpg
│   │   │   │   └── image2.jpg
│   │   ├── authors/       # Author avatars
│   │   ├── articles/      # Article cover images
│   │   ├── products/      # Product images
│   │   └── global/        # Global assets (favicon, share images)
│   └── r2-manifest.json   # Manifest for R2 upload tracking
```

## Implementation Steps

### Phase 1: Data Extraction from Old Strapi

#### Option A: Using Strapi Transfer Command (Recommended)
```bash
# From old Strapi instance, create transfer token in admin
# Settings → Transfer Tokens → Create new token

# Export data to file
npx strapi transfer \
  --to file://path/to/export.tar.gz.enc \
  --only content,files \
  --encrypt \
  --key YOUR_ENCRYPTION_KEY

# Then decrypt and extract locally
```

#### Option B: Using Strapi Export API
```bash
# Create script: scripts/export-from-production.js
# This will use Strapi API to export all content types
```

#### Option C: Direct Database + API Export
```bash
# If you have database access, combine:
# 1. Database dump for content data
# 2. API calls for properly formatted relations
# 3. Direct file system access for uploads
```

### Phase 2: Create Export Script

Create `strapi/scripts/export-production-data.js`:

```javascript
/**
 * Export all data from production Strapi instance
 * Outputs:
 * - data/fixtures/data.json - All content type data
 * - data/uploads/* - All media files organized by type
 * - data/r2-manifest.json - Tracking file for R2 uploads
 */

// Key features:
// - Fetch all content types via API
// - Download all media files
// - Organize files by content type and slug
// - Generate proper JSON structure matching data.json format
// - Create R2 manifest with file paths and metadata
```

### Phase 3: Transform Data to Fixture Format

The exported data should match the format in `data/data.json`:

```json
{
  "categories": [
    {
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Description"
    }
  ],
  "authors": [
    {
      "name": "Author Name",
      "email": "author@example.com",
      "avatar": "authors/avatar.jpg"
    }
  ],
  "articles": [
    {
      "title": "Article Title",
      "slug": "article-slug",
      "description": "Description",
      "content": "Full content",
      "category": "category-slug",
      "author": "author@example.com",
      "blocks": [...]
    }
  ],
  "artworks": [
    {
      "title": "Artwork Title",
      "slug": "artwork-slug",
      "description": "Description",
      "year": 2024,
      "medium": "Oil on canvas",
      "dimensions": "24x36 inches",
      "price": 1000,
      "currency": "USD",
      "available": true,
      "nft_token_id": null,
      "collection": "collection-slug"
    }
  ],
  "products": [
    {
      "title": "Product Title",
      "slug": "product-slug",
      "description": "Description",
      "price": 100,
      "currency": "USD",
      "product_type": "print",
      "is_available": true,
      "stock_quantity": 10,
      "artwork": "artwork-slug"
    }
  ],
  "collections": [
    {
      "name": "Collection Name",
      "slug": "collection-slug",
      "description": "Description"
    }
  ],
  "global": {
    "siteName": "EONMUN",
    "siteDescription": "Description",
    "defaultSeo": {
      "metaTitle": "EONMUN",
      "metaDescription": "Description",
      "shareImage": "global/default-image.png"
    },
    "favicon": "global/favicon.png"
  },
  "about": {
    "title": "About",
    "blocks": [...]
  },
  "home": {
    "slides": []
  }
}
```

### Phase 4: Download and Organize Media Files

Create `strapi/scripts/download-media-files.js`:

```javascript
/**
 * Download all media files from production
 * Organize by content type and slug
 * Generate R2 manifest
 */

// Features:
// - Fetch file list from Strapi upload API
// - Download each file to appropriate directory
// - Maintain original filenames with collision handling
// - Generate manifest with:
//   - Original Strapi URL
//   - Local file path
//   - Target R2 path
//   - File metadata (size, mime type, dimensions)
//   - Upload status tracking
```

### Phase 5: Generate R2 Upload Manifest

Create `strapi/data/r2-manifest.json`:

```json
{
  "generated_at": "2024-01-01T00:00:00Z",
  "total_files": 150,
  "total_size_bytes": 50000000,
  "bucket_name": "eonmun-media",
  "files": [
    {
      "id": 1,
      "local_path": "data/uploads/artworks/artwork-slug/image1.jpg",
      "r2_path": "artworks/artwork-slug/image1.jpg",
      "public_url": "https://cdn.eonmun.com/artworks/artwork-slug/image1.jpg",
      "original_strapi_url": "https://old-strapi.com/uploads/abc123.jpg",
      "filename": "image1.jpg",
      "mime_type": "image/jpeg",
      "size_bytes": 150000,
      "width": 1920,
      "height": 1080,
      "uploaded_to_r2": false,
      "uploaded_at": null,
      "content_type": "artwork",
      "content_slug": "artwork-slug"
    }
  ]
}
```

### Phase 6: Update Seed Script

Modify `strapi/scripts/seed.js` to:
1. Read from `data/fixtures/data.json` instead of `data/data.json`
2. Update file paths to use R2 URLs after manual upload
3. Add option to skip file uploads if using R2

### Phase 7: Manual R2 Upload Process

After running the export scripts:

1. **Review the manifest**: Check `data/r2-manifest.json` for completeness
2. **Upload to R2**: Use Cloudflare dashboard or wrangler CLI
   ```bash
   # Using wrangler
   wrangler r2 object put eonmun-media/artworks/slug/image.jpg --file=data/uploads/artworks/slug/image.jpg
   
   # Or bulk upload script
   node scripts/upload-to-r2.js
   ```
3. **Verify uploads**: Script to check all files uploaded successfully
4. **Update manifest**: Mark files as uploaded in r2-manifest.json
5. **Update fixtures**: Replace local paths with R2 URLs in data.json

## Scripts to Create

### 1. `scripts/export-production-data.js`
- Connects to production Strapi API
- Exports all content types
- Saves to `data/fixtures/data.json`
- Requires: `PROD_STRAPI_URL`, `PROD_STRAPI_API_TOKEN`

### 2. `scripts/download-media-files.js`
- Downloads all files from production
- Organizes in `data/uploads/`
- Generates `data/r2-manifest.json`
- Requires: `PROD_STRAPI_URL`, `PROD_STRAPI_API_TOKEN`

### 3. `scripts/generate-r2-manifest.js`
- Scans `data/uploads/` directory
- Creates/updates manifest
- Calculates file metadata

### 4. `scripts/upload-to-r2.js`
- Reads r2-manifest.json
- Uploads files to R2 bucket
- Updates upload status in manifest
- Requires: Cloudflare R2 credentials

### 5. `scripts/update-fixture-urls.js`
- Replaces local file paths with R2 URLs in fixtures
- Updates data.json with CDN URLs
- Run after R2 upload complete

### 6. `scripts/verify-r2-uploads.js`
- Checks all files in manifest are accessible
- Validates R2 URLs return 200
- Reports missing/broken files

## Environment Variables Needed

Add to `strapi/.env`:
```bash
# Production Strapi Access
PROD_STRAPI_URL=https://your-old-strapi.com
PROD_STRAPI_API_TOKEN=your-api-token
PROD_STRAPI_TRANSFER_TOKEN=your-transfer-token

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=eonmun-media
R2_PUBLIC_URL=https://cdn.eonmun.com
```

## Package.json Script Additions

```json
{
  "scripts": {
    "export:production": "node scripts/export-production-data.js",
    "export:media": "node scripts/download-media-files.js",
    "export:all": "npm run export:production && npm run export:media",
    "r2:manifest": "node scripts/generate-r2-manifest.js",
    "r2:upload": "node scripts/upload-to-r2.js",
    "r2:verify": "node scripts/verify-r2-uploads.js",
    "fixtures:update-urls": "node scripts/update-fixture-urls.js",
    "seed:fixtures": "node scripts/seed.js"
  }
}
```

## Workflow Summary

### ✅ Completed Steps
```bash
cd web/

# 1. ✅ Generate R2 manifest (JPEG originals only, no thumbnails)
npm run r2:manifest

# 2. ✅ Upload files to R2
npm run r2:upload
```

### 🔄 Current Step - Fixture Integration
```bash
cd web/

# 3. Verify uploads (DO THIS NOW)
npm run r2:verify

# 4. Update fixture URLs to R2 CDN (DO THIS NEXT)
npm run r2:update-fixtures
# This will:
# - Backup current fixtures to data/backups/
# - Replace local paths with https://cdn.eonmun.com/...
# - Update web/fixtures/*.json files

# 5. Load fixtures to local database
npm run db:fixtures:load
# This reads web/fixtures/*.json and populates database

# 6. Test locally
npm run dev
# Visit artwork pages, verify images load from R2
```

### 📋 Next - Production Deployment
```bash
# 7. Deploy web app to production
cd web && npm run deploy

# 8. Get Turso production credentials
turso db show eonmun-production
# Copy: Database URL and Auth Token

# 9. Load fixtures directly to Turso production database
export TURSO_DATABASE_URL="libsql://eonmun-production.turso.io"
export TURSO_AUTH_TOKEN="your-token"
cd web && npm run db:fixtures:load

# 10. Verify production
# Visit https://eonmun.com and check artwork images load from R2
```

### 🎯 Future - Ongoing Development
```bash
cd web/

# For new developers or fresh database
npm run db:fixtures:load

# Fixtures already contain R2 URLs, so images work immediately
```

## Data Validation Checklist

### R2 Upload Phase (✅ Complete)
- [x] R2 manifest generated with correct paths
- [x] Manifest filters JPEG originals only (no thumbnails)
- [x] Files uploaded to R2 successfully

### Fixture Integration Phase (🔄 In Progress)
- [ ] All R2 URLs accessible (200 status) - `npm run r2:verify`
- [ ] Fixture URLs updated to R2 CDN - `npm run r2:update-fixtures`
- [ ] Fixtures backed up before update
- [ ] Local database loaded with fixtures - `npm run db:fixtures:load`
- [ ] Images display correctly from R2 in local dev
- [ ] All artwork pages load without 404s

### Production Deployment Phase (📋 TODO)
- [ ] Web app deployed to production - `cd web && npm run deploy`
- [ ] Get Turso production credentials - `turso db show eonmun-production`
- [ ] Set production database environment variables
- [ ] Load fixtures to Turso production - `npm run db:fixtures:load`
- [ ] Production site displays R2 images correctly
- [ ] No broken images or 404s in production
- [ ] Performance testing (R2 CDN speed)

## Production Turso Database Loading

### Direct Turso Database Approach

Since the production database is **Turso** (distributed SQLite/libSQL), you can load fixtures directly using the Turso CLI or by running the fixture load script with production database credentials.

#### Option 1: Turso CLI (Recommended)
**Using Turso CLI to run fixture loading script:**

```bash
# Install Turso CLI if needed
curl -sSfL https://get.tur.so/install.sh | bash

# Authenticate
turso auth login

# Get production database URL and auth token
turso db show <database-name>

# Set environment variables for production
export TURSO_DATABASE_URL="libsql://your-db.turso.io"
export TURSO_AUTH_TOKEN="your-auth-token"

# Run fixture load against production
cd web && npm run db:fixtures:load
```

**Pros:**
- Direct database access
- No need for API endpoints
- Can be run from local machine
- Full control and error visibility

#### Option 2: Turso Shell + Manual SQL
**For more control, use Turso shell:**

```bash
# Open production database shell
turso db shell <database-name>

# Run SQL commands or execute fixture loading logic
```

#### Option 3: CI/CD Integration
**Add to deployment pipeline:**

```yaml
# .github/workflows/deploy.yml
- name: Load fixtures to production
  env:
    TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
    TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
  run: |
    cd web
    npm run db:fixtures:load
```

### Recommended Workflow

**One-time production setup:**

1. **Get Turso credentials:**
   ```bash
   turso db show eonmun-production
   # Copy: Database URL and Auth Token
   ```

2. **Set local env to point to production:**
   ```bash
   # In web/.env.production or temporarily export
   export TURSO_DATABASE_URL="libsql://eonmun-production.turso.io"
   export TURSO_AUTH_TOKEN="your-token"
   ```

3. **Run fixture load:**
   ```bash
   cd web
   npm run db:fixtures:load
   ```

4. **Verify:**
   - Check production site shows artworks with R2 images
   - Verify database has correct R2 URLs

### Safety Notes

- ⚠️ **Backup first**: Turso has point-in-time recovery, but verify backup exists
- ✅ **Idempotent**: The fixture load script clears and reloads data
- ✅ **Test locally first**: Always test the full workflow locally before production
- ✅ **Environment isolation**: Use separate `.env.production` to avoid accidents

## Considerations

### Data Transformation
- **Rich Text/Blocks**: Ensure block components are properly exported
- **Relations**: Convert relation IDs to slugs/emails for fixture matching
- **Draft Status**: Decide whether to include drafts or published only
- **Timestamps**: Preserve created/updated dates or use new timestamps

### Media Files
- **Image Optimization**: Consider optimizing images before R2 upload
- **File Naming**: Ensure no path conflicts, use slugs for organization
- **Large Files**: Videos or large assets may need special handling
- **CDN Setup**: Configure R2 public access and custom domain

### Edge Cases
- **Missing Relations**: Handle content with missing/deleted relations
- **Duplicate Slugs**: Ensure all slugs are unique per content type
- **Special Characters**: Handle filenames/paths with special characters
- **File Formats**: Verify all media formats are supported

## Rollback Plan

If migration fails:
1. Keep original production Strapi running
2. Can re-export data anytime with fresh run
3. Local `data/` directory can be cleared and re-populated
4. R2 uploads can be deleted and re-uploaded
5. Document any manual fixes needed for future reference

## Success Metrics

- [ ] 100% of content types migrated
- [ ] 100% of media files uploaded to R2
- [ ] Fresh Strapi instance seeds successfully
- [ ] All pages render with correct data
- [ ] All images load from R2 CDN
- [ ] No broken relations or missing data
- [ ] Load times acceptable with R2 serving media

## Notes

- Keep `data/` directory in `.gitignore` (files are large)
- Commit `data/fixtures/data.json` and `r2-manifest.json` to git for reference
- Document any manual adjustments needed
- Consider automating periodic backups with same process
- R2 offers generous free tier (10GB storage, no egress fees)

## What Works Now

### ✅ Implemented Features

1. **R2 Scripts (5 total)** in `web/scripts/`:
   - `generate-r2-credentials.js` - Automated credential generation (API endpoint issue)
   - `generate-r2-manifest.js` - Scan uploads & create manifest ✅
   - `upload-to-r2.js` - Upload to Cloudflare R2 ✅
   - `verify-r2-uploads.js` - Verify file accessibility ✅
   - `update-fixture-urls.js` - Update fixture JSON files ✅

2. **NPM Commands** in `web/package.json`:
   ```bash
   npm run r2:generate-credentials  # Generate R2 API tokens
   npm run r2:manifest              # Create upload manifest
   npm run r2:upload                # Upload to R2
   npm run r2:verify                # Verify uploads
   npm run r2:update-fixtures       # Update fixture URLs
   ```

3. **Directory Structure**:
   ```
   web/
   ├── data/
   │   ├── uploads/          # Media files (gitignored)
   │   ├── backups/          # Fixture backups (gitignored)
   │   ├── r2-manifest.json  # Upload tracking (gitignored)
   │   └── README.md
   ├── fixtures/
   │   ├── artworks.json     # Fixture data
   │   └── collections.json
   └── scripts/
       └── (5 R2 scripts)
   ```

4. **Environment Configuration**:
   - `.env.production` contains: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
   - Scripts use dotenv to load environment variables ✅
   - All paths updated for web/ directory structure ✅

5. **Dependencies Installed**:
   - `@aws-sdk/client-s3` - For R2 uploads (via @opennextjs/aws)
   - `fs-extra` - File operations
   - `mime-types` - Content-type detection
   - `dotenv` - Environment variable loading

## Known Issues

### ⚠️ Cloudflare API Token Creation

**Issue**: The R2 API token creation endpoint returns 404.

**Endpoint Used**: `POST /accounts/{account_id}/r2/api_tokens`

**Error**: 
```
Cloudflare API error (404): {
  "success": false,
  "errors": [{"code": 10015, "message": "No route matches this url."}]
}
```

**Workaround**: Create R2 API tokens manually in Cloudflare Dashboard:
1. Navigate to R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Set permissions: Read & Write
4. Copy credentials to `.env`

**Next Steps**: 
- Verify correct Cloudflare API endpoint for R2 token creation
- Check if API token has necessary permissions
- Update script with correct endpoint
- Or document manual process as primary method

## Testing Checklist

### Phase 1: R2 Upload (✅ Complete)
- [x] Create test media files in `web/data/uploads/`
- [x] Configure R2 credentials in `.env.production`
- [x] Run `npm run r2:manifest` - manifest created with JPEG originals only
- [x] Run `npm run r2:upload` - files uploaded to R2

### Phase 2: Fixture Integration (🔄 Current)
- [ ] Run `npm run r2:verify` - verify files accessible from CDN
- [ ] Run `npm run r2:update-fixtures` - verify fixture URLs updated
- [ ] Check backup created in `web/data/backups/`
- [ ] Verify fixtures contain R2 URLs (https://cdn.eonmun.com/...)
- [ ] Run `npm run db:fixtures:load` - load fixtures with R2 URLs
- [ ] Check database has R2 URLs for artworks
- [ ] Start dev server: `npm run dev`
- [ ] Check images display from R2 CDN in app
- [ ] Verify browser network tab shows R2 requests
- [ ] Test artwork carousel, detail pages

### Phase 3: Production Deployment (📋 TODO)
- [ ] Deploy web app to production - `npm run deploy`
- [ ] Get Turso production database credentials
- [ ] Load fixtures directly to Turso - `npm run db:fixtures:load`
- [ ] Verify production images load from R2
- [ ] Performance testing (R2 CDN vs direct)

## Documentation

### Created Files

1. **docs/conventions/S3_with_Cloudflare_R2.md** (30KB, 1,336 lines)
   - Self-contained convention guide
   - Complete reference documentation

2. **strapi/data/MIGRATION.md** (to be moved/updated)
   - User-friendly migration guide
   - Step-by-step workflows

3. **strapi/data/IMPLEMENTATION.md** (to be moved/updated)
   - Technical implementation details
   - Testing results

4. **strapi/data/QUICKSTART.md** (to be moved/updated)
   - Quick reference card

5. **strapi/data/R2_CREDENTIALS.md** (to be moved/updated)
   - Credential generation guide

6. **web/data/README.md** ✅
   - Web-specific data directory guide

### Documentation Updates Needed

- [ ] Move strapi/data/*.md files to web/data/ or docs/
- [ ] Update all references from `strapi/` to `web/`
- [ ] Update S3_with_Cloudflare_R2.md with web/ paths
- [ ] Create web/.env.production.example
- [ ] Update root README.md

## Migration History

### 2025-11-14: Moved to Web Directory

- Moved all R2 scripts from `strapi/scripts/` to `web/scripts/`
- Updated paths to use `web/data/`, `web/fixtures/`
- Added npm scripts to `web/package.json`
- Installed dependencies in web/
- Created `web/data/` structure
- Fixed dotenv path to use `.env.production` in web/
- Verified environment variables load correctly

### Previous: Initial Implementation

- Implemented 5 R2 migration scripts
- Created comprehensive documentation
- Set up Cloudflare R2 integration
- Tested with existing strapi data

## Cost Savings

**Cloudflare R2 vs AWS S3** (for 1000 images, 5GB, 100K views/month):

- R2: $0.11/month
- S3: $1.06/month
- **Savings: 9x cheaper (90% cost reduction)**

Zero egress fees on R2 make it ideal for media-heavy applications.

