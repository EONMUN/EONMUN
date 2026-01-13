/**
 * Test utilities for E2E tests.
 * Duplicates some production code to keep tests isolated and runnable without app dependencies.
 */

/**
 * Generate a URL-friendly slug from a string.
 * This duplicates the logic from src/lib/utils.ts to keep E2E tests isolated.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
