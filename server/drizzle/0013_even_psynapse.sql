CREATE TABLE `gravatar_accounts` (
	`username` text PRIMARY KEY NOT NULL,
	`wp_password` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` integer,
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
