CREATE TABLE `hanting_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word_number` integer NOT NULL,
	`level` integer NOT NULL,
	`word` text NOT NULL,
	`competition` text NOT NULL,
	`flag` integer DEFAULT 0 NOT NULL,
	`pinyin` text NOT NULL,
	`definition` text DEFAULT '' NOT NULL,
	`example` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`type` text NOT NULL,
	`actor_username` text,
	`actor_label` text,
	`post_id` integer,
	`reply_id` integer,
	`email_id` integer,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "username", "type", "actor_username", "actor_label", "post_id", "reply_id", "email_id", "read", "created_at") SELECT "id", "username", "type", "actor_username", "actor_label", "post_id", "reply_id", "email_id", "read", "created_at" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;