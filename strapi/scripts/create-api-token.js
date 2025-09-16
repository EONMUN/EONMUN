#!/usr/bin/env node
'use strict';

require('dotenv').config();

// Create API token for frontend access
async function createApiToken() {
  console.log('Creating API token for frontend access...\n');

  // Token name and permissions
  const tokenName = 'Frontend API Token';
  const tokenType = 'read-only';
  
  // Use predefined token from environment
  const tokenValue = process.env.FRONTEND_API_TOKEN;
  
  if (!tokenValue) {
    throw new Error('FRONTEND_API_TOKEN not found in environment variables');
  }
  
  try {
    // Check if token already exists
    const existingToken = await strapi.query('admin::api-token').findOne({
      where: { name: tokenName }
    });

    if (existingToken) {
      console.log(`✓ API token "${tokenName}" already exists`);
      console.log(`Token ID: ${existingToken.id}`);
      console.log(`Token: ${existingToken.accessKey}`);
      return existingToken.accessKey;
    }

    // Create new API token and let Strapi handle the access key generation
    const newToken = await strapi.query('admin::api-token').create({
      data: {
        name: tokenName,
        description: 'Frontend API token',
        type: tokenType,
        lastUsedAt: null,
        permissions: [],
        expiresAt: null,
        lifespan: null
      }
    });

    console.log(`✓ Created new API token: "${tokenName}"`);
    console.log(`Token ID: ${newToken.id}`);
    console.log(`Token: ${newToken.accessKey}`);
    console.log(`\nAdd this token to your web/.env file:`);
    console.log(`NEXT_PUBLIC_STRAPI_API_TOKEN=${newToken.accessKey}`);
    
    return newToken.accessKey;
    
  } catch (error) {
    console.error('Failed to create API token:', error);
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
    await createApiToken();
  } catch (error) {
    console.error('Token creation failed:', error);
    process.exit(1);
  } finally {
    await app.destroy();
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);