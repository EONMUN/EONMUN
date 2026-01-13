/**
 * Test utilities for E2E tests.
 * 
 * Note: Some utilities duplicate production code to keep E2E tests isolated and runnable
 * without app dependencies. This is intentional - if the production implementation changes,
 * these tests will catch the discrepancy by failing, which is the desired behavior.
 */

/**
 * Generate a URL-friendly slug from a string.
 * This duplicates the logic from src/lib/utils.ts to keep E2E tests isolated.
 * If the production slug generation changes, this test implementation should be updated.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
