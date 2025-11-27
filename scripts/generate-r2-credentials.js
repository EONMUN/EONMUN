'use strict';

/**
 * Generate R2 API credentials using Cloudflare API
 * 
 * Usage: npm run r2:generate-credentials
 * 
 * This script uses the Cloudflare API to automatically generate R2 API tokens.
 * It reads from .env.production to get the production bucket name and 
 * Cloudflare account credentials.
 * 
 * Requires environment variables:
 * - CLOUDFLARE_ACCOUNT_ID - Your Cloudflare account ID
 * - CLOUDFLARE_API_TOKEN - API token with R2 permissions
 * 
 * Optional:
 * - R2_BUCKET_NAME - Target bucket (defaults to 'eonmun-production')
 * 
 * Outputs R2 credentials to be added to .env:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 */

require('dotenv').config({ path: '.env.production' });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'eonmun-production';

if (!CLOUDFLARE_ACCOUNT_ID) {
  console.error('❌ Error: CLOUDFLARE_ACCOUNT_ID or R2_ACCOUNT_ID not found in .env.production');
  console.error('\nPlease add to .env.production:');
  console.error('  CLOUDFLARE_ACCOUNT_ID=your-account-id');
  process.exit(1);
}

if (!CLOUDFLARE_API_TOKEN) {
  console.error('❌ Error: CLOUDFLARE_API_TOKEN not found in .env.production');
  console.error('\nPlease add to .env.production:');
  console.error('  CLOUDFLARE_API_TOKEN=your-api-token');
  console.error('\nCreate one at: https://dash.cloudflare.com/profile/api-tokens');
  console.error('Required permissions: Account > R2 > Edit');
  process.exit(1);
}

async function createR2ApiToken(tokenName) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/api_tokens`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: tokenName,
      permissions: {
        read: true,
        write: true
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare API error (${response.status}): ${error}`);
  }

  return await response.json();
}

async function listR2Buckets() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list buckets (${response.status}): ${error}`);
  }

  return await response.json();
}

async function generateCredentials() {
  console.log('🔐 Generating R2 API Credentials\n');
  console.log(`Account ID: ${CLOUDFLARE_ACCOUNT_ID}`);
  console.log(`Target Bucket: ${R2_BUCKET_NAME}\n`);

  // Step 1: Verify bucket exists
  console.log('Step 1: Verifying bucket exists...');
  try {
    const bucketsResponse = await listR2Buckets();
    const buckets = bucketsResponse.result?.buckets || [];
    const bucketExists = buckets.some(b => b.name === R2_BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`⚠️  Warning: Bucket '${R2_BUCKET_NAME}' not found`);
      console.log('Available buckets:', buckets.map(b => b.name).join(', ') || 'none');
      console.log('Proceeding anyway - credentials will work if bucket is created later\n');
    } else {
      console.log(`✓ Bucket '${R2_BUCKET_NAME}' found\n`);
    }
  } catch (error) {
    console.log('⚠️  Could not verify bucket (proceeding anyway):', error.message, '\n');
  }

  // Step 2: Generate API token
  console.log('Step 2: Creating R2 API token...');
  const tokenName = `eonmun-upload-${Date.now()}`;
  
  try {
    const tokenResponse = await createR2ApiToken(tokenName);
    
    if (!tokenResponse.success) {
      throw new Error(`API returned errors: ${JSON.stringify(tokenResponse.errors)}`);
    }

    const { access_key_id, secret_access_key } = tokenResponse.result;

    console.log('✓ Token created successfully\n');
    
    // Step 3: Output credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ R2 CREDENTIALS GENERATED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nAdd these to your .env file:\n');
    console.log('# Cloudflare R2 Configuration');
    console.log(`R2_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}`);
    console.log(`R2_ACCESS_KEY_ID=${access_key_id}`);
    console.log(`R2_SECRET_ACCESS_KEY=${secret_access_key}`);
    console.log(`R2_BUCKET_NAME=${R2_BUCKET_NAME}`);
    console.log('R2_PUBLIC_URL=https://r2.eonmun.com  # Update with your R2 public URL');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📋 Token Details:');
    console.log(`   Name: ${tokenName}`);
    console.log(`   Permissions: Read & Write`);
    console.log(`   Created: ${new Date().toISOString()}`);
    
    console.log('\n⚠️  Security Notes:');
    console.log('   • Save these credentials securely');
    console.log('   • Never commit them to git');
    console.log('   • Rotate periodically (every 90 days recommended)');
    console.log('   • Delete old tokens from Cloudflare dashboard');
    
    console.log('\n✅ You can now run: npm run r2:upload');
    
  } catch (error) {
    console.error('\n❌ Failed to create API token');
    console.error('Error:', error.message);
    
    if (error.message.includes('401')) {
      console.error('\n💡 Your CLOUDFLARE_API_TOKEN may not have sufficient permissions.');
      console.error('Required: Account > R2 > Edit');
    }
    
    process.exit(1);
  }
}

// Run
generateCredentials().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
