# Embeds a Pattern and stores it (document + embedding + metadata) in the
# shared Supabase "patterns" table (see backend/sql/schema.sql).

def store_pattern(pattern: dict) -> None:
    """
    Generate an embedding for the pattern and upsert it into Supabase, with
    all pattern fields persisted as columns alongside the document text
    and embedding.

    Args:
        pattern: A dict matching the Pattern schema.
    """
    pass
