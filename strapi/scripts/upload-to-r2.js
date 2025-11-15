'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Upload files to Cloudflare R2
 * 
 * Usage: npm run r2:upload
 * 
 * Reads r2-manifest.json and uploads pending files to R2
 * 
 * Requires environment variables:
 * - R2_ACCOUNT_ID - Cloudflare account ID
 * - R2_ACCESS_KEY_ID - R2 access key
 * - R2_SECRET_ACCESS_KEY - R2 secret key
 * - R2_BUCKET_NAME - R2 bucket name
 * - R2_PUBLIC_URL - Public CDN URL for the bucket
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');

const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'r2-manifest.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');

// Validate environment variables
const requiredEnvVars = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID', 
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.log('\nPlease set these in your .env file');
  process.exit(1);
}

// Initialize R2 client (R2 is S3-compatible)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

async function uploadFile(localPath, r2Key) {
  const fullPath = path.join(UPLOADS_DIR, localPath);
  const fileContent = await fs.readFile(fullPath);
  const contentType = mime.lookup(localPath) || 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: fileContent,
    ContentType: contentType
  });

  await s3Client.send(command);
}

async function uploadToR2() {
  console.log('Starting R2 upload...\n');

  // Check manifest exists
  if (!await fs.pathExists(MANIFEST_PATH)) {
    console.error('❌ Manifest not found. Run: npm run r2:manifest');
    process.exit(1);
  }

  const manifest = await fs.readJSON(MANIFEST_PATH);
  const pendingFiles = manifest.files.filter(f => !f.uploaded);

  if (pendingFiles.length === 0) {
    console.log('✓ All files already uploaded!');
    return;
  }

  console.log(`Found ${pendingFiles.length} files to upload`);
  console.log(`Bucket: ${process.env.R2_BUCKET_NAME}`);
  console.log(`Public URL: ${manifest.r2PublicUrl}\n`);

  let uploaded = 0;
  let failed = 0;

  for (const file of pendingFiles) {
    try {
      process.stdout.write(`[${uploaded + failed + 1}/${pendingFiles.length}] ${file.name}...`);
      
      await uploadFile(file.localPath, file.r2Key);
      
      // Update file record
      file.uploaded = true;
      file.r2Url = `${manifest.r2PublicUrl}/${file.r2Key}`;
      
      uploaded++;
      console.log(' ✓');
    } catch (error) {
      failed++;
      console.log(` ✗ ${error.message}`);
    }
  }

  // Update manifest
  manifest.uploadDate = new Date().toISOString();
  manifest.stats.uploaded = manifest.files.filter(f => f.uploaded).length;
  manifest.stats.pending = manifest.stats.total - manifest.stats.uploaded;

  await fs.writeJSON(MANIFEST_PATH, manifest, { spaces: 2 });

  console.log('\n=== Upload Summary ===');
  console.log(`Successfully uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total uploaded: ${manifest.stats.uploaded}/${manifest.stats.total}`);

  if (failed > 0) {
    console.log('\n⚠️  Some uploads failed. Re-run this command to retry.');
  } else {
    console.log('\n✓ All files uploaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify uploads: npm run r2:verify');
    console.log('2. Update fixture URLs: npm run fixtures:update-urls');
  }
}

// Run upload
uploadToR2().catch(error => {
  console.error('\nUpload failed:', error);
  process.exit(1);
});
