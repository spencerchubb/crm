import { useState, useEffect, useRef } from 'react';
import { format } from 'timeago.js';
import { supabase } from './supabase';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(undefined);
  const [issues, setIssues] = useState([]);
  const userRef = useRef(undefined);

  useEffect(() => {
    async function fetchData(session) {
      if (JSON.stringify(userRef.current) === JSON.stringify(session?.user)) {
        return;
      }
      userRef.current = session?.user;

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
      setUser(session?.user);
      setIssues(issues);
      setLoading(false);
    }

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setLoading(false);
        return;
      }

      fetchData(session);
    });

    supabase.auth.getUser().then(async ({ session, error }) => {
      if (!session || error) {
        setLoading(false);
        return;
      }

      fetchData(session);
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <LoadingPage />;
  if (!user) return <SignInPage />;

  return <div>
    <a href="/new_issue.html"><button className="btnPrimary">New issue</button></a>
    <div className="issuesList">
      {issues.map(issue => <div key={issue.id} style={{ display: 'flex', flexDirection: 'column', padding: 8, gap: 4, borderTop: 'solid 1px #555' }}>
        <a href={`/?issue=${issue.id}`}>{issue.title}</a>
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

function LoadingPage() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <LoadingSpinner size={75} strokeWidth={10} />
  </div>
}

function LoadingSpinner({ size = 32, strokeWidth = 10 }) {
  const radius = size / 2 - strokeWidth / 2;
  return <div className="loadingSpinner" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id="strokeGradient">
          <stop offset="0%" stopColor="#48a5ff" />
          <stop offset="100%" stopColor="#4e00d7" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={radius} stroke="url(#strokeGradient)" strokeWidth={strokeWidth} fill="none" />
    </svg>
  </div>
}

function SignInPage() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <SignInWithGoogleButton />
  </div>
}

function SignInWithGoogleButton() {
  return <button
    id="googleButton"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={() => {
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://pokkflfmgpbgphcredjk.supabase.co/auth/v1/callback'
        },
      })
    }}
  >
    <svg viewBox="0 0 262 262">
      <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
      <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
      <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
      <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
    </svg>
    <p style={{ margin: 0 }}>Sign in with Google</p>
  </button>
}

export default App
