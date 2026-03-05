ALTER TABLE `tibi_likes` RENAME TO `post_likes`;--> statement-breakpoint
ALTER TABLE `tibis` RENAME TO `posts`;--> statement-breakpoint
ALTER TABLE `post_likes` RENAME COLUMN "tibi_id" TO "post_id";--> statement-breakpoint
ALTER TABLE `notifications` RENAME COLUMN "tibi_id" TO "post_id";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_post_likes` (
	`post_id` integer NOT NULL,
	`username` text NOT NULL,
	PRIMARY KEY(`post_id`, `username`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_post_likes`("post_id", "username") SELECT "post_id", "username" FROM `post_likes`;--> statement-breakpoint
DROP TABLE `post_likes`;--> statement-breakpoint
ALTER TABLE `__new_post_likes` RENAME TO `post_likes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`title` text,
	`content` text NOT NULL,
	`username` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "parent_id", "title", "content", "username", "created_at") SELECT "id", "parent_id", "title", "content", "username", "created_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;