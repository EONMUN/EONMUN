'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Update fixture file paths to use R2 URLs
 * 
 * Usage: npm run fixtures:update-urls
 * 
 * Reads data/data.json and replaces local file paths with R2 CDN URLs
 * Uses r2-manifest.json to map local paths to R2 URLs
 */

const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'r2-manifest.json');
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');

function findR2Url(manifest, localPath) {
  // Normalize path for comparison
  const normalizedPath = localPath.replace(/\\/g, '/');
  
  const file = manifest.files.find(f => {
    const fileLocalPath = f.localPath.replace(/\\/g, '/');
    return fileLocalPath === normalizedPath || 
           fileLocalPath.endsWith(normalizedPath) ||
           normalizedPath.endsWith(path.basename(fileLocalPath));
  });

  return file?.r2Url || null;
}

function updateUrls(obj, manifest, stats) {
  if (Array.isArray(obj)) {
    return obj.map(item => updateUrls(item, manifest, stats));
  }
  
  if (obj && typeof obj === 'object') {
    const updated = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if this is a file path field
      const isFilePath = ['cover', 'avatar', 'image', 'file', 'shareImage'].includes(key);
      
      if (isFilePath && typeof value === 'string' && !value.startsWith('http')) {
        const r2Url = findR2Url(manifest, value);
        if (r2Url) {
          updated[key] = r2Url;
          stats.updated++;
          console.log(`  ✓ ${key}: ${path.basename(value)} → R2`);
        } else {
          updated[key] = value;
          stats.notFound++;
          console.log(`  ⚠ ${key}: ${path.basename(value)} (not found in manifest)`);
        }
      } else if (key === 'images' && Array.isArray(value)) {
        // Handle arrays of images
        updated[key] = value.map(img => {
          if (typeof img === 'string' && !img.startsWith('http')) {
            const r2Url = findR2Url(manifest, img);
            if (r2Url) {
              stats.updated++;
              console.log(`  ✓ images[]: ${path.basename(img)} → R2`);
              return r2Url;
            } else {
              stats.notFound++;
              console.log(`  ⚠ images[]: ${path.basename(img)} (not found)`);
              return img;
            }
          }
          return img;
        });
      } else {
        updated[key] = updateUrls(value, manifest, stats);
      }
    }
    
    return updated;
  }
  
  return obj;
}

async function updateFixtureUrls() {
  console.log('Updating fixture URLs to R2...\n');

  // Check files exist
  if (!await fs.pathExists(MANIFEST_PATH)) {
    console.error('❌ Manifest not found. Run: npm run r2:manifest');
    process.exit(1);
  }

  if (!await fs.pathExists(FIXTURES_DIR)) {
    console.error('❌ Fixtures directory not found');
    process.exit(1);
  }

  const manifest = await fs.readJSON(MANIFEST_PATH);
  
  // Check that files are uploaded
  const uploadedCount = manifest.files.filter(f => f.uploaded).length;
  if (uploadedCount === 0) {
    console.error('❌ No files have been uploaded to R2 yet.');
    console.log('Run: npm run r2:upload');
    process.exit(1);
  }

  console.log(`Using ${uploadedCount} uploaded files from manifest\n`);

  // Create backups directory
  await fs.ensureDir(BACKUP_DIR);

  // Get all fixture JSON files
  const fixtureFiles = await fs.readdir(FIXTURES_DIR);
  const jsonFiles = fixtureFiles.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.error('❌ No JSON fixture files found');
    process.exit(1);
  }

  console.log(`Found ${jsonFiles.length} fixture files to update\n`);

  const stats = { updated: 0, notFound: 0 };

  for (const fileName of jsonFiles) {
    const fixturePath = path.join(FIXTURES_DIR, fileName);
    const backupPath = path.join(BACKUP_DIR, `${fileName}.backup`);

    console.log(`Processing ${fileName}...`);

    // Backup original
    await fs.copy(fixturePath, backupPath);

    // Load and update
    const data = await fs.readJSON(fixturePath);
    const updatedData = updateUrls(data, manifest, stats);

    // Write updated data
    await fs.writeJSON(fixturePath, updatedData, { spaces: 2 });
  }

  console.log('\n=== Update Summary ===');
  console.log(`Fixture files processed: ${jsonFiles.length}`);
  console.log(`URLs updated: ${stats.updated}`);
  console.log(`Not found in manifest: ${stats.notFound}`);
  console.log(`\n✓ Updated fixtures written to: ${FIXTURES_DIR}`);
  console.log(`Backups saved to: ${BACKUP_DIR}`);

  if (stats.notFound > 0) {
    console.log('\n⚠️  Some files were not found in the R2 manifest.');
    console.log('This is normal if those files don\'t need to be on R2.');
  }

  console.log('\nNext step:');
  console.log('  npm run db:fixtures:load (to test with updated URLs)');
}

// Run update
updateFixtureUrls().catch(error => {
  console.error('\nUpdate failed:', error);
  process.exit(1);
});
