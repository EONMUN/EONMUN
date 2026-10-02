ALTER TABLE `artwork_images` ADD `alt_text` text;--> statement-breakpoint
ALTER TABLE `artworks` ADD `tags` text DEFAULT '[]' NOT NULL;
