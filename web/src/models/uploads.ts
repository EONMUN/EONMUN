import { eq, and, desc } from 'drizzle-orm';
import { db, uploads, artworkUploads } from '@/lib/db';

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
export type ArtworkUpload = typeof artworkUploads.$inferSelect;
export type NewArtworkUpload = typeof artworkUploads.$inferInsert;

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
 * Get uploads for a specific artwork (through join table)
 */
export async function getUploadsByArtworkId(artworkId: number) {
  return db.query.artworks.findFirst({
    where: (artworks, { eq }) => eq(artworks.id, artworkId),
    with: {
      artworkUploads: {
        orderBy: (artworkUploads, { desc }) => [desc(artworkUploads.isDefault), desc(artworkUploads.createdAt)],
        with: {
          upload: true,
        },
      },
    },
  });
}

/**
 * Get an upload with all its artwork relationships
 */
export async function getUploadWithArtworks(id: number) {
  return db.query.uploads.findFirst({
    where: (uploads, { eq, and }) => and(eq(uploads.id, id), eq(uploads.isDeleted, false)),
    with: {
      artworkUploads: {
        with: {
          artwork: true,
        },
      },
    },
  });
}

/**
 * Get the default upload for an artwork
 */
export async function getDefaultUploadForArtwork(artworkId: number): Promise<Upload | undefined> {
  const result = await db
    .select({ upload: uploads })
    .from(artworkUploads)
    .innerJoin(uploads, eq(artworkUploads.uploadId, uploads.id))
    .where(
      and(
        eq(artworkUploads.artworkId, artworkId),
        eq(artworkUploads.isDefault, true),
        eq(uploads.isDeleted, false)
      )
    )
    .limit(1);

  return result[0]?.upload;
}

/**
 * Create a new upload
 */
export async function createUpload(upload: NewUpload): Promise<Upload> {
  const results = await db.insert(uploads).values(upload).returning();
  return results[0];
}

/**
 * Create an upload and link it to an artwork
 */
export async function createUploadForArtwork(
  upload: NewUpload,
  artworkId: number,
  isDefault = false
): Promise<{ upload: Upload; artworkUpload: ArtworkUpload }> {
  // Create the upload
  const createdUpload = await createUpload(upload);

  // If this is set as default, unset other defaults for this artwork
  if (isDefault) {
    await db
      .update(artworkUploads)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(artworkUploads.artworkId, artworkId),
          eq(artworkUploads.isDefault, true)
        )
      );
  }

  // Link the upload to the artwork
  const [artworkUpload] = await db
    .insert(artworkUploads)
    .values({
      artworkId,
      uploadId: createdUpload.id,
      isDefault,
    })
    .returning();

  return { upload: createdUpload, artworkUpload };
}

/**
 * Link an existing upload to an artwork
 */
export async function linkUploadToArtwork(
  uploadId: number,
  artworkId: number,
  isDefault = false
): Promise<ArtworkUpload> {
  // If this is set as default, unset other defaults for this artwork
  if (isDefault) {
    await db
      .update(artworkUploads)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(artworkUploads.artworkId, artworkId),
          eq(artworkUploads.isDefault, true)
        )
      );
  }

  const [artworkUpload] = await db
    .insert(artworkUploads)
    .values({
      artworkId,
      uploadId,
      isDefault,
    })
    .returning();

  return artworkUpload;
}

/**
 * Unlink an upload from an artwork
 */
export async function unlinkUploadFromArtwork(uploadId: number, artworkId: number): Promise<void> {
  await db
    .delete(artworkUploads)
    .where(
      and(
        eq(artworkUploads.uploadId, uploadId),
        eq(artworkUploads.artworkId, artworkId)
      )
    );
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
 * Set an upload as the default for a specific artwork
 * This will unset any other default uploads for the same artwork
 */
export async function setUploadAsDefaultForArtwork(
  uploadId: number,
  artworkId: number
): Promise<ArtworkUpload | undefined> {
  // Unset all other defaults for this artwork
  await db
    .update(artworkUploads)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(
      and(
        eq(artworkUploads.artworkId, artworkId),
        eq(artworkUploads.isDefault, true)
      )
    );

  // Set this upload as default
  const results = await db
    .update(artworkUploads)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(
      and(
        eq(artworkUploads.uploadId, uploadId),
        eq(artworkUploads.artworkId, artworkId)
      )
    )
    .returning();

  return results[0];
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
 * This will also cascade delete all artwork_uploads relationships
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
  const result = await getUploadsByArtworkId(artworkId);

  if (!result || !result.artworkUploads) {
    return {
      totalUploads: 0,
      totalSize: 0,
      defaultUpload: undefined,
      storageBreakdown: { local: 0, r2: 0 },
    };
  }

  const uploads = result.artworkUploads.map(au => au.upload).filter(Boolean);
  const totalSize = uploads.reduce((sum, upload) => sum + upload.fileSize, 0);
  const defaultArtworkUpload = result.artworkUploads.find(au => au.isDefault);

  return {
    totalUploads: uploads.length,
    totalSize,
    defaultUpload: defaultArtworkUpload?.upload,
    storageBreakdown: {
      local: uploads.filter(u => u.storageType === 'local').length,
      r2: uploads.filter(u => u.storageType === 'r2').length,
    },
  };
}

/**
 * Get all artworks that use a specific upload
 */
export async function getArtworksUsingUpload(uploadId: number) {
  return db.query.uploads.findFirst({
    where: (uploads, { eq, and }) => and(eq(uploads.id, uploadId), eq(uploads.isDeleted, false)),
    with: {
      artworkUploads: {
        with: {
          artwork: true,
        },
      },
    },
  });
}
