import { callEdgeFunction, supabase } from './supabase';

const embeddingCache = {};

export async function generateEmbedding(text: string): Promise<number[]> {
  if (embeddingCache[text]) {
    return embeddingCache[text];
  }

  const data = await callEdgeFunction('embeddings', { input: text });
  const embedding = data.data[0].embedding;
  embeddingCache[text] = embedding;
  return embedding;
}

export async function updateIssueEmbedding(issue: any) {
  const embedding = await generateEmbedding(`${issue.title}\n\n${issue.messages.map(message => message.content).join('\n')}`);

  const { error: updateError } = await supabase.from('issues').update({ embedding }).eq('id', issue.id);

  if (updateError) {
    console.error(`Error updating issue #${issue.number}:`, updateError);
  }
}

export async function updateEmbeddings() {
  const { data: issues, error } = await supabase.from('issues').select('*, messages(*)');
  console.log(issues);

  if (error) {
    console.error('Error fetching issues:', error);
    return;
  }

  for (const issue of issues) {
    console.log(`Processing issue #${issue.number}: ${issue.title}`);
    await updateIssueEmbedding(issue);
  }

  console.log('Finished updating embeddings');
}
