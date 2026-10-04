-- Precomputed cover colors avoid image downloads during deployment.
-- Match the source URL so different IDs or replaced covers cannot receive a stale tint.
UPDATE artworks
SET background_color = '#86734d',
    background_image_url = 'https://r2.eonmun.com/artwork-media/3d12fe42-0583-4455-a8f2-5fa91bab9823.jpg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/artwork-media/3d12fe42-0583-4455-a8f2-5fa91bab9823.jpg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/artwork-media/3d12fe42-0583-4455-a8f2-5fa91bab9823.jpg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#796644',
    background_image_url = 'https://r2.eonmun.com/artwork-media/25d0d02d-045c-4cf2-b565-e78e3fbfeb11.jpg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/artwork-media/25d0d02d-045c-4cf2-b565-e78e3fbfeb11.jpg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/artwork-media/25d0d02d-045c-4cf2-b565-e78e3fbfeb11.jpg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#433e34',
    background_image_url = 'https://r2.eonmun.com/PERS_Int_b08c7cef7c.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/PERS_Int_b08c7cef7c.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/PERS_Int_b08c7cef7c.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#413c32',
    background_image_url = 'https://r2.eonmun.com/LIM_Int_2b192a6609.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/LIM_Int_2b192a6609.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/LIM_Int_2b192a6609.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#685843',
    background_image_url = 'https://r2.eonmun.com/1775753290453-8db9813ccc72ab26.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/1775753290453-8db9813ccc72ab26.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/1775753290453-8db9813ccc72ab26.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#987a53',
    background_image_url = 'https://r2.eonmun.com/1775753048979-db1aaf6dbf2f2b27.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/1775753048979-db1aaf6dbf2f2b27.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/1775753048979-db1aaf6dbf2f2b27.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#b9afa4',
    background_image_url = 'https://r2.eonmun.com/soleil_et_montagnes_what_s_inside_a_black_hole_jpg_14c4a50009.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/soleil_et_montagnes_what_s_inside_a_black_hole_jpg_14c4a50009.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/soleil_et_montagnes_what_s_inside_a_black_hole_jpg_14c4a50009.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#5c5e68',
    background_image_url = 'https://r2.eonmun.com/1767296108544-1e9fc0562e8c704e.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/1767296108544-1e9fc0562e8c704e.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/1767296108544-1e9fc0562e8c704e.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#76694e',
    background_image_url = 'https://r2.eonmun.com/1775752300190-44673548e9cb29c8.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/1775752300190-44673548e9cb29c8.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/1775752300190-44673548e9cb29c8.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#726345',
    background_image_url = 'https://r2.eonmun.com/1775751480745-23b12edb2a0730ae.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/1775751480745-23b12edb2a0730ae.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/1775751480745-23b12edb2a0730ae.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#4b4a4e',
    background_image_url = 'https://r2.eonmun.com/1764459012189-f9997c2c7bcffb17.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/1764459012189-f9997c2c7bcffb17.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/1764459012189-f9997c2c7bcffb17.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#817e76',
    background_image_url = 'https://r2.eonmun.com/Camelia_b90020b2bc.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/Camelia_b90020b2bc.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/Camelia_b90020b2bc.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#463a32',
    background_image_url = 'https://r2.eonmun.com/LIL_Int_d455e0684a.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/LIL_Int_d455e0684a.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/LIL_Int_d455e0684a.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#716e68',
    background_image_url = 'https://r2.eonmun.com/Banc_De_Poison_Int_0bbb21ceb8.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/Banc_De_Poison_Int_0bbb21ceb8.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/Banc_De_Poison_Int_0bbb21ceb8.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#7a7472',
    background_image_url = 'https://r2.eonmun.com/Casa_De_Fuji_Int_0b8604171b.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/Casa_De_Fuji_Int_0b8604171b.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/Casa_De_Fuji_Int_0b8604171b.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#515249',
    background_image_url = 'https://r2.eonmun.com/quiescent_citadel_41dd0dd7f0.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/quiescent_citadel_41dd0dd7f0.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/quiescent_citadel_41dd0dd7f0.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#3d3e39',
    background_image_url = 'https://r2.eonmun.com/quetzalcoatlin_tetl_e3a31b4836.jpeg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/quetzalcoatlin_tetl_e3a31b4836.jpeg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/quetzalcoatlin_tetl_e3a31b4836.jpeg'
  );
--> statement-breakpoint
UPDATE artworks
SET background_color = '#897e74',
    background_image_url = 'https://r2.eonmun.com/eehor_d23eb41f2c.jpg'
WHERE (background_color IS NULL OR background_image_url IS NULL OR background_image_url <> 'https://r2.eonmun.com/eehor_d23eb41f2c.jpg')
  AND EXISTS (
    SELECT 1 FROM artwork_images
    WHERE artwork_id = artworks.id AND is_default = 1
      AND url = 'https://r2.eonmun.com/eehor_d23eb41f2c.jpg'
  );
