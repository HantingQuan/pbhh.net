CREATE TABLE `room_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`username` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX `users_username_unique`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_hitokoto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`from` text NOT NULL,
	`from_who` text,
	`creator` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`creator`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_hitokoto`("id", "content", "from", "from_who", "creator", "created_at") SELECT "id", "content", "from", "from_who", "creator", "created_at" FROM `hitokoto`;--> statement-breakpoint
DROP TABLE `hitokoto`;--> statement-breakpoint
ALTER TABLE `__new_hitokoto` RENAME TO `hitokoto`;--> statement-breakpoint
PRAGMA foreign_keys=ON;