CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`excerpt` text,
	`post_type` text DEFAULT 'general' NOT NULL,
	`cover_image_url` text,
	`published_at` integer,
	`scheduled_at` integer,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_slug_idx` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_published_at_idx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `posts_post_type_idx` ON `posts` (`post_type`);--> statement-breakpoint
CREATE TABLE `posts_to_artworks` (
	`post_id` integer NOT NULL,
	`artwork_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`post_id`, `artwork_id`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_to_artworks_artwork_idx` ON `posts_to_artworks` (`artwork_id`);--> statement-breakpoint
CREATE TABLE `posts_to_collections` (
	`post_id` integer NOT NULL,
	`collection_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`post_id`, `collection_id`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_to_collections_collection_idx` ON `posts_to_collections` (`collection_id`);