-- Adds cta_type and payoff_seconds to an already-created patterns table
-- (see backend/sql/schema.sql, which now includes these columns for fresh
-- installs). Safe to re-run.

alter table patterns add column if not exists payoff_seconds numeric not null default 0;
alter table patterns add column if not exists cta_type text not null default 'unspecified';

-- Drop the defaults now that backfill is done, so future inserts must
-- supply real values (matches the not-null-without-default columns in
-- schema.sql).
alter table patterns alter column payoff_seconds drop default;
alter table patterns alter column cta_type drop default;
