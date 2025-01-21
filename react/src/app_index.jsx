import { useState } from 'react';
import { format } from 'timeago.js';
import { supabase } from './supabase';
import { AuthWrapper } from './AuthWrapper';

function App() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
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
    setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} user={user} loading={loading} setLoading={setLoading}>
    <div>
      <a href="/new_issue.html"><button className="btnPrimary">New issue</button></a>
      <div className="issuesList">
        {issues.map(issue => <div key={issue.id} style={{ display: 'flex', flexDirection: 'column', padding: 8, gap: 4, borderTop: 'solid 1px #555' }}>
          <a href={`/issue.html?id=${issue.id}`}>{issue.title}</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#aaa' }}>
            <p style={{ fontSize: 14, color: '#aaa' }}>
              {issue.users.raw_user_meta_data.name}
              &nbsp;opened&nbsp;
              <span title={new Date(issue.created_at).toLocaleString()}>{format(issue.created_at.toLocaleString())}</span>
            </p>
          </div>
        </div>)}
      </div>
    </div>
  </AuthWrapper>
}

function StatusBadge({ issue, setIssues }) {
  let status = issue.status;
  const map = {
    'New': 'blue',
    'Open': 'green',
    'Pending': 'yellow',
    'On-hold': 'orange',
    'Solved': 'purple',
    'Closed': 'gray',
    'Unknown': 'gray',
  };
  if (!map[status]) status = 'Unknown';
  return <select
    className={`badge ${map[status]}`}
    value={status}
    onChange={async (e) => {
      const value = e.target.value;
      setIssues(issues => {
        return issues.map(element => {
          if (element.id === issue.id) {
            return { ...element, status: value };
          }
          return element;
        });
      });
      await supabase.from('issues').update({ status: value }).eq('id', issue.id);
    }}
  >
    <option value="New">New</option>
    <option value="Open">Open</option>
    <option value="Pending">Pending</option>
    <option value="On-hold">On-hold</option>
    <option value="Solved">Solved</option>
    <option value="Closed">Closed</option>
  </select>;
}

function PriorityBadge({ issue, setIssues }) {
  let priority = issue.priority;
  const map = {
    'Low': 'green',
    'Normal': 'yellow',
    'High': 'orange',
    'Urgent': 'red',
    'Unknown': 'gray',
  };
  if (!map[priority]) priority = 'Unknown';
  return <select
    className={`badge ${map[priority]}`}
    value={priority}
    onChange={async (e) => {
      const value = e.target.value;
      setIssues(issues => {
        return issues.map(element => {
          if (element.id === issue.id) {
            return { ...element, priority: value };
          }
          return element;
        });
      });
      await supabase.from('issues').update({ priority: value }).eq('id', issue.id);
    }}
  >
    <option value="Low">Low</option>
    <option value="Normal">Normal</option>
    <option value="High">High</option>
    <option value="Urgent">Urgent</option>
  </select>;
}

export default App
