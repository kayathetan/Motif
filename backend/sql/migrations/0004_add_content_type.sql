-- Adds content_type to an already-created patterns table (see
-- backend/sql/schema.sql, which now includes it for fresh installs).
-- Nullable here - existing rows get backfilled separately, not by this
-- migration. New rows always populate it (enforced by store_pattern()'s
-- required-columns check + the Pattern schema).
-- Safe to re-run.

alter table patterns add column if not exists content_type text;

create index if not exists patterns_content_type_idx
    on patterns (content_type);
create index if not exists patterns_niche_content_type_idx
    on patterns (niche, content_type);
