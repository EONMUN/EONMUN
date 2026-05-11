/**
 * Regression test for EONMUN/EONMUN#50 — "Artwork Page NOT FOUND".
 *
 * Root cause: artworks created before PR #53 (`ae5abf9`) have
 * `published_at = NULL` because the admin form did not yet write to that
 * column. The public detail page filters `published: true`, which the model
 * translates to `WHERE published_at IS NOT NULL`, so legacy artworks 404
 * even though admins still treat them as visible.
 *
 * The fix is migration 0010, which backfills `published_at` from
 * `created_at` for any row that is currently NULL.
 *
 * This file holds the test as a hermetic, in-memory libSQL integration
 * that does not depend on the broken `@/database/factories/*` shims used
 * by the older suites in this directory.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import path from "path";
import fs from "fs";

import * as schema from "@/database/schema";
import { artworks } from "@/database/schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// CRITICAL: This regex must match the actual SQL emitted in
// drizzle/0010_*.sql. If a future migration restructures or renames the
// backfill, the test in `migration 0010 file backfills published_at`
// will fail loudly so the protection isn't silently lost.
const BACKFILL_SQL_RE =
  /UPDATE\s+`?artworks`?\s+SET\s+`?published_at`?\s*=\s*`?created_at`?\s+WHERE\s+`?published_at`?\s+IS\s+NULL/i;

/**
 * Run the public-page slug lookup the same way `findArtworks` does in
 * `src/models/artwork.ts`. We inline the relevant condition here instead
 * of importing the model so the test does not depend on the singleton
 * `db` exported from `@/database` — that singleton reads `DATABASE_URL`
 * at import time and would point at a real libSQL server.
 */
async function findPublishedArtworkBySlug(db: DrizzleDb, slug: string) {
  // CRITICAL: predicates must compose at the SQL layer the same way
  // findArtworks() does in src/models/artwork.ts, so this test exercises
  // the real query shape (`WHERE published_at IS NOT NULL AND slug = ?`).
  // An in-memory .find() would still pass when slug filtering breaks.
  const [row] = await db
    .select()
    .from(artworks)
    .where(and(isNotNull(artworks.publishedAt), eq(artworks.slug, slug)));
  return row ?? null;
}

describe("Artwork publishedAt backfill (regression for #50)", () => {
  let client: Client;
  let db: DrizzleDb;

  beforeEach(async () => {
    // SECURITY/CRITICAL: ":memory:" gives each test a fresh schema with no
    // shared state, so concurrent tests cannot leak rows into one another.
    client = createClient({ url: ":memory:" });
    db = drizzle(client, { schema });
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
  });

  afterEach(() => {
    client.close();
  });

  it("legacy artwork created with publishedAt = NULL is unreachable to the public page", async () => {
    // Simulate a row written by the pre-PR-#53 admin form.
    await db.insert(artworks).values({
      title: "When Clouds Part",
      slug: "when-clouds-part",
      // publishedAt intentionally omitted — the column is nullable and the
      // old createArtwork path never set it.
    });

    const result = await findPublishedArtworkBySlug(db, "when-clouds-part");

    // Demonstrates the bug: even though the artwork exists, the public
    // route's `published: true` filter masks it.
    expect(result).toBeNull();

    // Sanity check: the row really is in the table; only the filter hides it.
    const rawRows = await db
      .select()
      .from(artworks)
      .where(eq(artworks.slug, "when-clouds-part"));
    expect(rawRows).toHaveLength(1);
    expect(rawRows[0].publishedAt).toBeNull();
  });

  it("after applying the published_at backfill, the legacy artwork is reachable", async () => {
    await db.insert(artworks).values({
      title: "When Clouds Part",
      slug: "when-clouds-part",
    });

    // This is exactly what migration 0010 does. Running it as a raw SQL
    // statement here lets the test exercise the same write that ships in
    // production without depending on drizzle-kit invocation order.
    await client.execute(
      "UPDATE artworks SET published_at = created_at WHERE published_at IS NULL",
    );

    const result = await findPublishedArtworkBySlug(db, "when-clouds-part");

    expect(result).not.toBeNull();
    expect(result?.slug).toBe("when-clouds-part");
    expect(result?.publishedAt).toBeInstanceOf(Date);

    // No rows should remain with publishedAt = NULL after the backfill.
    const stillNull = await db
      .select()
      .from(artworks)
      .where(isNull(artworks.publishedAt));
    expect(stillNull).toHaveLength(0);
  });

  it("explicit drafts are resurrected by the backfill — documented trade-off, not a draft-preservation guarantee", async () => {
    // Simulates the post-#53 admin flow: a row created as published, then
    // unpublished by the artist. publishedAt = NULL is a two-valued column
    // carrying three semantic states (legacy / explicit-draft / published),
    // so the backfill cannot distinguish "never set" from "deliberately
    // cleared" and resurrects both. The artist can re-unpublish from the
    // admin; leaving every legacy row 404'd is the worse failure for the
    // M1 baseline-fixes goal.
    //
    // This test locks in that trade-off so a future change cannot quietly
    // drop the resurrection behavior without an explicit rewrite here.
    await db.insert(artworks).values({
      title: "Hidden Draft",
      slug: "hidden-draft",
      publishedAt: new Date("2026-02-01T00:00:00Z"),
    });
    await db
      .update(artworks)
      .set({ publishedAt: null })
      .where(eq(artworks.slug, "hidden-draft"));

    await client.execute(
      "UPDATE artworks SET published_at = created_at WHERE published_at IS NULL",
    );

    const result = await findPublishedArtworkBySlug(db, "hidden-draft");
    expect(result).not.toBeNull();
  });

  it("migration 0010 file backfills published_at from created_at", () => {
    // CRITICAL: this is the load-bearing assertion that proves the in-repo
    // migration shipped with this PR exists and contains the backfill SQL.
    // Without it the runtime tests above only validate the *idea* of the
    // backfill, not the artifact actually deployed by drizzle-kit.
    const drizzleDir = path.join(process.cwd(), "drizzle");
    const files = fs.readdirSync(drizzleDir);
    const backfill = files.find((name) =>
      /^0010_.*backfill.*published.*\.sql$/i.test(name),
    );

    expect(
      backfill,
      "expected drizzle/0010_*backfill*published*.sql to exist; this is the data-only migration that fixes legacy NULL published_at rows for issue #50",
    ).toBeDefined();

    const sql = fs.readFileSync(
      path.join(drizzleDir, backfill as string),
      "utf-8",
    );
    expect(sql).toMatch(BACKFILL_SQL_RE);
  });
});
