-- Editorial copy reviewed against the public artwork images on 2026-10-01.
-- Match previous copy and cover URL so later editor changes remain authoritative.
UPDATE artworks SET description = 'A loose school of fish gathers in overlapping blue, green, and gold watercolor marks on rice paper.' WHERE slug = 'banc-de-poissons' AND description = 'Watercolor, rice paper
12"x14"';--> statement-breakpoint
UPDATE artworks SET tags = '["fish", "watercolor", "abstract"]' WHERE slug = 'banc-de-poissons' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed watercolor of fish formed from layered blue, green, and gold marks.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'banc-de-poissons') AND url = 'https://r2.eonmun.com/Banc_De_Poison_Int_0bbb21ceb8.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["gold landscape", "birds", "water"]' WHERE slug = 'before-the-eternal' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A gold landscape with winding blue water, birds, cloud forms, and distant hills.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'before-the-eternal') AND url = 'https://r2.eonmun.com/1775752300190-44673548e9cb29c8.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'Fine black ink branches spread across pale rice paper in this spare botanical composition.' WHERE slug = 'camelia' AND description = 'Carbon ink, rice paper
19"x25"';--> statement-breakpoint
UPDATE artworks SET tags = '["botanical", "ink drawing", "branches"]' WHERE slug = 'camelia' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed black ink drawing of branching foliage on pale rice paper.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'camelia') AND url = 'https://r2.eonmun.com/Camelia_b90020b2bc.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A vivid pink and blue fish moves across a dark field in this acrylic and watercolor work on paper.' WHERE slug = 'casa-de-fuji' AND description = 'Acrylic, watercolor, paper
12"x14"';--> statement-breakpoint
UPDATE artworks SET tags = '["fish", "acrylic", "watercolor"]' WHERE slug = 'casa-de-fuji' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed painting of a pink and blue fish against a dark background.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'casa-de-fuji') AND url = 'https://r2.eonmun.com/Casa_De_Fuji_Int_0b8604171b.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A herd of dark cows crosses a luminous gold field, their silhouettes staggered across the composition.' WHERE slug = 'cows' AND description IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["cows", "animals", "gold"]' WHERE slug = 'cows' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'Dark cow silhouettes scattered across a reflective gold field.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'cows') AND url = 'https://r2.eonmun.com/artwork-media/3d12fe42-0583-4455-a8f2-5fa91bab9823.jpg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A white crane stands beside a winding blue stream beneath the red leaves of a maple tree.' WHERE slug = 'crane-beneath-the-maple' AND description IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["crane", "maple tree", "gold landscape"]' WHERE slug = 'crane-beneath-the-maple' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A white crane by a blue stream beneath a red maple tree on a gold ground.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'crane-beneath-the-maple') AND url = 'https://r2.eonmun.com/1775753290453-8db9813ccc72ab26.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'Two elephants appear as bold black and white silhouettes in this graphic acrylic work on canvas paper.' WHERE slug = 'elephants-bw' AND description = 'Acrylic, canvas paper
12”x9”';--> statement-breakpoint
UPDATE artworks SET tags = '["elephants", "black and white", "acrylic"]' WHERE slug = 'elephants-bw' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A graphic black and white painting of two elephant silhouettes.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'elephants-bw') AND url = 'https://r2.eonmun.com/1764459012189-f9997c2c7bcffb17.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'Five small horse forms balance in a vertical sequence against a pale ground, with delicate marks around them.' WHERE slug = 'equestrian-equilibrium' AND description = 'Watercolor, gold leaf, paper
13"x16"';--> statement-breakpoint
UPDATE artworks SET tags = '["horses", "watercolor", "gold leaf"]' WHERE slug = 'equestrian-equilibrium' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'Five small horse forms arranged vertically on a pale ground.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'equestrian-equilibrium') AND url = 'https://r2.eonmun.com/eehor_d23eb41f2c.jpg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'Yellow lemons and green leaves form a warm botanical study with orange and copper tones.' WHERE slug = 'limones-del-cobre' AND description IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["lemons", "botanical", "still life"]' WHERE slug = 'limones-del-cobre' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed botanical painting of yellow lemons, green leaves, and warm orange tones.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'limones-del-cobre') AND url = 'https://r2.eonmun.com/LIM_Int_2b192a6609.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A single orange flower rises from a leafy stem, with small birds and decorative motifs above it.' WHERE slug = 'occullilium' AND description = 'Watercolor, pencil, gold leaf, paper
14"x18"';--> statement-breakpoint
UPDATE artworks SET tags = '["flower", "botanical", "birds"]' WHERE slug = 'occullilium' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed botanical painting of an orange flower with small birds above.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'occullilium') AND url = 'https://r2.eonmun.com/LIL_Int_d455e0684a.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'Orange persimmons hang among green leaves in a luminous botanical composition with gold accents.' WHERE slug = 'persimmons-del-oro' AND description = 'Watercolor, pencil, gold leaf, paper
14"x18"';--> statement-breakpoint
UPDATE artworks SET tags = '["persimmons", "botanical", "gold leaf"]' WHERE slug = 'persimmons-del-oro' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed painting of orange persimmons and green leaves with gold accents.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'persimmons-del-oro') AND url = 'https://r2.eonmun.com/PERS_Int_b08c7cef7c.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'Red, orange, pink, and white poppies bloom on slender turquoise stems against a textured gold ground.' WHERE slug = 'poppies' AND description IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["poppies", "flowers", "gold"]' WHERE slug = 'poppies' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'Colorful poppies on thin turquoise stems against a textured gold background.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'poppies') AND url = 'https://r2.eonmun.com/1775751480745-23b12edb2a0730ae.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A grayscale architectural motif combines carved faces and stepped forms in a finely detailed work on paper.' WHERE slug = 'quetzalcoatlin-tetl' AND description = 'Watercolor, pencil, paper
14"x18"';--> statement-breakpoint
UPDATE artworks SET tags = '["architectural motif", "grayscale", "drawing"]' WHERE slug = 'quetzalcoatlin-tetl' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed grayscale drawing of carved faces above stepped architectural forms.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'quetzalcoatlin-tetl') AND url = 'https://r2.eonmun.com/quetzalcoatlin_tetl_e3a31b4836.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A quiet grayscale arch stands alone on white paper, its repeated lines drawing the eye inward.' WHERE slug = 'quiescent-citadel' AND description = 'Watercolor, paper
12"x16"';--> statement-breakpoint
UPDATE artworks SET tags = '["architecture", "arch", "watercolor"]' WHERE slug = 'quiescent-citadel' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A framed grayscale drawing of a tall arched structure with repeated inner lines.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'quiescent-citadel') AND url = 'https://r2.eonmun.com/quiescent_citadel_41dd0dd7f0.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A bright red sun hangs above layered black mountain peaks in this spare painting on canvas paper.' WHERE slug = 'soleil-et-montagnes' AND description = 'Acrylic, canvas paper
13"x16"';--> statement-breakpoint
UPDATE artworks SET tags = '["mountains", "sun", "landscape"]' WHERE slug = 'soleil-et-montagnes' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A red sun over black mountain peaks on a pale ground.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'soleil-et-montagnes') AND url = 'https://r2.eonmun.com/soleil_et_montagnes_what_s_inside_a_black_hole_jpg_14c4a50009.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A red mesa rises over a gold desert landscape dotted with plants and crossed by a winding blue river.' WHERE slug = 'somewhere-in-big-bend' AND description IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["Big Bend", "desert landscape", "mesa"]' WHERE slug = 'somewhere-in-big-bend' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A red mesa, desert plants, and a winding blue river against a gold sky.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'somewhere-in-big-bend') AND url = 'https://r2.eonmun.com/artwork-media/25d0d02d-045c-4cf2-b565-e78e3fbfeb11.jpg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET description = 'A red mesa and a winding blue river anchor this colorful West Texas desert scene.' WHERE slug = 'somewhere-in-west-texas' AND description IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["West Texas", "desert landscape", "mesa"]' WHERE slug = 'somewhere-in-west-texas' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A red mesa and blue river in a colorful West Texas desert landscape.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'somewhere-in-west-texas') AND url = 'https://r2.eonmun.com/1775753048979-db1aaf6dbf2f2b27.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
UPDATE artworks SET tags = '["landscape", "clouds", "layered composition"]' WHERE slug = 'when-clouds-part' AND tags = '[]';--> statement-breakpoint
UPDATE artwork_images SET alt_text = 'A layered landscape painting with a central green hill beneath bands of blue, pink, and white.' WHERE artwork_id = (SELECT id FROM artworks WHERE slug = 'when-clouds-part') AND url = 'https://r2.eonmun.com/1767296108544-1e9fc0562e8c704e.jpeg' AND is_default = 1 AND alt_text IS NULL;--> statement-breakpoint
