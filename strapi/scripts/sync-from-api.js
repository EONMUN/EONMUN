#!/usr/bin/env node
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const fs = require('fs-extra');

// Validate required environment variables
if (!process.env.PROD_STRAPI_URL) {
  throw new Error('PROD_STRAPI_URL environment variable is required');
}

if (!process.env.PROD_STRAPI_API_TOKEN) {
  throw new Error('PROD_STRAPI_API_TOKEN environment variable is required');
}

// Configuration
const config = {
  source: {
    url: process.env.PROD_STRAPI_URL,
    apiToken: process.env.PROD_STRAPI_API_TOKEN
  },
  contentTypes: {
    'articles': 'collection',
    'authors': 'collection', 
    'categories': 'collection',
    'artworks': 'collection',
    'global': 'single',
    'about': 'single',
    'home': 'single'
  },
  mediaDir: path.join(__dirname, '../data/api-sync/media'),
  dataDir: path.join(__dirname, '../data/api-sync')
};

// API client for source Strapi
const sourceApi = axios.create({
  baseURL: `${config.source.url}/api`,
  headers: {
    'Authorization': `Bearer ${config.source.apiToken}`
  }
});

// Helper to fetch all pages of data
async function fetchAllPages(endpoint, params = {}) {
  let page = 1;
  let allData = [];
  let hasMore = true;

  while (hasMore) {
    try {
      
      const response = await sourceApi.get(endpoint, {
        params: {
          ...params,
          'pagination[page]': page,
          'pagination[pageSize]': 100,
          'populate': '*'
        }
      });

      const { data, meta } = response.data;
      allData = allData.concat(data);

      if (meta?.pagination) {
        hasMore = page < meta.pagination.pageCount;
        page++;
      } else {
        hasMore = false;
      }

      console.log(`  Fetched page ${page - 1} (${allData.length} items)`);
    } catch (error) {
      console.error(`Error fetching ${endpoint} page ${page}:`, error.message);
      hasMore = false;
    }
  }

  return allData;
}

// Download media file
async function downloadMedia(url, filepath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url.startsWith('http') ? url : `${config.source.url}${url}`,
      responseType: 'stream'
    });

    await fs.ensureDir(path.dirname(filepath));
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
  }
}

// Process media in data recursively
async function processMediaInData(data, mediaMap = new Map()) {
  if (!data) return data;

  if (Array.isArray(data)) {
    return Promise.all(data.map(item => processMediaInData(item, mediaMap)));
  }

  if (typeof data === 'object') {
    // Check if this is a media object
    if (data.url && (data.mime || data.ext)) {
      const mediaUrl = data.url;
      const fileName = path.basename(mediaUrl);
      const localPath = path.join(config.mediaDir, fileName);

      if (!mediaMap.has(mediaUrl)) {
        console.log(`  Downloading media: ${fileName}`);
        await downloadMedia(mediaUrl, localPath);
        mediaMap.set(mediaUrl, {
          ...data,
          localPath,
          originalUrl: mediaUrl
        });
      }

      return mediaMap.get(mediaUrl);
    }

    // Recursively process all properties
    const processed = {};
    for (const [key, value] of Object.entries(data)) {
      processed[key] = await processMediaInData(value, mediaMap);
    }
    return processed;
  }

  return data;
}

// Export all data from production
async function exportFromProduction() {
  console.log('Starting export from production Strapi...\n');

  await fs.ensureDir(config.dataDir);
  await fs.ensureDir(config.mediaDir);

  const exportData = {
    timestamp: new Date().toISOString(),
    source: config.source.url,
    contentTypes: {},
    media: []
  };

  const mediaMap = new Map();

  // Fetch each content type
  for (const [contentType, apiType] of Object.entries(config.contentTypes)) {
    console.log(`\nFetching ${contentType}...`);
    
    try {
      let data;
      
      if (apiType === 'single') {
        // Single types use different endpoint structure
        const response = await sourceApi.get(`/${contentType}`, {
          params: {
            'populate': '*'
          }
        });
        data = [response.data.data]; // Wrap single item in array for consistency
      } else {
        // Collection types use pagination
        data = await fetchAllPages(`/${contentType}`);
      }
      
      // Process media in the data
      const processedData = await processMediaInData(data, mediaMap);
      
      exportData.contentTypes[contentType] = processedData;
      console.log(`✓ Exported ${data.length} ${contentType}`);
    } catch (error) {
      console.error(`✗ Failed to export ${contentType}:`, error.message);
    }
  }

  // Save media mapping
  exportData.media = Array.from(mediaMap.values());

  // Write export file
  const exportFile = path.join(config.dataDir, `export-${Date.now()}.json`);
  await fs.writeJson(exportFile, exportData, { spaces: 2 });
  
  // Create symlink to latest
  const latestLink = path.join(config.dataDir, 'latest.json');
  if (await fs.pathExists(latestLink)) {
    await fs.unlink(latestLink);
  }
  await fs.symlink(path.basename(exportFile), latestLink);

  console.log(`\n✓ Export completed: ${exportFile}`);
  console.log(`  - Content types: ${Object.keys(exportData.contentTypes).length}`);
  console.log(`  - Media files: ${exportData.media.length}`);

  return exportFile;
}

