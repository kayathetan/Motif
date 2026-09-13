-- Adds topic_summary/topic_embedding to an already-created patterns table
-- (see backend/sql/schema.sql, which now includes these columns for fresh
-- installs). Nullable - existing rows get backfilled separately via
-- pipeline/classify_niche.py's backfill step, not by this migration.
-- Safe to re-run.

alter table patterns add column if not exists topic_summary text;
alter table patterns add column if not exists topic_embedding vector(1536);
