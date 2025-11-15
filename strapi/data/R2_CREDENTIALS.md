# Generating R2 Credentials via Cloudflare API

## Quick Start

```bash
# 1. Add Cloudflare credentials to .env.production
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
R2_BUCKET_NAME=eonmun-production  # optional, defaults to this

# 2. Generate R2 credentials
cd strapi
npm run r2:generate-credentials

# 3. Copy output to .env
```

## What This Script Does

The `generate-r2-credentials.js` script automates R2 API token creation using Cloudflare's API:

1. Reads `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from `.env.production`
2. Verifies the target bucket exists (optional check)
3. Creates a new R2 API token with Read & Write permissions
4. Outputs the credentials to add to your `.env` file

## Prerequisites

### 1. Cloudflare Account ID

Find in Cloudflare Dashboard:
- Log in to Cloudflare
- Select any domain or go to R2
- Account ID shown in sidebar

### 2. Cloudflare API Token

Create at: https://dash.cloudflare.com/profile/api-tokens

**Required Permissions:**
- Account > R2 > Edit

**Steps:**
1. Click "Create Token"
2. Use "Create Custom Token" template
3. Add permissions: Account > R2 > Edit
4. Select your account
5. Continue and Create Token
6. Save the token (shown only once)

### 3. Add to .env.production

```bash
# Cloudflare API credentials
CLOUDFLARE_ACCOUNT_ID=abc123def456
CLOUDFLARE_API_TOKEN=your-api-token-here

# Target bucket (optional)
R2_BUCKET_NAME=eonmun-production
```

## Usage

```bash
cd strapi
npm run r2:generate-credentials
```

### Example Output

```
🔐 Generating R2 API Credentials

Account ID: abc123def456
Target Bucket: eonmun-production

Step 1: Verifying bucket exists...
✓ Bucket 'eonmun-production' found

Step 2: Creating R2 API token...
✓ Token created successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ R2 CREDENTIALS GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these to your .env file:

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=abc123def456
R2_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8
R2_SECRET_ACCESS_KEY=secretkeyhere123456789
R2_BUCKET_NAME=eonmun-production
R2_PUBLIC_URL=https://cdn.eonmun.com  # Update with your CDN URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Token Details:
   Name: eonmun-upload-1731587894123
   Permissions: Read & Write
   Created: 2025-11-14T13:18:14.123Z

⚠️  Security Notes:
   • Save these credentials securely
   • Never commit them to git
   • Rotate periodically (every 90 days recommended)
   • Delete old tokens from Cloudflare dashboard

✅ You can now run: npm run r2:upload
```

## Environment Variables

### Input (from .env.production)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | Yes* | Cloudflare account ID | Falls back to `R2_ACCOUNT_ID` |
| `CLOUDFLARE_API_TOKEN` | Yes | API token with R2 Edit permission | - |
| `R2_BUCKET_NAME` | No | Target bucket name | `eonmun-production` |

*Either `CLOUDFLARE_ACCOUNT_ID` or `R2_ACCOUNT_ID` must be set

### Output (add to .env)

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | R2 API secret key |
| `R2_BUCKET_NAME` | Bucket name |
| `R2_PUBLIC_URL` | Public CDN URL |

## Troubleshooting

### Missing CLOUDFLARE_ACCOUNT_ID

```
❌ Error: CLOUDFLARE_ACCOUNT_ID or R2_ACCOUNT_ID not found in .env.production
```

**Solution:** Add to `.env.production`:
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### Missing CLOUDFLARE_API_TOKEN

```
❌ Error: CLOUDFLARE_API_TOKEN not found in .env.production
```

**Solution:** 
1. Create token at https://dash.cloudflare.com/profile/api-tokens
2. Add to `.env.production`:
   ```bash
   CLOUDFLARE_API_TOKEN=your-token
   ```

### Insufficient Permissions

```
❌ Failed to create API token
Error: Cloudflare API error (401): Unauthorized