// Import data to local Strapi
async function importToLocal(exportFile) {
  console.log('\nStarting import to local Strapi...\n');

  const data = await fs.readJson(exportFile);
  
  // Helper to upload media file
  async function uploadMedia(mediaInfo) {
    try {
      const { localPath, name, alternativeText, caption } = mediaInfo;
      
      if (!await fs.pathExists(localPath)) {
        console.error(`Media file not found: ${localPath}`);
        return null;
      }

      // Check if file already exists
      const existingFile = await strapi.query('plugin::upload.file').findOne({
        where: { name }
      });

      if (existingFile) {
        console.log(`  Media already exists: ${name}`);
        return existingFile;
      }

      // Upload new file
      const stats = await fs.stat(localPath);
      
      const [uploadedFile] = await strapi
        .plugin('upload')
        .service('upload')
        .upload({
          files: {
            path: localPath,
            name: path.basename(localPath),
            type: mediaInfo.mime,
            size: stats.size
          },
          data: {
            fileInfo: {
              alternativeText,
              caption,
              name
            }
          }
        });

      console.log(`  ✓ Uploaded media: ${name}`);
      return uploadedFile;
    } catch (error) {
      console.error(`  ✗ Failed to upload ${mediaInfo.name}:`, error.message);
      return null;
    }
  }

  // Map old media IDs to new ones
  const mediaIdMap = new Map();

  // Upload all media first
  console.log('Uploading media files...');
  for (const mediaInfo of data.media) {
    const uploaded = await uploadMedia(mediaInfo);
    if (uploaded) {
      mediaIdMap.set(mediaInfo.id, uploaded.id);
    }
  }

  // Helper to update media references in data
  function updateMediaReferences(obj) {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map(updateMediaReferences);
    }

    if (typeof obj === 'object') {
      // Check if this is a media reference
      if (obj.id && obj.localPath) {
        const newId = mediaIdMap.get(obj.id);
        return newId ? { id: newId } : null;
      }

      // Recursively update all properties
      const updated = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip certain fields
        if (['id', 'createdAt', 'updatedAt', 'publishedAt', 'documentId'].includes(key)) {
          continue;
        }
        updated[key] = updateMediaReferences(value);
      }
      return updated;
    }

    return obj;
  }

  // Import each content type
  for (const [contentType, entries] of Object.entries(data.contentTypes)) {
    console.log(`\nImporting ${contentType}...`);
    
    const singularType = contentType.slice(0, -1); // Remove 's' for API name
    let imported = 0;

    for (const entry of entries) {
      try {
        // Update media references
        const processedEntry = updateMediaReferences(entry);
        
        // Remove system fields
        const { id, attributes, ...cleanEntry } = processedEntry;
        const entryData = attributes ? { ...attributes, ...cleanEntry } : cleanEntry;

        // Check if entry exists (by slug or unique field)
        const uniqueField = entryData.slug || entryData.email || entryData.title;
        let existingEntry = null;

        if (uniqueField) {
          existingEntry = await strapi.query(`api::${singularType}.${singularType}`).findOne({
            where: { 
              ...(entryData.slug && { slug: entryData.slug }),
              ...(entryData.email && { email: entryData.email }),
              ...(!entryData.slug && !entryData.email && entryData.title && { title: entryData.title })
            }
          });
        }

        if (existingEntry) {
          // Update existing
          await strapi.documents(`api::${singularType}.${singularType}`).update({
            documentId: existingEntry.documentId,
            data: {
              ...entryData,
              publishedAt: new Date()
            }
          });
          console.log(`  ✓ Updated: ${uniqueField}`);
        } else {
          // Create new
          await strapi.documents(`api::${singularType}.${singularType}`).create({
            data: {
              ...entryData,
              publishedAt: new Date()
            }
          });
          console.log(`  ✓ Created: ${uniqueField || 'new entry'}`);
        }
        
        imported++;
      } catch (error) {
        console.error(`  ✗ Failed to import entry:`, error.message);
      }
    }

    console.log(`✓ Imported ${imported}/${entries.length} ${contentType}`);
  }

  console.log('\n✓ Import completed successfully!');
}

// Main sync function
async function syncFromApi() {
  try {
    // Check if we're running inside Strapi or standalone
    const isStandaloneExport = !global.strapi;

    if (isStandaloneExport) {
      // Just export data
      console.log('Running in standalone mode - export only\n');
      await exportFromProduction();
      
      console.log('\nTo import this data, run:');
      console.log('  npm run import:api');
      
    } else {
      // Running inside Strapi - import data
      console.log('Running inside Strapi - import mode\n');
      
      const latestExport = path.join(config.dataDir, 'latest.json');
      
      if (!await fs.pathExists(latestExport)) {
        throw new Error('No export found. Run the export first: node scripts/sync-from-api.js');
      }

      await importToLocal(latestExport);
    }

  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

// Check if running directly or being imported by Strapi
if (require.main === module) {
  // Running standalone - just export
  syncFromApi().catch(console.error);
} else {
  // Being imported - run with Strapi context
  module.exports = async () => {
    const { createStrapi, compileStrapi } = require('@strapi/strapi');
    
    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();
    
    app.log.level = 'error';
    
    await syncFromApi();
    await app.destroy();
    
    process.exit(0);
  };
}