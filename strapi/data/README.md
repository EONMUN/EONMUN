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
   - Add it to your `strapi/.env` as `PROD_STRAPI_TRANSFER_TOKEN`

2. **Production URL**: Add your production Strapi URL to `strapi/.env`:
   ```
   PROD_STRAPI_URL=https://your-production-strapi.com
   PROD_STRAPI_TRANSFER_TOKEN=your-transfer-token
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

The `strapi transfer` command uses environment variables for configuration:

```bash
# Strapi automatically uses these environment variables:
# STRAPI_TRANSFER_URL (set from PROD_STRAPI_URL)
# STRAPI_TRANSFER_TOKEN (set from PROD_STRAPI_TRANSFER_TOKEN)

strapi transfer --force
```

**Note:** The Makefile maps `PROD_STRAPI_URL` → `STRAPI_TRANSFER_URL` and `PROD_STRAPI_TRANSFER_TOKEN` → `STRAPI_TRANSFER_TOKEN` using Docker's `-e` flag. This allows Strapi to automatically detect the transfer source without requiring command-line flags, making future runs faster.

This transfers:
- All content types and entries
- Media files and assets
- Proper relations and references
- Drafts and published states

## Important Notes

- The `--force` flag overwrites existing data in the destination
- Transfer tokens are different from API tokens and have special permissions for data transfer
- Strapi automatically uses `STRAPI_TRANSFER_URL` and `STRAPI_TRANSFER_TOKEN` environment variables when set
- The command must be run from inside the local Strapi container where the destination is implied
- **Security:** Transfer tokens should be treated as sensitive credentials and stored securely

## Migration from Old Sync

The previous custom sync implementation using `sync-from-api.js` and `import-from-api.js` has been removed. The new transfer-based approach provides better reliability and feature support.