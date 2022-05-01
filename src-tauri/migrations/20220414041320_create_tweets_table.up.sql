-- Add up migration script here
CREATE TABLE IF NOT EXISTS tweets (
    id bigserial,
    tweet_content TEXT,
    post_date TIMESTAMP
);