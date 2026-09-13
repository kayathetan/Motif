-- Adds a label embedding to niches/content_types (see backend/sql/schema.sql,
-- which now includes it for fresh installs), for
-- backend/src/services/taxonomy.py to resolve a free-typed label (e.g.
-- "skin care") to its canonical stored name (e.g. "skincare") by
-- similarity instead of requiring an exact string match.
--
-- Nullable, and NOT backfilled by this migration - embedding existing
-- rows needs an OpenAI call per row, which plain SQL can't do. Existing
-- rows work fine with a null embedding in the meantime (taxonomy.py's
-- nearest-neighbor lookup just skips them, same as any other
-- not-yet-embedded row) until backfilled, e.g. by re-saving each row
-- through canonicalize_content_type()/canonicalize_niche() once, or a
-- one-off backfill script if this list ever grows large enough to
-- warrant one - same pattern already used for patterns.topic_embedding
-- (see migrations/0002).
--
-- No index added: both tables hold a small, hand-curated set of labels
-- (dozens, not thousands), so a sequential scan ordered by `<=>` is
-- plenty fast - see schema.sql's note on why ivfflat/hnsw need real
-- row counts to build well.
--
-- Safe to re-run.

alter table niches add column if not exists embedding vector(1536);
alter table content_types add column if not exists embedding vector(1536);
