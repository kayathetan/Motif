-- Per-account brand/organization profile, collected once during onboarding
-- (frontend/src/pages/Onboarding.jsx, right after Signup) and folded into
-- every subsequent brief as extra context - see src/routers/brief.py -
-- rather than a business re-typing who they are on every single request.
--
-- Keyed by Clerk user id (the same id src/services/auth.py's
-- authenticated_user() resolves a verified session down to), not a
-- separate generated id - there is exactly one profile per account, and
-- this makes "does this user have one yet" a single indexed lookup.
--
-- Safe to re-run.

create table if not exists brand_profiles (
    user_id text primary key,
    organization_name text not null,
    -- Free-text description of what the company/brand is - optional,
    -- since a name alone is still useful context and shouldn't block
    -- onboarding.
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
