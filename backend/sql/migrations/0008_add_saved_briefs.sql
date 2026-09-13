-- Every successfully generated brief, saved automatically (not an
-- explicit user action) so the dashboard can list a user's brief history
-- and let them click back into one - see routers/brief.py (the write)
-- and routers/briefs.py (the list/fetch).
--
-- Keyed by an identity id, not video_url-style natural key like
-- patterns - there's no natural uniqueness to a generated brief the way
-- a source video's URL is unique. user_id is a plain Clerk id, same as
-- brand_profiles - filtered on directly rather than joined, since a user
-- can only ever see their own saved briefs (see routers/briefs.py).
--
-- niche/platform/goal/audience/topic are pulled out as real columns
-- (duplicating what's inside the request that produced this brief)
-- purely so the dashboard's list view is one cheap indexed query instead
-- of unpacking jsonb for every row just to render a list item. The
-- generated brief itself (BriefGenerationResponse - see models/schemas.py)
-- is stored whole as jsonb rather than exploded into columns: nothing
-- here needs to filter or aggregate on its internal fields the way
-- patterns' structural columns do, and jsonb stays in lockstep with
-- BriefResponse's shape without a migration every time that schema grows.
--
-- Safe to re-run.

create table if not exists saved_briefs (
    id bigint generated always as identity primary key,
    user_id text not null,
    created_at timestamptz not null default now(),
    niche text not null,
    platform text not null,
    goal text not null,
    audience text not null,
    topic text,
    brief jsonb not null
);

-- Speeds up "list this user's briefs, most recent first" (routers/briefs.py).
create index if not exists saved_briefs_user_id_created_at_idx
    on saved_briefs (user_id, created_at desc);
