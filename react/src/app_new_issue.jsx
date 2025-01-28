import { useRef, useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import { MarkdownEditor } from './components/MarkdownEditor';
import { generateEmbedding } from './embeddings';

const searchParams = new URLSearchParams(window.location.search);
const projectId = searchParams.get('project_id');

function App() {
  const authWrapperHook = useAuthWrapper();
  const [title, setTitle] = useState('only allow changing settings if the user is an admin');
  const [description, setDescription] = useState('');
  const [similarIssues, setSimilarIssues] = useState([]);
  const [readyToCreate, setReadyToCreate] = useState(false);

  async function fetchData(session) {
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
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
      <div style={{ marginTop: 4 }}></div>
      <MarkdownEditor
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Write description in Markdown"
      />
      <button
        style={{ marginTop: 8, alignSelf: 'flex-start' }}
        className="btnPrimary"
        onClick={async () => {
          const embedding = await generateEmbedding(`${title}\n\n${description}`);

          const { data: issues } = await supabase.rpc('get_similar_issues', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5,
          })
          setSimilarIssues(issues);
          setReadyToCreate(true);
        }}
      >
        Check for similar issues
      </button>
      {readyToCreate && similarIssues.length === 0 && <p style={{ marginTop: 32, color: '#aaa' }}>
        No similar issues found
      </p>}
      {similarIssues.length > 0 && <p style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>
        Similar issues
      </p>}
      {similarIssues.map(issue => (
        <a key={issue.id} href={`/issue/?id=${issue.id}`} className="link">
          <button className="btnSecondary" style={{ marginTop: 8 }}>
            {issue.title}
          </button>
        </a>
      ))}
      {readyToCreate && <button
        style={{ marginTop: 16, alignSelf: 'flex-start' }}
        className="btnPrimary"
        onClick={async () => {
          const { data: rows } = await supabase.from('issues').select('number').eq('project_id', projectId).order('number', { ascending: false }).limit(1);
          const singleRow = rows.length > 0 ? rows[0] : null;
          const maxNumber = singleRow ? singleRow.number : 0;

          const embedding = await generateEmbedding(`${title}\n\n${description}`);

          const { data: issueData, error: issueError } = await supabase.from('issues').insert({
            title,
            author_id: authWrapperHook.user.id,
            project_id: projectId,
            number: 1 + maxNumber,
            embedding,
          }).select();

          if (issueError) {
            console.error('Error creating issue:', issueError);
            return;
          }

          // Create the first message for this issue
          const { error: messageError } = await supabase.from('messages').insert({
            issue_id: issueData[0].id,
            uid: authWrapperHook.user.id,
            content: description,
          });

          if (messageError) {
            console.error('Error creating message:', messageError);
          } else {
            history.back();
          }
        }}
      >
        Create new issue
      </button>}
    </div>
  </AuthWrapper>
}

export default App
