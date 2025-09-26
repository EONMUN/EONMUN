#!/usr/bin/env node
'use strict';

// Enable public permissions for all content types in local development
async function enablePublicPermissions() {
  console.log('Enabling public permissions for local development...\n');

  try {
    // Get the public role
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' }
    });

    if (!publicRole) {
      throw new Error('Public role not found');
    }

    console.log(`Found public role: ${publicRole.name} (ID: ${publicRole.id})`);

    // Define the content types and permissions we want to enable
    const contentTypes = [
      'api::artwork.artwork',
      'api::article.article', 
      'api::author.author',
      'api::category.category',
      'api::collection.collection',
      'api::global.global',
      'api::about.about',
      'api::home.home',
      'api::product.product'
    ];

    const permissions = ['find', 'findOne'];

    // Enable permissions for each content type
    for (const contentType of contentTypes) {
      for (const permission of permissions) {
        // Check if permission already exists
        const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
          where: {
            action: `${contentType}.${permission}`,
            role: publicRole.id
          }
        });

        if (existingPermission) {
          // Update existing permission to enabled
          await strapi.query('plugin::users-permissions.permission').update({
            where: { id: existingPermission.id },
            data: { enabled: true }
          });
          console.log(`✓ Updated ${contentType}.${permission} to enabled`);
        } else {
          // Create new permission
          await strapi.query('plugin::users-permissions.permission').create({
            data: {
              action: `${contentType}.${permission}`,
              enabled: true,
              policy: '',
              role: publicRole.id
            }
          });
          console.log(`✓ Created ${contentType}.${permission} as enabled`);
        }
      }
    }

    console.log('\n✅ Public permissions enabled successfully!');
    console.log('All content types are now accessible without authentication in local development.');

  } catch (error) {
    console.error('Failed to enable public permissions:', error);
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
    await enablePublicPermissions();
  } catch (error) {
    console.error('Permission setup failed:', error);
    process.exit(1);
  } finally {
    await app.destroy();
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);