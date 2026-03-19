DROP TABLE `hanting_words`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_hanting_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word_id` integer NOT NULL,
	`variant` integer DEFAULT 0 NOT NULL,
	`username` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_hanting_feedback`("id", "word_id", "variant", "username", "type", "created_at") SELECT "id", "word_id", "variant", "username", "type", "created_at" FROM `hanting_feedback`;--> statement-breakpoint
DROP TABLE `hanting_feedback`;--> statement-breakpoint
ALTER TABLE `__new_hanting_feedback` RENAME TO `hanting_feedback`;--> statement-breakpoint
PRAGMA foreign_keys=ON;