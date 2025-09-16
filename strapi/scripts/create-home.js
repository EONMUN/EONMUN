#!/usr/bin/env node
'use strict';

// Create basic home content
async function createHome() {
  console.log('Creating basic home content...\n');

  try {
    // Check if home already exists
    const existingHome = await strapi.documents('api::home.home').findFirst();

    if (existingHome) {
      console.log(`✓ Home content already exists`);
      return;
    }

    // Create new home with minimal data
    const newHome = await strapi.documents('api::home.home').create({
      data: {
        slides: [] // Empty slides array to satisfy the schema
      }
    });

    // Publish it
    await strapi.documents('api::home.home').publish({
      documentId: newHome.documentId
    });

    console.log(`✓ Created and published home content`);
    
  } catch (error) {
    console.error('Failed to create home content:', error);
    throw error;
  }
}

// Main function to run with Strapi context
async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  
  console.log('Initializing Strapi...');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  
  app.log.level = 'error';
  
  try {
    await createHome();
  } catch (error) {
    console.error('Home creation failed:', error);
    process.exit(1);
  } finally {
    await app.destroy();
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);