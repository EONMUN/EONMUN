#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs-extra');

// Import data to local Strapi
async function importToLocal() {
  console.log('Starting import to local Strapi...\n');

  const latestExport = path.join(__dirname, '../data/api-sync/latest.json');
  
  if (!await fs.pathExists(latestExport)) {
    console.error('\n❌ No production data export found!\n');
    console.error('The production data export should be committed to the repository.');
    console.error('If you need to create or update it:');
    console.error('  1. Ensure you have PROD_STRAPI_URL and PROD_STRAPI_API_TOKEN in strapi/.env');
    console.error('  2. Run: make sync-update');
    console.error('  3. Commit the updated export files\n');
    throw new Error('No export found at data/api-sync/latest.json');
  }

  const data = await fs.readJson(latestExport);
  console.log(`Importing data from: ${data.timestamp}`);
  console.log(`Source: ${data.source}\n`);
  
  // Helper to upload media file
  async function uploadMedia(mediaInfo) {
    try {
      const { localPath, name, alternativeText, caption, hash, ext, mime } = mediaInfo;
      
      if (!localPath) {
        console.error(`No localPath for media: ${name}`);
        return null;
      }

      if (!await fs.pathExists(localPath)) {
        console.error(`Media file not found: ${localPath}`);
        return null;
      }

      // Check if file already exists by hash (more reliable than name)
      const existingFile = await strapi.query('plugin::upload.file').findOne({
        where: { 
          $or: [
            { hash: hash },
            { name: name }
          ]
        }
      });

      if (existingFile) {
        console.log(`  Media already exists: ${name}`);
        return existingFile;
      }

      // Read file data
      const stats = await fs.stat(localPath);
      const fileName = path.basename(localPath);
      
      const [uploadedFile] = await strapi
        .plugin('upload')
        .service('upload')
        .upload({
          files: {
            filepath: localPath,
            originalFileName: fileName,
            mimetype: mime || 'application/octet-stream',
            size: stats.size
          },
          data: {
            fileInfo: {
              alternativeText: alternativeText || `Imported media: ${name}`,
              caption: caption || name,
              name: name || path.basename(fileName, ext)
            }
          }
        });

      console.log(`  ✓ Uploaded media: ${name}`);
      return uploadedFile;
    } catch (error) {
      console.error(`  ✗ Failed to upload ${mediaInfo.name || 'unknown'}:`, error.message);
      return null;
    }
  }

  // Map old media IDs to new ones
  const mediaIdMap = new Map();

  // Upload all media first
  if (data.media && data.media.length > 0) {
    console.log('Uploading media files...');
    for (const mediaInfo of data.media) {
      const uploaded = await uploadMedia(mediaInfo);
      if (uploaded) {
        mediaIdMap.set(mediaInfo.id, uploaded.id);
      }
    }
    console.log(`✓ Processed ${data.media.length} media files\n`);
  }

  // Helper to clean and update references in data
  function cleanAndUpdateReferences(obj, isTopLevel = true) {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => cleanAndUpdateReferences(item, false)).filter(Boolean);
    }

    if (typeof obj === 'object') {
      // Check if this is a media reference
      if (obj.id && obj.localPath && obj.originalUrl) {
        const newId = mediaIdMap.get(obj.id);
        return newId ? { id: newId } : null;
      }

      // Only treat nested objects as relations, not top-level content entries
      if (!isTopLevel && obj.id && obj.documentId && (obj.createdAt || obj.updatedAt) && 
          !obj.url && !obj.mime && !obj.hash && !obj.ext && !obj.localPath) {
        // This looks like a populated relation (not media), return just the ID reference
        return { id: obj.id };
      }

      // Recursively update all properties
      const updated = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip system fields completely
        if (['id', 'createdAt', 'updatedAt', 'publishedAt', 'documentId', 'locale'].includes(key)) {
          continue;
        }
        
        // Skip relation fields that might cause issues
        if (key === 'collections' && Array.isArray(value)) {
          // Skip collections relation for now to avoid circular dependencies
          continue;
        }

        // Skip localizations to avoid complexity
        if (key === 'localizations') {
          continue;
        }

        updated[key] = cleanAndUpdateReferences(value, false);
      }
      return updated;
    }

    return obj;
  }

  // Import each content type
  for (const [contentType, entries] of Object.entries(data.contentTypes)) {
    if (!entries || entries.length === 0) {
      console.log(`Skipping ${contentType} (no data)`);
      continue;
    }

    console.log(`\nImporting ${contentType}...`);
    
    const singularType = contentType.replace(/s$/, ''); // Remove 's' for API name
    let imported = 0;

    for (const entry of entries) {
      if (!entry) continue; // Skip null entries

      try {
        // Clean and update references
        const processedEntry = cleanAndUpdateReferences(entry);
        
        // Remove system fields and flatten structure
        const { id, attributes, ...cleanEntry } = processedEntry;
        const entryData = attributes ? { ...attributes, ...cleanEntry } : cleanEntry;

        // Determine if this is a single type or collection
        const isSingleType = ['global', 'about', 'home'].includes(singularType);

        if (isSingleType) {
          try {
            // Check if single type exists
            const existingDoc = await strapi.documents(`api::${singularType}.${singularType}`).findFirst();
            
            if (existingDoc) {
              // Update existing single type
              const updatedDoc = await strapi.documents(`api::${singularType}.${singularType}`).update({
                data: entryData
              });
              
              // Explicitly publish the document
              await strapi.documents(`api::${singularType}.${singularType}`).publish({
                documentId: updatedDoc.documentId
              });
              
              console.log(`  ✓ Updated and published ${singularType}`);
            } else {
              // Create new single type
              const newDoc = await strapi.documents(`api::${singularType}.${singularType}`).create({
                data: entryData
              });
              
              // Explicitly publish the document
              await strapi.documents(`api::${singularType}.${singularType}`).publish({
                documentId: newDoc.documentId
              });
              
              console.log(`  ✓ Created and published ${singularType}`);
            }
          } catch (singleTypeError) {
            console.error(`  ✗ Failed to handle single type ${singularType}:`, singleTypeError.message);
          }
        } else {
          // For collections, check if entry exists by unique field
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
            // Update existing and publish
            const updatedDoc = await strapi.documents(`api::${singularType}.${singularType}`).update({
              documentId: existingEntry.documentId,
              data: entryData
            });
            
            // Explicitly publish the document
            await strapi.documents(`api::${singularType}.${singularType}`).publish({
              documentId: updatedDoc.documentId
            });
            
            console.log(`  ✓ Updated and published: ${entryData.title || entryData.slug || uniqueField || 'entry'}`);
          } else {
            // Create new and publish
            const newDoc = await strapi.documents(`api::${singularType}.${singularType}`).create({
              data: entryData
            });
            
            // Explicitly publish the document
            await strapi.documents(`api::${singularType}.${singularType}`).publish({
              documentId: newDoc.documentId
            });
            
            console.log(`  ✓ Created and published: ${entryData.title || entryData.slug || uniqueField || 'new entry'}`);
          }
        }
        
        imported++;
      } catch (error) {
        console.error(`  ✗ Failed to import entry:`, error.message);
        if (typeof entryData !== 'undefined') {
          console.error(`  Entry data:`, JSON.stringify(entryData, null, 2));
        }
        // Continue with other entries
      }
    }

    console.log(`✓ Imported ${imported}/${entries.length} ${contentType}`);
  }

  // Ensure home content exists and has valid slides
  console.log('\nEnsuring home content is valid...');
  try {
    const existingHome = await strapi.documents('api::home.home').findFirst();
    
    if (!existingHome) {
      // No home content exists, create one with artworks as slides
      const artworks = await strapi.query('api::artwork.artwork').findMany({
        limit: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      const slideArtworks = artworks.length > 0 
        ? artworks.map(artwork => ({ id: artwork.id })) 
        : [];
      
      const newHome = await strapi.documents('api::home.home').create({
        data: {
          slides: slideArtworks
        }
      });
      
      await strapi.documents('api::home.home').publish({
        documentId: newHome.documentId
      });
      
      console.log('  ✓ Created home content with artwork slides');
    } else if (!existingHome.slides || existingHome.slides.length === 0) {
      // Home exists but has no slides, add some artworks
      const artworks = await strapi.query('api::artwork.artwork').findMany({
        limit: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      const slideArtworks = artworks.length > 0 
        ? artworks.map(artwork => ({ id: artwork.id })) 
        : [];
      
      const updatedHome = await strapi.documents('api::home.home').update({
        documentId: existingHome.documentId,
        data: {
          slides: slideArtworks
        }
      });
      
      await strapi.documents('api::home.home').publish({
        documentId: updatedHome.documentId
      });
      
      console.log('  ✓ Updated home content with artwork slides');
    } else {
      console.log('  ✓ Home content already has slides');
    }
  } catch (error) {
    console.error('  ✗ Failed to ensure home content:', error.message);
  }

  // Create sample products for testing
  console.log('\nCreating sample products...');
  try {
    const sampleProducts = [
      {
        title: 'Limited Edition Print',
        slug: 'limited-edition-print',
        description: 'High-quality giclee print on museum-grade paper',
        price: 150,
        currency: 'USD',
        product_type: 'print',
        is_digital: false,
        is_available: true,
        stock_quantity: 25,
        shipping_required: true,
        featured: true,
        sku: 'PRINT-001'
      },
      {
        title: 'Digital Artwork Collection',
        slug: 'digital-artwork-collection',
        description: 'High-resolution digital files for personal use',
        price: 50,
        currency: 'USD',
        product_type: 'digital',
        is_digital: true,
        is_available: true,
        stock_quantity: 999,
        shipping_required: false,
        featured: false,
        sku: 'DIGITAL-001'
      },
      {
        title: 'Artist Merchandise Bundle',
        slug: 'artist-merchandise-bundle',
        description: 'Exclusive t-shirt and sticker pack',
        price: 75,
        currency: 'USD',
        product_type: 'merchandise',
        is_digital: false,
        is_available: true,
        stock_quantity: 50,
        shipping_required: true,
        featured: true,
        sku: 'MERCH-001'
      },
      {
        title: 'Art Book: Contemporary Collection',
        slug: 'art-book-contemporary-collection',
        description: 'Beautiful hardcover book featuring latest works',
        price: 120,
        currency: 'USD',
        product_type: 'book',
        is_digital: false,
        is_available: true,
        stock_quantity: 100,
        shipping_required: true,
        featured: false,
        sku: 'BOOK-001'
      }
    ];

    for (const productData of sampleProducts) {
      // Check if product already exists by SKU
      const existingProduct = await strapi.query('api::product.product').findOne({
        where: { sku: productData.sku }
      });

      if (existingProduct) {
        console.log(`  ✓ Product already exists: ${productData.title}`);
        continue;
      }

      // Create the product
      const newProduct = await strapi.documents('api::product.product').create({
        data: productData
      });

      // Publish the product
      await strapi.documents('api::product.product').publish({
        documentId: newProduct.documentId
      });

      console.log(`  ✓ Created and published product: ${productData.title}`);
    }

    console.log(`✓ Sample products created successfully`);
  } catch (error) {
    console.error('  ✗ Failed to create sample products:', error.message);
  }

  console.log('\n🎉 Import completed successfully!');
  console.log('Your local Strapi now has the production data.');
}

// Main function to run with Strapi context
async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  
  console.log('Initializing Strapi...');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  
  app.log.level = 'error';
  
  try {
    await importToLocal();
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await app.destroy();
    process.exit(0);
  }
}

// Run the import
main().catch(console.error);