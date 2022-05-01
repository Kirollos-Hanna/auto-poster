-- Add up migration script here
ALTER TABLE tweets
ADD COLUMN posted boolean
NOT NULL DEFAULT FALSE;