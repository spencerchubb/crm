import { useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import { Timestamp } from './components/Timestamp';

const SHOW_OPEN_ISSUES_DEFAULT = true;

function App() {
  const authWrapperHook = useAuthWrapper();
  const [issues, setIssues] = useState([]);
  const [showOpenIssues, setShowOpenIssues] = useState(SHOW_OPEN_ISSUES_DEFAULT);

  async function fetchIssues(showOpenIssues) {
    console.log('fetching issues', showOpenIssues);
    // To make it possible to join with users, we created this view:
    // https://supabase.com/dashboard/project/pokkflfmgpbgphcredjk/sql/1ba57cf9-8bea-49c0-a91b-946adab6d8ef
    let query = supabase.from('issues').select(`*, users(raw_user_meta_data), attached_labels(labels(id, name))`);
    if (showOpenIssues) {
      query = query.is('completed_at', null).order('created_at', { ascending: false });
    } else {
      query = query.not('completed_at', 'is', null).order('completed_at', { ascending: false });
    }
    const { data: issues, error: issuesError } = await query;
    if (issuesError) {
      console.error(issuesError);
      return;
    }
    setIssues(issues);
  }

  async function fetchData(session) {
    await fetchIssues(SHOW_OPEN_ISSUES_DEFAULT);
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{ padding: 16, width: '100%', maxWidth: 700 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={showOpenIssues} onChange={async e => {
          // const value = e.target.value;
          // parse bool
          const value = parseInt(e.target.value);
          await fetchIssues(value);
          setShowOpenIssues(value);
        }}>
          <option value={1}>Open</option>
          <option value={0}>Completed</option>
        </select>
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
