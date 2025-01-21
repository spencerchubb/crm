import { useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import { Timestamp } from './components/Timestamp';

const searchParams = new URLSearchParams(window.location.search);
const issueId = searchParams.get('id');

function App() {
  const authWrapperHook = useAuthWrapper();
  const [issue, setIssue] = useState(undefined);
  const [messages, setMessages] = useState([]);

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
      <h1>{issue?.title}</h1>
      <p style={{ marginTop: 16 }}>{issue?.description}</p>
      
      <div>
        {messages.map(message => (
          <div key={message.id} style={{ 
            marginTop: 16, 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #333'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 8,
              color: '#aaa'
            }}>
              <span style={{ fontWeight: 600 }}>
                {message.users?.raw_user_meta_data?.name || 'Unknown User'}
              </span>
              <Timestamp timestamp={message.created_at} />
            </div>
            <p style={{ 
              marginTop: 8,
              color: '#e1e1e1',
              lineHeight: '1.5'
            }}>{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  </AuthWrapper>
}

export default App
