# Data Migration Workflow

This directory contains scripts and data for migrating production Strapi data to local development with R2 media hosting.

## Overview

The migration workflow consists of:
1. **Sync data** from production using Strapi's transfer command
2. **Generate manifest** of media files to upload
3. **Upload media** to Cloudflare R2
4. **Verify uploads** are accessible
5. **Update fixtures** to use R2 URLs

## Directory Structure

```
strapi/data/
├── data.json              # Fixture data (committed to git)
├── data.json.backup       # Backup before URL updates (gitignored)
├── r2-manifest.json       # R2 upload tracking (gitignored)
├── uploads/               # Media files from production (gitignored)
│   ├── artworks/         # Artwork images
│   ├── authors/          # Author avatars
│   ├── articles/         # Article images
│   └── ...
└── README.md             # This file
```

## Quick Start

### 1. Sync Production Data

```bash
# From project root
make sync
```

This uses Strapi's native transfer command to sync all content and media from production.

### 2. Setup R2 (One-time)

Add R2 credentials to your `.env` file:

```bash
# .env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=eonmun-media
R2_PUBLIC_URL=https://cdn.eonmun.com
```

### 3. Upload Media to R2

```bash
cd strapi

# Generate manifest from uploads directory
npm run r2:manifest

# Upload files to R2
npm run r2:upload

# Verify all uploads succeeded
npm run r2:verify

# Update data.json to use R2 URLs
npm run fixtures:update-urls
```

### 4. Test Local Seeding

```bash
# Test that fixtures work with R2 URLs
npm run seed:example
```

## Scripts Reference

### `npm run r2:manifest`

Scans `data/uploads/` and generates `data/r2-manifest.json` with:
- List of all files to upload
- Local paths and sizes
- Upload status tracking
- R2 bucket configuration

**When to run:** After syncing from production, before uploading to R2.

### `npm run r2:upload`

Uploads all pending files in the manifest to Cloudflare R2.

**Features:**
- Incremental uploads (skips already uploaded files)
- Automatic content-type detection
- Progress tracking
- Resumable (re-run if uploads fail)

**Requires:** R2 credentials in `.env`

### `npm run r2:verify`

Checks that all uploaded files are accessible via their R2 URLs.

**When to run:** After uploading to ensure all files are publicly accessible.

### `npm run fixtures:update-urls`

Updates `data/data.json` to replace local file paths with R2 CDN URLs.

**Features:**
- Creates backup at `data/data.json.backup`
- Maps local paths to R2 URLs using manifest
- Updates all media fields (cover, avatar, image, images, etc.)

**When to run:** After verifying R2 uploads, before committing fixtures.

## Environment Variables

### Required for Production Sync

```bash
PROD_STRAPI_URL=https://admin.eonmun.com
PROD_STRAPI_TRANSFER_TOKEN=your-transfer-token
```

### Required for R2 Upload

```bash
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=eonmun-media
R2_PUBLIC_URL=https://cdn.eonmun.com
```

## Workflow for New Developers

For new developers, you only need to seed from the existing fixtures:

```bash
make init  # Initializes and seeds database
```

No need to run the migration scripts unless you're updating from production.

## Workflow for Updating from Production

When you need to refresh data from production:

```bash
# 1. Sync from production
make sync

# 2. Generate R2 manifest
cd strapi
npm run r2:manifest

# 3. Upload new/changed files to R2
npm run r2:upload

# 4. Verify uploads
npm run r2:verify

# 5. Update fixture URLs
npm run fixtures:update-urls

# 6. Test seeding
npm run seed:example

# 7. Commit updated data.json (if desired)
git add data/data.json
git commit -m "Update fixtures from production"
```

## Troubleshooting

### Upload fails with authentication error

Check that your R2 credentials are correct in `.env`:
- Verify `R2_ACCOUNT_ID` matches your Cloudflare account
- Ensure `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are valid
- Check that the R2 bucket exists and is accessible

### Files not found in manifest

The manifest only includes files in `data/uploads/`. If files are missing:
1. Run `make sync` to get all files from production
2. Check that files exist in `data/uploads/`
3. Re-run `npm run r2:manifest`

### Verify fails - files not accessible

This usually means:
- R2 bucket is not configured for public access
- Custom domain DNS not set up correctly
- Files didn't upload successfully (re-run `npm run r2:upload`)

### Fixture URLs not updating

Make sure:
- R2 manifest shows files as uploaded (`uploaded: true`)
- Run `npm run r2:verify` first to confirm accessibility
- Check backup file was created at `data/data.json.backup`

## Architecture Notes

### Why R2 for Media?

- **Cost-effective**: Cloudflare R2 has no egress fees
- **CDN**: Built-in global distribution
- **Scalable**: Handles large media libraries
- **Decoupled**: Separates media storage from Strapi backend

### Why Fixtures Instead of API Export?

The existing `make sync` command using Strapi's transfer functionality is superior to custom API exports because:
- Native support for all Strapi features
- Proper relation mapping
- Automatic media handling
- Official Strapi solution

The R2 scripts complement this by enabling CDN hosting of media files.

## Files to Commit

**Commit:**
- `data/data.json` - Fixture data with R2 URLs
- `scripts/*.js` - Migration scripts

**Don't commit (gitignored):**
- `data/uploads/` - Large media files
- `data/r2-manifest.json` - Local tracking state
- `data/data.json.backup` - Temporary backup
