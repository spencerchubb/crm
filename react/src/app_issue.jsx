import { useState, memo } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import { Timestamp } from './components/Timestamp';
import { MarkdownEditor } from './components/MarkdownEditor';
import ReactMarkdown from 'react-markdown';

const searchParams = new URLSearchParams(window.location.search);
const issueId = searchParams.get('id');

const Message = memo(function Message({ message }) {
  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      borderRadius: 8,
      border: '1px solid #333'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
        color: '#aaa'
      }}>
        <img
          src={message.users?.raw_user_meta_data?.avatar_url}
          alt={message.users?.raw_user_meta_data?.name}
          style={{ width: 32, height: 32, borderRadius: '50%' }}
        />
        <span style={{ fontWeight: 600 }}>
          {message.users?.raw_user_meta_data?.name || 'Unknown User'}
        </span>
        <div style={{ flex: 1 }} />
        <Timestamp timestamp={message.created_at} />
      </div>
      <div style={{
        marginTop: 8,
        color: '#e1e1e1',
        lineHeight: '1.5'
      }}>
        <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
      </div>
    </div>
  );
});

function CompleteWidget({ issue }) {
  // If completed_at is set, show timestamp and 'Mark as open' button.
  // Otherwise, show 'Mark as complete' button.

  if (issue.completed_at) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <p style={{ color: '#aaa' }}>Completed <Timestamp timestamp={issue.completed_at} /></p>
      <button
        className="btnSecondary"
        onClick={async () => {
          const { error } = await supabase.from('issues').update({ completed_at: null }).eq('id', issueId);
          if (error) {
            console.error(error);
            return;
          }
          location.reload();
        }}
      >
        Mark as open
      </button>
    </div>
  }

  return <button
    className="btnSecondary"
    onClick={async () => {
      const { error } = await supabase.from('issues').update({ completed_at: new Date() }).eq('id', issueId);
      if (error) {
        console.error(error);
        return;
      }
      location.reload();
    }}
  >
    Mark as complete
  </button>
}

function App() {
  const authWrapperHook = useAuthWrapper();
  const [issue, setIssue] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [comment, setComment] = useState('');

  async function fetchData(session) {
    const [{ data: issue, error: issueError }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from('issues').select('*').eq('id', issueId).single(),
      supabase.from('messages').select('*, users(raw_user_meta_data)').eq('issue_id', issueId).order('created_at', { ascending: true })
    ]);

    if (issueError) {
      console.error(issueError);
      return;
    }
    if (messagesError) {
      console.error(messagesError);
      return;
    }

    console.log(issue);
    document.title = issue?.title;
    setIssue(issue);
    setMessages(messages || []);
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h1>{issue?.title}</h1>
        <CompleteWidget issue={issue} />
      </div>
      <div>
        {messages.map(message => (
          <Message key={message.id} message={message} />
        ))}
      </div>
      <div style={{ marginTop: 32 }}></div>
      <MarkdownEditor
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Write message in Markdown"
      />
      <button
        style={{ marginTop: 8, alignSelf: 'flex-end' }}
        className="btnPrimary"
        onClick={async () => {
          const { error } = await supabase.from('messages').insert({
            issue_id: issueId,
            content: comment,
            uid: authWrapperHook.user.id
          });
          if (error) {
            console.error(error);
            return;
          }
          location.reload();
        }}>
        Send
      </button>
    </div>
  </AuthWrapper>
}

export default App