💡 Your CLOUDFLARE_API_TOKEN may not have sufficient permissions.
Required: Account > R2 > Edit
```

**Solution:** Recreate API token with correct permissions:
- Account > R2 > Edit

### Bucket Not Found

```
⚠️  Warning: Bucket 'eonmun-production' not found
Available buckets: eonmun-media, test-bucket
Proceeding anyway - credentials will work if bucket is created later
```

This is just a warning. The credentials will work, but:
- Check bucket name is correct
- Create bucket if needed
- Update `R2_BUCKET_NAME` in `.env.production`

## Security Best Practices

### Token Management

1. **Separate tokens per environment:**
   ```bash
   # Development
   npm run r2:generate-credentials
   # Copy to .env
   
   # Production
   npm run r2:generate-credentials
   # Copy to production .env
   ```

2. **Rotate credentials regularly:**
   - Every 90 days recommended
   - After team member departure
   - If credentials potentially compromised

3. **Delete old tokens:**
   - Cloudflare Dashboard → R2 → Manage API Tokens
   - Delete unused tokens
   - Tokens are named with timestamp for easy identification

### Never Commit Credentials

**Always gitignored:**
```gitignore
.env
.env.production
.env.local
.env.*.local
```

**Verify before committing:**
```bash
git diff .env  # Should not show in diff
grep -r "R2_SECRET" .  # Should only find .env files (which are gitignored)
```

## Implementation Details

### Cloudflare API Endpoints

**Create R2 API Token:**
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/api_tokens
```

**List R2 Buckets:**
```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets
```

### Request Example

```javascript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/api_tokens`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `eonmun-upload-${Date.now()}`,
      permissions: {
        read: true,
        write: true
      }
    })
  }
);
```

### Response Structure

```json
{
  "success": true,
  "result": {
    "access_key_id": "a1b2c3d4e5f6g7h8",
    "secret_access_key": "secretkeyhere123456789",
    "name": "eonmun-upload-1731587894123"
  }
}
```

## Workflow Integration

### Initial Setup

```bash
# 1. Get Cloudflare credentials
# Add to .env.production:
#   CLOUDFLARE_ACCOUNT_ID=...
#   CLOUDFLARE_API_TOKEN=...

# 2. Generate R2 credentials
cd strapi
npm run r2:generate-credentials

# 3. Add output to .env
# Copy the R2_* variables

# 4. Upload media
npm run r2:manifest
npm run r2:upload
```

### Credential Rotation

```bash
# 1. Generate new credentials
npm run r2:generate-credentials

# 2. Update .env with new credentials

# 3. Test with verification
npm run r2:verify

# 4. Delete old token from Cloudflare dashboard
```

## Comparison: Manual vs Automated

### Manual Process

1. Log into Cloudflare Dashboard
2. Navigate to R2 → Manage API Tokens
3. Click Create API Token
4. Configure permissions
5. Copy credentials
6. Manually add to .env
7. Repeat for each environment

**Time:** ~5 minutes per environment

### Automated Process

1. Run `npm run r2:generate-credentials`
2. Copy output to .env

**Time:** ~30 seconds per environment

### Benefits of Automation

- ✅ Faster credential generation
- ✅ Consistent token naming (includes timestamp)
- ✅ Automatic bucket verification
- ✅ Formatted output ready for .env
- ✅ Embedded security reminders
- ✅ Scriptable for CI/CD

## Related Commands

```bash
# Generate credentials
npm run r2:generate-credentials

# After adding credentials to .env:
npm run r2:manifest           # Scan uploads
npm run r2:upload             # Upload to R2
npm run r2:verify             # Verify uploads
npm run fixtures:update-urls  # Update fixtures
```

## Notes

- The script reads from `.env.production` by default
- Falls back to `R2_ACCOUNT_ID` if `CLOUDFLARE_ACCOUNT_ID` not set
- Tokens are created with Read & Write permissions (required for uploads)
- Token names include timestamp for identification
- Bucket verification is optional (doesn't fail if bucket missing)
- Output is formatted for direct copy-paste to .env
