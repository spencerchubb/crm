-- Match documents using cosine distance (<=>)
create or replace function get_similar_issues (
  query_embedding vector(512),
  match_threshold float,
  match_count int
)
returns setof record
language sql
as $$
  select issues.*, issues.embedding <=> query_embedding as similarity_score
  from issues
  where issues.embedding <=> query_embedding < 1 - match_threshold
  order by issues.embedding <=> query_embedding asc
  limit match_count;
$$;