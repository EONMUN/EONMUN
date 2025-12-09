/**
 * Product types for the products table.
 */

import { products } from '../schema';

// Type for inserting a product
export type InsertProduct = typeof products.$inferInsert;

// Type for a product from the database
export type SelectProduct = typeof products.$inferSelect;

// Product types
export type ProductType = 'artwork' | 'print' | 'postcard';
