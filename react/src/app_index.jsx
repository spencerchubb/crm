import { useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import { Timestamp } from './components/Timestamp';

const DEFAULT_SHOW_OPEN_ISSUES = true;
const DEFAULT_LABEL = '';
const DEFAULT_SORT_NEWEST = true;

function App() {
  const authWrapperHook = useAuthWrapper();
  const [issues, setIssues] = useState([]);
  const [labels, setLabels] = useState([]);
  const [showOpenIssues, setShowOpenIssues] = useState(DEFAULT_SHOW_OPEN_ISSUES);
  const [selectedLabel, setSelectedLabel] = useState(DEFAULT_LABEL);
  const [sortNewest, setSortNewest] = useState(DEFAULT_SORT_NEWEST);

  async function fetchIssues(showOpenIssues, selectedLabel, sortNewest) {
    // To make it possible to join with users, we created this view:
    // https://supabase.com/dashboard/project/pokkflfmgpbgphcredjk/sql/1ba57cf9-8bea-49c0-a91b-946adab6d8ef

    let query;
    if (selectedLabel) {
      // Join with attached_labels once to get issues with a specific label.
      // Then join with attached_labels again to get the labels of those issues.
      query = supabase
        .from('issues')
        .select(`*, users(raw_user_meta_data), al1:attached_labels!inner(), attached_labels(labels(id, name))`)
        .eq('al1.label_id', selectedLabel);
    } else {
      query = supabase
        .from('issues')
        .select(`*, users(raw_user_meta_data), attached_labels(labels(id, name))`);
    }

    if (showOpenIssues) {
      query = query.is('completed_at', null);
    } else {
      query = query.not('completed_at', 'is', null);
    }

    // Apply ordering
    query = query.order(showOpenIssues ? 'created_at' : 'completed_at', { ascending: !sortNewest });

    const { data: issues, error: issuesError } = await query;
    if (issuesError) {
      console.error(issuesError);
      return;
    }
    setIssues(issues);
  }

  async function fetchData(session) {
    // Fetch labels
    const { data: labelsData, error: labelsError } = await supabase.from('labels').select('*');
    if (labelsError) {
      console.error(labelsError);
      return;
    }
    setLabels(labelsData);

    await fetchIssues(DEFAULT_SHOW_OPEN_ISSUES, DEFAULT_LABEL, DEFAULT_SORT_NEWEST);
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{ padding: 16, width: '100%', maxWidth: 700 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={showOpenIssues} onChange={async e => {
          const value = parseInt(e.target.value);
          await fetchIssues(value, selectedLabel, sortNewest);
          setShowOpenIssues(value);
        }}>
          <option value={1}>Open</option>
          <option value={0}>Completed</option>
        </select>
        <select value={selectedLabel} onChange={async e => {
          const value = e.target.value;
          await fetchIssues(showOpenIssues, value, sortNewest);
          setSelectedLabel(value);
        }}>
          <option value={DEFAULT_LABEL}>No label</option>
          {labels.map(label => <option key={label.id} value={label.id}>{label.name}</option>)}
        </select>
        <select value={sortNewest} onChange={async e => {
          const value = parseInt(e.target.value);
          await fetchIssues(showOpenIssues, selectedLabel, value);
          setSortNewest(value);
        }}>
          <option value={1}>Newest</option>
          <option value={0}>Oldest</option>
        </select>
        <a href="/labels/"><button className="btnSecondary">Labels</button></a>
        <a href="/new_issue/"><button className="btnPrimary">New Issue</button></a>
      </div>
      <div className="issuesList" style={{ marginTop: 16 }}>
        {issues.map(issue => <div key={issue.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px 8px', gap: 8, borderTop: 'solid 1px #555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={`/issue/?id=${issue.id}`}>{issue.title}</a>
            {issue.attached_labels.map(label => {
              if (!label.labels) return null;
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
              #{issue.number} · {issue.users.raw_user_meta_data.name} {issue.completed_at ? 'completed' : 'opened'} <Timestamp timestamp={issue.completed_at || issue.created_at} />
            </p>
          </div>
        </div>)}
      </div>
    </div>
  </AuthWrapper>
}

export default App
