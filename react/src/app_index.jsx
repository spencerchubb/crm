import { useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import { Timestamp } from './components/Timestamp';

function App() {
  const authWrapperHook = useAuthWrapper();
  const [issues, setIssues] = useState([]);

  async function fetchData(session) {
    // To make it possible to join with users, we created this view:
    // https://supabase.com/dashboard/project/pokkflfmgpbgphcredjk/sql/1ba57cf9-8bea-49c0-a91b-946adab6d8ef
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select(`*, users(raw_user_meta_data)`)
      .order('created_at', { ascending: false });
    if (issuesError) {
      console.error(issuesError);
      return;
    }
    setIssues(issues);
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div>
      <a href="/new_issue/"><button className="btnPrimary">New issue</button></a>
      <div className="issuesList">
        {issues.map(issue => <div key={issue.id} style={{ display: 'flex', flexDirection: 'column', padding: 8, gap: 4, borderTop: 'solid 1px #555' }}>
          <a href={`/issue/?id=${issue.id}`}>{issue.title}</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#aaa' }}>
            <p style={{ fontSize: 14, color: '#aaa' }}>
              {issue.users.raw_user_meta_data.name}
              &nbsp;opened&nbsp;
              <Timestamp timestamp={issue.created_at} />
            </p>
          </div>
        </div>)}
      </div>
    </div>
  </AuthWrapper>
}

export default App
