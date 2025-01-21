import { useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper } from './AuthWrapper';

function App() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function fetchData(session) {
    setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} user={user} loading={loading} setLoading={setLoading}>
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 700 }}>
      <p style={{ marginTop: 16 }}>Title</p>
      <input
        type="text"
        placeholder="Title"
        style={{ marginTop: 4 }}
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <p style={{ marginTop: 16 }}>Description</p>
      <textarea
        placeholder="Write description in Markdown"
        style={{ marginTop: 4 }}
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <button
        style={{ marginTop: 16, alignSelf: 'flex-end' }}
        className="btnPrimary"
        onClick={async () => {
          console.log({
            title,
            description,
            author_id: user.id,
          });
          const { error } = await supabase.from('issues').insert({
            title,
            description,
            author_id: user.id,
          });
          if (error) {
            console.error(error);
          } else {
            console.log('Issue created');
          }
        }}
      >
        Create
      </button>
    </div>
  </AuthWrapper>
}

export default App
