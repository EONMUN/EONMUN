# Production Data Export

This directory contains the production Strapi data export that is used to populate local development environments.

## Files

- `latest.json` - Symlink to the most recent export
- `export-*.json` - Timestamped export files
- `media/` - Downloaded media files from production

## Usage

The export is automatically imported when running `make init`.

## Updating the Export

To update the export with the latest production data:

1. Ensure you have the production credentials in `strapi/.env`:
   ```
   PROD_STRAPI_URL=https://your-production-strapi.com
   PROD_STRAPI_API_TOKEN=your-api-token
   ```

2. Run the update command:
   ```bash
   make sync-update
   ```

3. Commit the updated export files:
   ```bash
   git add strapi/data/api-sync/
   git commit -m "chore: update production data export"
   ```

## Important

- This export is committed to the repository to ensure all developers work with the same data
- The export includes home content with artwork slides to ensure the homepage works
- Media files are also included in the export