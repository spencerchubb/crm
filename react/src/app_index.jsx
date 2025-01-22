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
      .select(`*, users(raw_user_meta_data), attached_labels(labels(id, name))`)
      .order('created_at', { ascending: false });
    if (issuesError) {
      console.error(issuesError);
      return;
    }
    setIssues(issues);
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{ padding: 16, width: '100%', maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'end', gap: 8 }}>
        <a href="/labels/"><button className="btnSecondary">Labels</button></a>
        <a href="/new_issue/"><button className="btnPrimary">New Issue</button></a>
      </div>
      <div className="issuesList" style={{ marginTop: 16 }}>
        {issues.map(issue => <div key={issue.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px 8px', gap: 8, borderTop: 'solid 1px #555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={`/issue/?id=${issue.id}`}>{issue.title}</a>
            {issue.attached_labels.map(label => {
              return <p
                key={label.labels.id}
                style={{ display: 'flex', alignItems: 'center', border: 'solid 1px #555', borderRadius: 100, padding: '4px 8px', gap: 4, fontSize: 14 }}
              >
                {label.labels.name}
              </p>
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#aaa' }}>
            <p style={{ fontSize: 14, color: '#aaa' }}>
              {issue.users.raw_user_meta_data.name}
              &nbsp;{issue.completed_at ? 'completed' : 'opened'}&nbsp;
              <Timestamp timestamp={issue.completed_at || issue.created_at} />
            </p>
          </div>
        </div>)}
      </div>
    </div>
  </AuthWrapper>
}

export default App
