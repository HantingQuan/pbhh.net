CREATE TABLE `hanting_words` (
	`word_id` integer NOT NULL,
	`variant` integer DEFAULT 0 NOT NULL,
	`level` integer NOT NULL,
	`word` text NOT NULL,
	`competition` text NOT NULL,
	`flag` integer DEFAULT 0 NOT NULL,
	`pinyin` text NOT NULL,
	`definition` text DEFAULT '' NOT NULL,
	`example` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`word_id`, `variant`)
);
