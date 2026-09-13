-- Adds niches/content_types lookup tables (see backend/sql/schema.sql,
-- which now includes them for fresh installs) and FK-constrains
-- patterns.niche/content_type to them. patterns.niche/content_type stay
-- plain text columns - nothing reads through the FK, it only constrains
-- what can be written, so no application query changes needed.
-- Safe to re-run.

create table if not exists niches (
    name text primary key,
    created_at timestamptz not null default now()
);

create table if not exists content_types (
    name text primary key,
    created_at timestamptz not null default now()
);

-- Backfill from whatever's already in patterns, so the FK constraints
-- below don't reject existing rows.
insert into niches (name)
    select distinct niche from patterns where niche is not null
    on conflict (name) do nothing;

insert into content_types (name)
    select distinct content_type from patterns where content_type is not null
    on conflict (name) do nothing;

-- Postgres has no "ADD CONSTRAINT IF NOT EXISTS" - drop then add instead,
-- so this migration is actually safe to re-run.
alter table patterns drop constraint if exists patterns_niche_fkey;
alter table patterns
    add constraint patterns_niche_fkey
    foreign key (niche) references niches(name);

alter table patterns drop constraint if exists patterns_content_type_fkey;
alter table patterns
    add constraint patterns_content_type_fkey
    foreign key (content_type) references content_types(name);
