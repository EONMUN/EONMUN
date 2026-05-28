'use strict';

const fs = require('fs-extra');
const path = require('path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

/**
 * Pull fixture-referenced R2 assets into a local Git LFS-backed mirror.
 *
 * Usage: npm run r2:pull
 *
 * Scans project source files for `https://r2.eonmun.com/...` URLs, downloads
 * the referenced assets into `data/uploads/`, and updates `data/r2-manifest.json`
 * so the local mirror is treated as already synced with the current R2 bucket.
 */

const REPO_ROOT = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(REPO_ROOT, 'data', 'uploads');
const MANIFEST_PATH = path.join(REPO_ROOT, 'data', 'r2-manifest.json');
const R2_PREFIX = 'https://r2.eonmun.com/';
const SCAN_ROOTS = [
  path.join(REPO_ROOT, 'fixtures'),
  path.join(REPO_ROOT, 'code', 'src'),
];
const TEXT_EXTENSIONS = new Set([
  '.astro',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mdx',
  '.txt',
]);
const URL_PATTERN = /https:\/\/r2\.eonmun\.com\/[^\s"'`<>()]+/g;

async function* walk(dir) {
  if (!(await fs.pathExists(dir))) {
    return;
  }

  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function collectR2Urls() {
  const urls = new Set();

  for (const root of SCAN_ROOTS) {
    for await (const filePath of walk(root)) {
      if (!TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
        continue;
      }

      const text = await fs.readFile(filePath, 'utf8');
      for (const match of text.matchAll(URL_PATTERN)) {
        const url = match[0];
        if (url.startsWith(R2_PREFIX)) {
          urls.add(url);
        }
      }
    }
  }

  return Array.from(urls).sort();
}

function getFileNameFromUrl(url) {
  const parsed = new URL(url);
  return decodeURIComponent(path.basename(parsed.pathname));
}

async function downloadAsset(url, destinationPath) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  await fs.ensureDir(path.dirname(destinationPath));
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destinationPath));
}

async function updateManifest(downloadedUrls) {
  let existingManifest = null;
  if (await fs.pathExists(MANIFEST_PATH)) {
    existingManifest = await fs.readJSON(MANIFEST_PATH);
  }

  const files = [];
  for (const url of downloadedUrls) {
    const fileName = getFileNameFromUrl(url);
    const fullPath = path.join(UPLOADS_DIR, fileName);
    const stats = await fs.stat(fullPath);
    const existing = existingManifest?.files?.find((file) => file.localPath === fileName);

    files.push({
      name: fileName,
      localPath: fileName,
      category: 'r2',
      size: stats.size,
      uploaded: existing?.uploaded ?? true,
      r2Url: existing?.r2Url ?? url,
      r2Key: existing?.r2Key ?? fileName,
    });
  }

  const manifest = {
    generatedDate: new Date().toISOString(),
    uploadDate: existingManifest?.uploadDate ?? new Date().toISOString(),
    r2BucketName: process.env.R2_BUCKET_NAME || existingManifest?.r2BucketName || 'eonmun-media',
    r2PublicUrl: existingManifest?.r2PublicUrl || 'https://r2.eonmun.com',
    files,
    stats: {
      total: files.length,
      uploaded: files.filter((file) => file.uploaded).length,
      pending: files.filter((file) => !file.uploaded).length,
    },
  };

  await fs.ensureDir(path.dirname(MANIFEST_PATH));
  await fs.writeJSON(MANIFEST_PATH, manifest, { spaces: 2 });
}

async function pullAssets() {
  console.log('Scanning source files for R2 asset URLs...\n');
  const urls = await collectR2Urls();

  if (urls.length === 0) {
    console.error('❌ No R2 URLs found under fixtures/ or code/src/');
    process.exit(1);
  }

  await fs.ensureDir(UPLOADS_DIR);

  let downloaded = 0;
  let skipped = 0;

  for (const url of urls) {
    const fileName = getFileNameFromUrl(url);
    const destinationPath = path.join(UPLOADS_DIR, fileName);

    if (await fs.pathExists(destinationPath)) {
      skipped++;
      console.log(`• ${fileName} (already present)`);
      continue;
    }

    process.stdout.write(`↓ ${fileName} ... `);
    await downloadAsset(url, destinationPath);
    downloaded++;
    console.log('ok');
  }

  await updateManifest(urls);

  console.log('\n=== Pull Summary ===');
  console.log(`Total referenced R2 assets: ${urls.length}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Already present: ${skipped}`);
  console.log(`Local mirror: ${UPLOADS_DIR}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  console.log('\nNext steps:');
  console.log('1. Review the downloaded files under data/uploads/');
  console.log('2. Add and commit them so Git LFS stores them as LFS pointers.');
  console.log('3. Run npm run r2:verify to confirm the referenced R2 URLs are reachable.');
  console.log('4. When new local-only assets are added later, run npm run r2:manifest then npm run r2:upload.');
}

pullAssets().catch((error) => {
  console.error('\nFailed to pull R2 assets:', error);
  process.exit(1);
});
