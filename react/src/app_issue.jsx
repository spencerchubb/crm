import { useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper } from './AuthWrapper';

const searchParams = new URLSearchParams(window.location.search);
const issueId = searchParams.get('id');

function App() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState(undefined);

  async function fetchData(session) {
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();
    if (issueError) {
      console.error(issueError);
      return;
    }
    console.log(issue);
    document.title = issue?.title;
    setIssue(issue);
    setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} user={user} loading={loading} setLoading={setLoading}>
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 700 }}>
      <h1>{issue?.title}</h1>
      <p style={{ marginTop: 16 }}>{issue?.description}</p>
    </div>
  </AuthWrapper>
}

export default App
