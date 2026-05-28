'use strict';

require('dotenv').config({ path: '.env.production' });

const fs = require('fs-extra');
const path = require('path');

/**
 * Verify all R2 uploads are accessible
 * 
 * Usage: npm run r2:verify
 * 
 * Checks that all uploaded files return 200 status from R2 URLs
 */

const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'r2-manifest.json');

async function verifyUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function verifyR2Uploads() {
  console.log('Verifying R2 uploads...\n');

  if (!await fs.pathExists(MANIFEST_PATH)) {
    console.error('❌ Manifest not found. Run: npm run r2:manifest');
    process.exit(1);
  }

  const manifest = await fs.readJSON(MANIFEST_PATH);
  const uploadedFiles = manifest.files.filter(f => f.uploaded && f.r2Url);

  if (uploadedFiles.length === 0) {
    console.log('No uploaded files to verify.');
    console.log('Run: npm run r2:upload');
    return;
  }

  console.log(`Verifying ${uploadedFiles.length} files...\n`);

  let verified = 0;
  let failed = 0;
  const failedFiles = [];

  for (const file of uploadedFiles) {
    process.stdout.write(`[${verified + failed + 1}/${uploadedFiles.length}] ${file.name}...`);
    
    const isAccessible = await verifyUrl(file.r2Url);
    
    if (isAccessible) {
      verified++;
      console.log(' ✓');
    } else {
      failed++;
      failedFiles.push(file);
      console.log(' ✗');
    }
  }

  console.log('\n=== Verification Summary ===');
  console.log(`Verified: ${verified}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed files:');
    failedFiles.forEach(file => {
      console.log(`  - ${file.name}: ${file.r2Url}`);
    });
    console.log('\nThese files may need to be re-uploaded or have incorrect URLs.');
  } else {
    console.log('\n✓ All files are accessible!');
    console.log('\nNext step:');
    console.log('  npm run r2:update-fixtures');
  }
}

// Run verification
verifyR2Uploads().catch(error => {
  console.error('\nVerification failed:', error);
  process.exit(1);
});
