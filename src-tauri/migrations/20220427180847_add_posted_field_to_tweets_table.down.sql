-- Add down migration script here
ALTER TABLE tweets
DROP COLUMN posted boolean;