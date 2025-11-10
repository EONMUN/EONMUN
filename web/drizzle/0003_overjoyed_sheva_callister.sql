CREATE TABLE `uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`storage_path` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`storage_type` text NOT NULL,
	`storage_url` text NOT NULL,
	`width` integer,
	`height` integer,
	`alternative_text` text,
	`caption` text,
	`artwork_id` integer,
	`is_default` integer DEFAULT false NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `uploads_storage_path_idx` ON `uploads` (`storage_path`);--> statement-breakpoint
CREATE INDEX `uploads_artwork_id_idx` ON `uploads` (`artwork_id`);--> statement-breakpoint
CREATE INDEX `uploads_is_deleted_idx` ON `uploads` (`is_deleted`);--> statement-breakpoint
CREATE INDEX `uploads_artwork_default_idx` ON `uploads` (`artwork_id`,`is_default`);