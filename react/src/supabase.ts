import { createClient } from '@supabase/supabase-js';

// It is safe for these to be public
export const supabaseUrl = 'https://pokkflfmgpbgphcredjk.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBva2tmbGZtZ3BiZ3BoY3JlZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNjQ3NTIsImV4cCI6MjA1MjY0MDc1Mn0.10hc4EaxG5Ji8Y-XdwSNVQOXgZLN74Kl-zhLkhevNFo';
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function callEdgeFunction(endpoint: string, body: any) {
  // To prevent shooting myself in the foot
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.slice(1);
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
}
