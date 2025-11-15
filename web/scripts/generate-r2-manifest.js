'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Generate or update R2 manifest from local uploads directory
 *
 * Usage: npm run r2:manifest
 *
 * Scans data/uploads/ directory for JPEG files (originals) and creates/updates data/r2-manifest.json
 * This manifest is used to track which files need to be uploaded to R2
 *
 * Filters:
 * - Only includes .jpg and .jpeg files (case-insensitive)
 * - Excludes thumbnail/resized versions (small_, thumbnail_, medium_, large_, xlarge_)
 */

const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');
const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'r2-manifest.json');

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (item.isFile()) {
      // Only include JPEG files (originals)
      const ext = path.extname(item.name).toLowerCase();
      if (ext !== '.jpg' && ext !== '.jpeg') {
        continue;
      }

      // Skip thumbnail/resized versions (small_, thumbnail_, medium_, large_, etc.)
      const sizePrefixes = ['small_', 'thumbnail_', 'medium_', 'large_', 'xlarge_'];
      const hasPrefix = sizePrefixes.some(prefix => item.name.toLowerCase().startsWith(prefix));
      if (hasPrefix) {
        continue;
      }

      const relativePath = path.relative(baseDir, fullPath);
      const stats = await fs.stat(fullPath);

      files.push({
        name: item.name,
        localPath: relativePath,
        fullPath: fullPath,
        size: stats.size,
        category: relativePath.split(path.sep)[0] || 'misc'
      });
    }
  }

  return files;
}

async function generateManifest() {
  console.log('Generating R2 upload manifest...\n');
  
  // Check if uploads directory exists
  if (!await fs.pathExists(UPLOADS_DIR)) {
    console.error(`❌ Uploads directory not found: ${UPLOADS_DIR}`);
    console.log('\nPlease ensure you have:');
    console.log('1. Run "make sync" to get data from production');
    console.log('2. Or manually place files in data/uploads/');
    process.exit(1);
  }

  // Get all files
  const files = await getAllFiles(UPLOADS_DIR);
  
  if (files.length === 0) {
    console.error('❌ No JPEG files found in uploads directory');
    console.log('Only .jpg and .jpeg files are included in the manifest');
    process.exit(1);
  }

  // Load existing manifest if it exists
  let existingManifest = null;
  if (await fs.pathExists(MANIFEST_PATH)) {
    existingManifest = await fs.readJSON(MANIFEST_PATH);
  }

  // Create new manifest
  const manifest = {
    generatedDate: new Date().toISOString(),
    uploadDate: existingManifest?.uploadDate || null,
    r2BucketName: process.env.R2_BUCKET_NAME || 'eonmun-media',
    r2PublicUrl: process.env.R2_PUBLIC_URL || 'https://cdn.eonmun.com',
    files: files.map(file => {
      // Check if this file was in the previous manifest
      const existing = existingManifest?.files?.find(f => f.localPath === file.localPath);
      
      return {
        name: file.name,
        localPath: file.localPath,
        category: file.category,
        size: file.size,
        uploaded: existing?.uploaded || false,
        r2Url: existing?.r2Url || null,
        r2Key: file.localPath.replace(/\\/g, '/')
      };
    }),
    stats: {
      total: files.length,
      uploaded: 0,
      pending: 0
    }
  };

  // Calculate stats
  manifest.stats.uploaded = manifest.files.filter(f => f.uploaded).length;
  manifest.stats.pending = manifest.stats.total - manifest.stats.uploaded;

  // Write manifest
  await fs.writeJSON(MANIFEST_PATH, manifest, { spaces: 2 });
  console.log(`✓ Generated manifest: ${MANIFEST_PATH}\n`);

  // Show summary
  console.log('=== Manifest Summary ===');
  console.log(`Total files: ${manifest.stats.total}`);
  console.log(`Uploaded: ${manifest.stats.uploaded}`);
  console.log(`Pending: ${manifest.stats.pending}`);
  
  // Show breakdown by category
  const byCategory = manifest.files.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nFiles by category:');
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

  console.log('\nNext steps:');
  if (manifest.stats.pending > 0) {
    console.log('1. Upload files to R2: npm run r2:upload');
    console.log('2. Or upload manually via Cloudflare dashboard');
  }
  console.log('3. Verify uploads: npm run r2:verify');
  console.log('4. Update fixture URLs: npm run fixtures:update-urls');
}

// Run
generateManifest().catch(error => {
  console.error('\nFailed to generate manifest:', error);
  process.exit(1);
});
