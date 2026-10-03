-- Preserve documented specifications and leave independently edited facet groups intact.
CREATE TABLE artwork_facet_backfill (artwork_id integer NOT NULL, key text NOT NULL, value text NOT NULL);
--> statement-breakpoint
UPDATE artworks SET description = 'A loose school of fish gathers in overlapping blue, green, and gold watercolor marks on rice paper.

Watercolor, rice paper
12"x14"' WHERE slug = 'banc-de-poissons' AND description = 'A loose school of fish gathers in overlapping blue, green, and gold watercolor marks on rice paper.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Watercolor' FROM artworks a
WHERE a.slug = 'banc-de-poissons' AND a.description IN ('Watercolor, rice paper
12"x14"', 'A loose school of fish gathers in overlapping blue, green, and gold watercolor marks on rice paper.

Watercolor, rice paper
12"x14"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Rice paper' FROM artworks a
WHERE a.slug = 'banc-de-poissons' AND a.description IN ('Watercolor, rice paper
12"x14"', 'A loose school of fish gathers in overlapping blue, green, and gold watercolor marks on rice paper.

Watercolor, rice paper
12"x14"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'Fine black ink branches spread across pale rice paper in this spare botanical composition.

Carbon ink, rice paper
19"x25"' WHERE slug = 'camelia' AND description = 'Fine black ink branches spread across pale rice paper in this spare botanical composition.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Carbon ink' FROM artworks a
WHERE a.slug = 'camelia' AND a.description IN ('Carbon ink, rice paper
19"x25"', 'Fine black ink branches spread across pale rice paper in this spare botanical composition.

Carbon ink, rice paper
19"x25"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Rice paper' FROM artworks a
WHERE a.slug = 'camelia' AND a.description IN ('Carbon ink, rice paper
19"x25"', 'Fine black ink branches spread across pale rice paper in this spare botanical composition.

Carbon ink, rice paper
19"x25"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'A vivid pink and blue fish moves across a dark field in this acrylic and watercolor work on paper.

Acrylic, watercolor, paper
12"x14"' WHERE slug = 'casa-de-fuji' AND description = 'A vivid pink and blue fish moves across a dark field in this acrylic and watercolor work on paper.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Acrylic' FROM artworks a
WHERE a.slug = 'casa-de-fuji' AND a.description IN ('Acrylic, watercolor, paper
12"x14"', 'A vivid pink and blue fish moves across a dark field in this acrylic and watercolor work on paper.

Acrylic, watercolor, paper
12"x14"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Watercolor' FROM artworks a
WHERE a.slug = 'casa-de-fuji' AND a.description IN ('Acrylic, watercolor, paper
12"x14"', 'A vivid pink and blue fish moves across a dark field in this acrylic and watercolor work on paper.

Acrylic, watercolor, paper
12"x14"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Paper' FROM artworks a
WHERE a.slug = 'casa-de-fuji' AND a.description IN ('Acrylic, watercolor, paper
12"x14"', 'A vivid pink and blue fish moves across a dark field in this acrylic and watercolor work on paper.

Acrylic, watercolor, paper
12"x14"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'Two elephants appear as bold black and white silhouettes in this graphic acrylic work on canvas paper.

Acrylic, canvas paper
12”x9”' WHERE slug = 'elephants-bw' AND description = 'Two elephants appear as bold black and white silhouettes in this graphic acrylic work on canvas paper.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Acrylic' FROM artworks a
WHERE a.slug = 'elephants-bw' AND a.description IN ('Acrylic, canvas paper
12”x9”', 'Two elephants appear as bold black and white silhouettes in this graphic acrylic work on canvas paper.

Acrylic, canvas paper
12”x9”')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Canvas paper' FROM artworks a
WHERE a.slug = 'elephants-bw' AND a.description IN ('Acrylic, canvas paper
12”x9”', 'Two elephants appear as bold black and white silhouettes in this graphic acrylic work on canvas paper.

Acrylic, canvas paper
12”x9”')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'Five small horse forms balance in a vertical sequence against a pale ground, with delicate marks around them.

Watercolor, gold leaf, paper
13"x16"' WHERE slug = 'equestrian-equilibrium' AND description = 'Five small horse forms balance in a vertical sequence against a pale ground, with delicate marks around them.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Watercolor' FROM artworks a
WHERE a.slug = 'equestrian-equilibrium' AND a.description IN ('Watercolor, gold leaf, paper
13"x16"', 'Five small horse forms balance in a vertical sequence against a pale ground, with delicate marks around them.

Watercolor, gold leaf, paper
13"x16"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Gold leaf' FROM artworks a
WHERE a.slug = 'equestrian-equilibrium' AND a.description IN ('Watercolor, gold leaf, paper
13"x16"', 'Five small horse forms balance in a vertical sequence against a pale ground, with delicate marks around them.

Watercolor, gold leaf, paper
13"x16"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Paper' FROM artworks a
WHERE a.slug = 'equestrian-equilibrium' AND a.description IN ('Watercolor, gold leaf, paper
13"x16"', 'Five small horse forms balance in a vertical sequence against a pale ground, with delicate marks around them.

Watercolor, gold leaf, paper
13"x16"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'A single orange flower rises from a leafy stem, with small birds and decorative motifs above it.

Watercolor, pencil, gold leaf, paper
14"x18"' WHERE slug = 'occullilium' AND description = 'A single orange flower rises from a leafy stem, with small birds and decorative motifs above it.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Watercolor' FROM artworks a
WHERE a.slug = 'occullilium' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'A single orange flower rises from a leafy stem, with small birds and decorative motifs above it.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Pencil' FROM artworks a
WHERE a.slug = 'occullilium' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'A single orange flower rises from a leafy stem, with small birds and decorative motifs above it.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Gold leaf' FROM artworks a
WHERE a.slug = 'occullilium' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'A single orange flower rises from a leafy stem, with small birds and decorative motifs above it.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Paper' FROM artworks a
WHERE a.slug = 'occullilium' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'A single orange flower rises from a leafy stem, with small birds and decorative motifs above it.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'Orange persimmons hang among green leaves in a luminous botanical composition with gold accents.

Watercolor, pencil, gold leaf, paper
14"x18"' WHERE slug = 'persimmons-del-oro' AND description = 'Orange persimmons hang among green leaves in a luminous botanical composition with gold accents.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Watercolor' FROM artworks a
WHERE a.slug = 'persimmons-del-oro' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'Orange persimmons hang among green leaves in a luminous botanical composition with gold accents.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Pencil' FROM artworks a
WHERE a.slug = 'persimmons-del-oro' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'Orange persimmons hang among green leaves in a luminous botanical composition with gold accents.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Gold leaf' FROM artworks a
WHERE a.slug = 'persimmons-del-oro' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'Orange persimmons hang among green leaves in a luminous botanical composition with gold accents.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Paper' FROM artworks a
WHERE a.slug = 'persimmons-del-oro' AND a.description IN ('Watercolor, pencil, gold leaf, paper
14"x18"', 'Orange persimmons hang among green leaves in a luminous botanical composition with gold accents.

Watercolor, pencil, gold leaf, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'A grayscale architectural motif combines carved faces and stepped forms in a finely detailed work on paper.

Watercolor, pencil, paper
14"x18"' WHERE slug = 'quetzalcoatlin-tetl' AND description = 'A grayscale architectural motif combines carved faces and stepped forms in a finely detailed work on paper.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Watercolor' FROM artworks a
WHERE a.slug = 'quetzalcoatlin-tetl' AND a.description IN ('Watercolor, pencil, paper
14"x18"', 'A grayscale architectural motif combines carved faces and stepped forms in a finely detailed work on paper.

Watercolor, pencil, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Pencil' FROM artworks a
WHERE a.slug = 'quetzalcoatlin-tetl' AND a.description IN ('Watercolor, pencil, paper
14"x18"', 'A grayscale architectural motif combines carved faces and stepped forms in a finely detailed work on paper.

Watercolor, pencil, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Paper' FROM artworks a
WHERE a.slug = 'quetzalcoatlin-tetl' AND a.description IN ('Watercolor, pencil, paper
14"x18"', 'A grayscale architectural motif combines carved faces and stepped forms in a finely detailed work on paper.

Watercolor, pencil, paper
14"x18"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'A quiet grayscale arch stands alone on white paper, its repeated lines drawing the eye inward.

Watercolor, paper
12"x16"' WHERE slug = 'quiescent-citadel' AND description = 'A quiet grayscale arch stands alone on white paper, its repeated lines drawing the eye inward.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Watercolor' FROM artworks a
WHERE a.slug = 'quiescent-citadel' AND a.description IN ('Watercolor, paper
12"x16"', 'A quiet grayscale arch stands alone on white paper, its repeated lines drawing the eye inward.

Watercolor, paper
12"x16"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Paper' FROM artworks a
WHERE a.slug = 'quiescent-citadel' AND a.description IN ('Watercolor, paper
12"x16"', 'A quiet grayscale arch stands alone on white paper, its repeated lines drawing the eye inward.

Watercolor, paper
12"x16"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
UPDATE artworks SET description = 'A bright red sun hangs above layered black mountain peaks in this spare painting on canvas paper.

Acrylic, canvas paper
13"x16"' WHERE slug = 'soleil-et-montagnes' AND description = 'A bright red sun hangs above layered black mountain peaks in this spare painting on canvas paper.';
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'material', 'Acrylic' FROM artworks a
WHERE a.slug = 'soleil-et-montagnes' AND a.description IN ('Acrylic, canvas paper
13"x16"', 'A bright red sun hangs above layered black mountain peaks in this spare painting on canvas paper.

Acrylic, canvas paper
13"x16"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'material'
);
--> statement-breakpoint
INSERT INTO artwork_facet_backfill (artwork_id, key, value)
SELECT a.id, 'support', 'Canvas paper' FROM artworks a
WHERE a.slug = 'soleil-et-montagnes' AND a.description IN ('Acrylic, canvas paper
13"x16"', 'A bright red sun hangs above layered black mountain peaks in this spare painting on canvas paper.

Acrylic, canvas paper
13"x16"')
AND NOT EXISTS (
 SELECT 1 FROM artworks_to_facets membership JOIN facets f ON f.id = membership.facet_id
 WHERE membership.artwork_id = a.id AND f.namespace = 'artwork' AND f.key = 'support'
);
--> statement-breakpoint
INSERT INTO facets (namespace, key, value, created_at, updated_at)
SELECT DISTINCT 'artwork', key, value, unixepoch(), unixepoch() FROM artwork_facet_backfill WHERE 1
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO artworks_to_facets (artwork_id, facet_id, created_at)
SELECT b.artwork_id, f.id, unixepoch() FROM artwork_facet_backfill b
JOIN facets f ON f.namespace = 'artwork' AND f.key = b.key AND f.value = b.value COLLATE NOCASE
WHERE 1 ON CONFLICT DO NOTHING;
--> statement-breakpoint
DROP TABLE artwork_facet_backfill;
