'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { categories, authors, articles, global, about, artworks } = require('../data/data.json');

async function seedExampleApp() {
  try {
    console.log('Setting up the template...');
    await importSeedData();
    console.log('Ready to go');
  } catch (error) {
    console.log('Could not import seed data');
    console.error(error);
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const initHasRun = await pluginStore.get({ key: 'initHasRun' });
  await pluginStore.set({ key: 'initHasRun', value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'public',
    },
  });

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Parse the file metadata
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    filepath: filePath,
    originalFileName: path.basename(fileName), // Use just the filename, not the full path
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  // For artwork files, create a more descriptive name
  let displayName = name;
  if (name.includes('/')) {
    // Extract meaningful parts from nested path like "artworks/slug/filename"
    const pathParts = name.split('/');
    if (pathParts[0] === 'artworks' && pathParts.length >= 3) {
      const artworkSlug = pathParts[1];
      const filename = pathParts[2].replace(/\.[^/.]+$/, ''); // Remove extension
      displayName = `${artworkSlug}-${filename}`;
    }
  }
  
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${displayName}`,
          caption: displayName,
          name: displayName,
        },
      },
    });
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry }) {
  try {
    // Determine the unique identifier for this model
    const uniqueField = getUniqueFieldForModel(model, entry);
    const uniqueValue = entry[uniqueField];
    
    if (!uniqueValue) {
      console.warn(`No unique identifier found for ${model}, creating new entry`);
      await strapi.documents(`api::${model}.${model}`).create({
        data: entry,
      });
      return;
    }

    // Check if entry already exists
    const existingEntry = await strapi.query(`api::${model}.${model}`).findOne({
      where: {
        [uniqueField]: uniqueValue,
      },
    });

    if (existingEntry) {
      // Update existing entry
      console.log(`Updating existing ${model}: ${uniqueValue}`);
      await strapi.documents(`api::${model}.${model}`).update({
        documentId: existingEntry.documentId,
        data: entry,
      });
    } else {
      // Create new entry
      console.log(`Creating new ${model}: ${uniqueValue}`);
      await strapi.documents(`api::${model}.${model}`).create({
        data: entry,
      });
    }
  } catch (error) {
    console.error({ model, entry, error });
  }
}

// Helper function to determine the unique field for each model
function getUniqueFieldForModel(model, entry) {
  // Define unique fields for each model
  const uniqueFields = {
    article: 'slug',
    category: 'slug',
    author: 'email',
    global: 'siteName', // assuming global has a siteName field
    about: 'title',
    artwork: 'slug',
  };

  const primaryField = uniqueFields[model];
  
  // If the primary field exists in the entry, use it
  if (primaryField && entry[primaryField]) {
    return primaryField;
  }
  
  // Fallback to common unique fields
  const fallbackFields = ['slug', 'title', 'name', 'email'];
  for (const field of fallbackFields) {
    if (entry[field]) {
      return field;
    }
  }
  
  // If no unique field found, return null
  return null;
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];
  const filesCopy = [...files];

  for (const fileName of filesCopy) {
    // Generate the name that would be used for this file
    let searchName = fileName.replace(/\..*$/, ''); // Remove extension
    if (fileName.includes('/')) {
      // Handle nested paths like "artworks/slug/filename.ext"
      const pathParts = fileName.split('/');
      if (pathParts[0] === 'artworks' && pathParts.length >= 3) {
        const artworkSlug = pathParts[1];
        const filename = pathParts[2].replace(/\.[^/.]+$/, ''); // Remove extension
        searchName = `${artworkSlug}-${filename}`;
      }
    }
    
    // Check if the file already exists in Strapi
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: {
        name: searchName,
      },
    });

    if (fileWhereName) {
      // File exists, don't upload it
      existingFiles.push(fileWhereName);
      console.log(`File already exists: ${searchName}`);
    } else {
      // File doesn't exist, upload it
      try {
        const fileData = getFileData(fileName);
        const [file] = await uploadFile(fileData, fileName);
        uploadedFiles.push(file);
        console.log(`Uploaded new file: ${searchName}`);
      } catch (error) {
        console.error(`Error uploading file ${fileName}:`, error);
      }
    }
  }
  const allFiles = [...existingFiles, ...uploadedFiles];
  // If only one file then return only that file
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function updateBlocks(blocks) {
  const updatedBlocks = [];
  for (const block of blocks) {
    if (block.__component === 'shared.media') {
      const uploadedFiles = await checkFileExistsBeforeUpload([block.file]);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file name on the block with the actual file
      blockCopy.file = uploadedFiles;
      updatedBlocks.push(blockCopy);
    } else if (block.__component === 'shared.slider') {
      // Get files already uploaded to Strapi or upload new files
      const existingAndUploadedFiles = await checkFileExistsBeforeUpload(block.files);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file names on the block with the actual files
      blockCopy.files = existingAndUploadedFiles;
      // Push the updated block
      updatedBlocks.push(blockCopy);
    } else {
      // Just push the block as is
      updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}

async function importArticles() {
  for (const article of articles) {
    const cover = await checkFileExistsBeforeUpload([`${article.slug}.jpg`]);
    const updatedBlocks = await updateBlocks(article.blocks);

    await createEntry({
      model: 'article',
      entry: {
        ...article,
        cover,
        blocks: updatedBlocks,
        // Make sure it's not a draft
        publishedAt: Date.now(),
      },
    });
  }
}

async function importGlobal() {
  const favicon = await checkFileExistsBeforeUpload(['favicon.png']);
  const shareImage = await checkFileExistsBeforeUpload(['default-image.png']);
  return createEntry({
    model: 'global',
    entry: {
      ...global,
      favicon,
      // Make sure it's not a draft
      publishedAt: Date.now(),
      defaultSeo: {
        ...global.defaultSeo,
        shareImage,
      },
    },
  });
}

async function importAbout() {
  const updatedBlocks = await updateBlocks(about.blocks);

  await createEntry({
    model: 'about',
    entry: {
      ...about,
      blocks: updatedBlocks,
      // Make sure it's not a draft
      publishedAt: Date.now(),
    },
  });
}

async function importCategories() {
  for (const category of categories) {
    await createEntry({ model: 'category', entry: category });
  }
}

async function importAuthors() {
  for (const author of authors) {
    const avatar = await checkFileExistsBeforeUpload([author.avatar]);

    await createEntry({
      model: 'author',
      entry: {
        ...author,
        avatar,
      },
    });
  }
}

async function importArtworks() {
  for (const artwork of artworks) {
    try {
      // Get the artwork folder path
      const artworkFolder = path.join('data', 'uploads', 'artworks', artwork.slug);
      
      // Check if the folder exists
      if (!fs.existsSync(artworkFolder)) {
        console.warn(`Artwork folder not found: ${artworkFolder}`);
        // Create artwork entry without files
        await createEntry({ model: 'artwork', entry: artwork });
        continue;
      }
      
      // List all files in the artwork folder
      const filesInFolder = fs.readdirSync(artworkFolder);
      const imageFiles = filesInFolder.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      });
      
      console.log(`Found ${imageFiles.length} image files for artwork: ${artwork.slug}`);
      
      // Upload files if any exist
      let uploadedFiles = [];
      if (imageFiles.length > 0) {
        const filePathsWithSlugs = imageFiles.map(file => `artworks/${artwork.slug}/${file}`);
        uploadedFiles = await checkFileExistsBeforeUpload(filePathsWithSlugs);
        console.log(`Uploaded/found ${Array.isArray(uploadedFiles) ? uploadedFiles.length : 1} files for artwork: ${artwork.slug}`);
      }
      
      // Create the artwork entry with the uploaded files
      await createEntry({ 
        model: 'artwork', 
        entry: {
          ...artwork,
          images: uploadedFiles,
        }
      });
      
    } catch (error) {
      console.error(`Error importing artwork ${artwork.slug}:`, error);
    }
  }
}

async function importSeedData() {
  // Allow read of application content types
  await setPublicPermissions({
    article: ['find', 'findOne'],
    category: ['find', 'findOne'],
    author: ['find', 'findOne'],
    global: ['find', 'findOne'],
    about: ['find', 'findOne'],
  });

  // Create all entries
  await importCategories();
  await importAuthors();
  await importArticles();
  await importGlobal();
  await importAbout();
  await importArtworks();
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await seedExampleApp();
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
