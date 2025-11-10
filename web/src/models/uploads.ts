import { eq, and, desc } from 'drizzle-orm';
import { db, uploads } from '@/lib/db';

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;

/**
 * Get all uploads
 */
export async function getAllUploads(): Promise<Upload[]> {
  return db.select().from(uploads).where(eq(uploads.isDeleted, false)).orderBy(desc(uploads.createdAt));
}

/**
 * Get an upload by ID
 */
export async function getUploadById(id: number): Promise<Upload | undefined> {
  const results = await db.select().from(uploads).where(
    and(eq(uploads.id, id), eq(uploads.isDeleted, false))
  );
  return results[0];
}

/**
 * Get uploads for a specific artwork
 */
export async function getUploadsByArtworkId(artworkId: number): Promise<Upload[]> {
  return db.select().from(uploads).where(
    and(eq(uploads.artworkId, artworkId), eq(uploads.isDeleted, false))
  ).orderBy(desc(uploads.isDefault), desc(uploads.createdAt));
}

/**
 * Get an upload with its artwork
 */
export async function getUploadWithArtwork(id: number) {
  return db.query.uploads.findFirst({
    where: and(eq(uploads.id, id), eq(uploads.isDeleted, false)),
    with: {
      artwork: true,
    },
  });
}

/**
 * Get the default upload for an artwork
 */
export async function getDefaultUploadForArtwork(artworkId: number): Promise<Upload | undefined> {
  const results = await db.select().from(uploads).where(
    and(
      eq(uploads.artworkId, artworkId),
      eq(uploads.isDefault, true),
      eq(uploads.isDeleted, false)
    )
  );
  return results[0];
}

/**
 * Create a new upload
 */
export async function createUpload(upload: NewUpload): Promise<Upload> {
  const results = await db.insert(uploads).values(upload).returning();
  return results[0];
}

/**
 * Update an upload
 */
export async function updateUpload(
  id: number,
  updates: Partial<NewUpload>
): Promise<Upload | undefined> {
  const results = await db
    .update(uploads)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(uploads.id, id))
    .returning();
  return results[0];
}

/**
 * Set an upload as the default for its artwork
 * This will unset any other default uploads for the same artwork
 */
export async function setUploadAsDefault(id: number): Promise<Upload | undefined> {
  // First, get the upload to find its artworkId
  const upload = await getUploadById(id);
  if (!upload || !upload.artworkId) {
    return undefined;
  }

  // Unset all other defaults for this artwork
  await db
    .update(uploads)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(
      and(
        eq(uploads.artworkId, upload.artworkId),
        eq(uploads.isDefault, true)
      )
    );

  // Set this upload as default
  return updateUpload(id, { isDefault: true });
}

/**
 * Soft delete an upload (marks as deleted instead of removing from database)
 */
export async function softDeleteUpload(id: number): Promise<void> {
  await db
    .update(uploads)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(uploads.id, id));
}

/**
 * Hard delete an upload (permanently removes from database)
 */
export async function deleteUpload(id: number): Promise<void> {
  await db.delete(uploads).where(eq(uploads.id, id));
}

/**
 * Get uploads by storage type
 */
export async function getUploadsByStorageType(storageType: 'local' | 'r2'): Promise<Upload[]> {
  return db.select().from(uploads).where(
    and(eq(uploads.storageType, storageType), eq(uploads.isDeleted, false))
  ).orderBy(desc(uploads.createdAt));
}

/**
 * Get upload statistics for an artwork
 */
export async function getArtworkUploadStats(artworkId: number) {
  const artworkUploads = await getUploadsByArtworkId(artworkId);
  const totalSize = artworkUploads.reduce((sum, upload) => sum + upload.fileSize, 0);

  return {
    totalUploads: artworkUploads.length,
    totalSize,
    defaultUpload: artworkUploads.find(u => u.isDefault),
    storageBreakdown: {
      local: artworkUploads.filter(u => u.storageType === 'local').length,
      r2: artworkUploads.filter(u => u.storageType === 'r2').length,
    },
  };
}
