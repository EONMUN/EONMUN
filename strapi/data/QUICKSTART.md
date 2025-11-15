# Quick Reference: Data Migration to R2

## TL;DR - Complete Migration

```bash
# 1. Sync from production
make sync

# 2. Migrate to R2
cd strapi
npm run r2:manifest
npm run r2:upload
npm run r2:verify
npm run fixtures:update-urls

# 3. Test locally
npm run seed:example
```

## Commands

| Command | Description |
|---------|-------------|
| `make sync` | Sync data from production using Strapi transfer |
| `npm run r2:manifest` | Generate R2 upload manifest |
| `npm run r2:upload` | Upload files to Cloudflare R2 |
| `npm run r2:verify` | Verify uploads are accessible |
| `npm run fixtures:update-urls` | Update data.json with R2 URLs |

## Environment Setup

Add to `.env`:

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=eonmun-media
R2_PUBLIC_URL=https://cdn.eonmun.com
```

## Files

### Scripts Created
- `strapi/scripts/generate-r2-manifest.js` - Scan and manifest
- `strapi/scripts/upload-to-r2.js` - Upload to R2
- `strapi/scripts/verify-r2-uploads.js` - Verify accessibility
- `strapi/scripts/update-fixture-urls.js` - Update URLs

### Documentation
- `strapi/data/MIGRATION.md` - Complete guide
- `strapi/data/IMPLEMENTATION.md` - Technical summary
- `PLAN.md` - Original plan (updated)

## Troubleshooting

**No files found**: Run `make sync` first

**Auth error**: Check R2 credentials in `.env`

**Files not accessible**: Configure R2 bucket for public access

**URLs not updating**: Ensure files are uploaded first

## More Info

Full documentation: `strapi/data/MIGRATION.md`
