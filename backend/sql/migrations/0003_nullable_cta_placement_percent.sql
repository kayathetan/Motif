-- cta_placement_percent was not null with an implicit 0.0 default for
-- "no CTA phrase detected", indistinguishable from a CTA genuinely
-- opening the video. Confirmed live this corrupted
-- structural_benchmark.cta_after_percent. Made nullable so "unknown" is
-- representable; existing 0.0 rows need re-checking by hand (or
-- reprocessing), this migration only changes the constraint.
-- Safe to re-run.

alter table patterns alter column cta_placement_percent drop not null;
