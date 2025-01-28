import { useState, memo } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import { Timestamp } from './components/Timestamp';
import { MarkdownEditor } from './components/MarkdownEditor';
import ReactMarkdown from 'react-markdown';
import Modal from './components/Modal';

const searchParams = new URLSearchParams(window.location.search);
const issueId = searchParams.get('id');

const Message = memo(function Message({ message }) {
  return <div style={{
    padding: 16,
    borderRadius: 8,
    border: '1px solid #333',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
      color: '#aaa'
    }}>
      <img
        src={message.users?.picture}
        alt={message.users?.name}
        style={{ width: 32, height: 32, borderRadius: '50%' }}
      />
      <span style={{ fontWeight: 600 }}>
        {message.users?.name || 'Unknown User'}
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
});

function EditTitleButton({ issue, setIssue }) {
  return <button
    className='btnSecondary'
    style={{ padding: 4 }}
    onClick={async () => {
      const newTitle = prompt('Enter new title:', issue?.title);
      if (!newTitle || newTitle === issue?.title) return;
      const { error } = await supabase.from('issues').update({ title: newTitle }).eq('id', issueId);
      if (error) {
        console.error(error);
        return;
      }
      setIssue(issue => ({ ...issue, title: newTitle }));
    }}
  >
    ✏️
  </button >
}

function DeleteIssueButton({ issue }) {
  return (
    <button
      className='btnSecondary'
      style={{ padding: 4 }}
      onClick={async () => {
        if (!confirm(`Delete issue "${issue?.title}"?`)) {
          return;
        }

        // Delete the issue.
        // Other tables will cascade delete if they reference this issue.
        const { error: issueError } = await supabase
          .from('issues')
          .delete()
          .eq('id', issueId);

        if (issueError) {
          console.error('Error deleting issue:', issueError);
          return;
        }

        // Redirect to issues list
        window.location.href = '/';
      }}
    >
      🗑️
    </button>
  );
}

function CompleteWidget({ issue }) {
  // If completed_at is set, show timestamp and 'Mark as open' button.
  // Otherwise, show 'Mark as complete' button.
  return <button
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 4 }}
    className="btnSecondary"
    onClick={async () => {
      const { error } = await supabase.from('issues').update({ completed_at: issue.completed_at ? null : new Date() }).eq('id', issueId);
      if (error) {
        console.error(error);
        return;
      }
      location.reload();
    }}
  >
    {issue.completed_at ? 'Mark as open' : 'Mark as complete'}
    {issue.completed_at && <span style={{ color: '#aaa' }}>Completed <Timestamp timestamp={issue.completed_at} /></span>}
  </button>
}

function LabelBadge({ label, onRemove }) {
  return <p style={{ display: 'flex', alignItems: 'center', border: 'solid 1px #555', borderRadius: 100, padding: '4px 8px', gap: 4, fontSize: 14 }}>
    {label.labels.name}
    <button
      onClick={onRemove}
      className="btnSecondary"
      style={{ border: 'none', padding: 2, display: 'flex' }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '14px', height: '14px' }} stroke='white' strokeWidth='12' strokeLinecap='round'>
        <line x1="20" y1="20" x2="80" y2="80" />
        <line x1="80" y1="20" x2="20" y2="80" />
      </svg>
    </button>
  </p>
}

function LabelManager({ labels, attachedLabels, setAttachedLabels }) {
  const [modalOpen, setModalOpen] = useState(false);

  async function attachLabel(labelId) {
    const { error } = await supabase.from('attached_labels').insert({
      issue_id: issueId,
      label_id: labelId
    });

    if (error) {
      console.error(error);
      return;
    }

    setAttachedLabels(attachedLabels => [...attachedLabels, {
      issue_id: issueId,
      label_id: labelId,
      labels: labels.find(l => l.id === labelId),
    }]);
  }

  async function detachLabel(labelId) {
    const { error } = await supabase.from('attached_labels').delete()
      .eq('issue_id', issueId)
      .eq('label_id', labelId);

    if (error) {
      console.error(error);
      return;
    }

    setAttachedLabels(attachedLabels => attachedLabels.filter(l => l.labels.id !== labelId));
  }

  return <div style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        className="btnSecondary"
        style={{ border: 'none', padding: 4, display: 'flex', alignItems: 'center' }}
        onClick={() => setModalOpen(true)}
      >
        <svg viewBox="0 0 100 100" style={{ width: '16px', height: '16px' }} stroke='white' strokeWidth='12' strokeLinecap='round'>
          <line x1="50" y1="10" x2="50" y2="90" />
          <line x1="10" y1="50" x2="90" y2="50" />
        </svg>
      </button>
      <h3>Labels</h3>
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {attachedLabels.length === 0 && <p style={{ color: '#aaa' }}>No labels yet</p>}
      {attachedLabels.map(label => (
        <LabelBadge
          key={label.labels.id}
          label={label}
          onRemove={() => detachLabel(label.labels.id)}
        />
      ))}
    </div>

    <Modal open={modalOpen} setOpen={setModalOpen} title="Add Labels">
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {labels
          .filter(l => !attachedLabels.find(al => al.id === l.id))
          .map(label => (
            <button
              key={label.id}
              onClick={() => {
                attachLabel(label.id);
                setModalOpen(false);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
              className="btnSecondary"
            >
              <p>{label.name}</p>
              <p style={{ fontSize: 14, color: '#aaa' }}>{label.description}</p>
            </button>
          ))}
      </div>
    </Modal>
  </div>
}

function App() {
  const authWrapperHook = useAuthWrapper();
  const [issue, setIssue] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [comment, setComment] = useState('');
  const [labels, setLabels] = useState([]);
  const [attachedLabels, setAttachedLabels] = useState([]);

  async function fetchData(session) {
    const { data: issue, error: issueError } = await supabase.from('issues').select('*').eq('id', issueId).single();
    if (issueError) {
      console.error(issueError);
      return;
    }

    const [{ data: messages, error: messagesError }, { data: labels, error: labelsError }, { data: attachedLabels, error: attachedLabelsError }] = await Promise.all([
      supabase.from('messages').select('*, users(*)').eq('issue_id', issueId).order('created_at', { ascending: true }),
      supabase.from('labels').select('*').eq('project_id', issue?.project_id),
      supabase.from('attached_labels').select('*, labels(*)').eq('issue_id', issueId)
    ]);

    if (issueError) {
      console.error(issueError);
      return;
    }
    if (messagesError) {
      console.error(messagesError);
      return;
    }
    if (labelsError) {
      console.error(labelsError);
      return;
    }
    if (attachedLabelsError) {
      console.error(attachedLabelsError);
      return;
    }

    document.title = issue?.title;
    setIssue(issue);
    setMessages(messages || []);
    setLabels(labels || []);
    setAttachedLabels(attachedLabels || []);
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: 1000,
      gap: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h1>
          {issue?.title}
          &nbsp;
          <span style={{ color: '#aaa', fontWeight: 500 }}>#{issue?.number}</span>
        </h1>
        <div style={{ flex: 1 }} />
        <EditTitleButton issue={issue} setIssue={setIssue} />
        <DeleteIssueButton issue={issue} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map(message => (
              <Message key={message.id} message={message} />
            ))}
          </div>
          <div style={{ marginTop: 16 }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CompleteWidget issue={issue} />
          <div style={{ marginTop: 16 }} />
          <div style={{ marginTop: 16 }} />
          <LabelManager labels={labels} attachedLabels={attachedLabels} setAttachedLabels={setAttachedLabels} />
        </div>
      </div>
    </div>
  </AuthWrapper>
}

export default App
