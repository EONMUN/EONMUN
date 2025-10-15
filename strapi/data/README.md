# Production Data Sync

This directory is used for data synchronization between production and local environments.

## New Transfer-Based Sync

As of this update, EONMUN uses Strapi's built-in `strapi transfer` command for direct remote-to-remote data transfers, replacing the previous custom sync scripts.

### Benefits

✅ Native support for all Strapi features (drafts, relations, components)  
✅ Automatic media/asset handling  
✅ Proper relation mapping  
✅ Official Strapi solution with better support  
✅ More reliable and less error-prone  
✅ Eliminates ~800 lines of custom code

## Usage

### Prerequisites

1. **Transfer Token**: Create a transfer token in your production Strapi admin:
   - Go to Settings → Transfer Tokens
   - Create a new token with appropriate permissions
   - Add it to your `strapi/.env` as `STRAPI_TRANSFER_TOKEN`

2. **Production URL**: Add your production Strapi URL to `strapi/.env`:
   ```
   PROD_STRAPI_URL=https://your-production-strapi.com
   STRAPI_TRANSFER_TOKEN=your-transfer-token
   ```

### Sync Commands

```bash
# Sync data from production (standard sync)
make sync

# Fresh sync (clear local DB first, then sync)
make sync-fresh

# Just the transfer operation
make sync-remote
```

### How It Works

The `strapi transfer` command performs a direct transfer from production to local:

```bash
strapi transfer \
  --from $PROD_STRAPI_URL \
  --to http://localhost:1337 \
  --from-token $STRAPI_TRANSFER_TOKEN \
  --to-token $STRAPI_TRANSFER_TOKEN \
  --force
```

This transfers:
- All content types and entries
- Media files and assets
- Proper relations and references
- Drafts and published states

## Important Notes

- The `--force` flag overwrites existing data in the destination
- Both source and destination must use the same transfer token
- Transfer tokens are different from API tokens and have special permissions
- The local Strapi instance must be running for the transfer to work

## Migration from Old Sync

The previous custom sync implementation using `sync-from-api.js` and `import-from-api.js` has been removed. The new transfer-based approach provides better reliability and feature support.