import { useRef, useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import Modal from './components/Modal';

const searchParams = new URLSearchParams(window.location.search);
const projectId = searchParams.get('project_id');

function App() {
  const authWrapperHook = useAuthWrapper();
  const [project, setProject] = useState(null);
  const [labels, setLabels] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelDescription, setLabelDescription] = useState('');
  const idOfLabelToEdit = useRef(null);

  async function fetchData(session) {
    const [{ data: project, error: projectError }, { data: labels, error: labelsError }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('labels').select('*').eq('project_id', projectId),
    ]);

    if (projectError) {
      console.error(projectError);
      return;
    }
    if (labelsError) {
      console.error(labelsError);
      return;
    }

    setProject(project);
    setLabels(labels || []);
    authWrapperHook.setUser(session?.user);
  }

  async function changeProjectName() {
    const name = prompt('New name', project?.name);
    if (!name) return;
    const { error } = await supabase.from('projects').update({ name }).eq('id', projectId);
    if (error) {
      console.error(error);
      return;
    }
    location.reload();
  }

  function showCreateModal() {
    setModalTitle('Create Label');
    setModalOpen(true);
    setLabelName('');
    setLabelDescription('');
  }

  function showEditModal(label) {
    idOfLabelToEdit.current = label.id;
    setModalTitle('Edit Label');
    setModalOpen(true);
    setLabelName(label.name);
    setLabelDescription(label.description);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{ padding: 16, width: '100%', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 22 }}>{project?.name}</h1>
        <button className="btnPrimary" onClick={changeProjectName}>Change Name</button>
      </div>
      <div style={{ marginTop: 50 }}></div>
      <button
        className="btnPrimary"
        onClick={() => showCreateModal()}
      >
        Create Label
      </button>
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', width: '100%' }}>
        {labels.length === 0 && <p style={{ color: '#aaa' }}>No labels yet</p>}
        {labels.map(label => <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: 'solid 1px #555', padding: 16 }}>
          <p style={{ fontWeight: 600 }}>{label.name}</p>
          <p style={{ color: '#aaa' }}>{label.description}</p>
          <div style={{ flex: 1 }} />
          <button
            className="btnSecondary"
            style={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => showEditModal(label)}>
            ✏️
          </button>
          <button
            className="btnSecondary"
            style={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={async () => {
              if (!window.confirm(`Do you want to delete the label "${label.name}"?`)) return;
              const { error } = await supabase.from('labels').delete().eq('id', label.id);
              if (error) {
                console.error(error);
                return;
              }
              location.reload();
            }}>
            🗑️
          </button>
        </div>)}
      </div>
    </div>
    <Modal open={modalOpen} setOpen={setModalOpen} title={modalTitle}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: 12 }}>
        <p>Name</p>
        <input style={{ marginTop: 4 }} type="text" placeholder="Label Name" value={labelName} onChange={e => setLabelName(e.target.value)} />
        <p style={{ marginTop: 16 }}>Description</p>
        <input style={{ marginTop: 4 }} type="text" placeholder="Label Description" value={labelDescription} onChange={e => setLabelDescription(e.target.value)} />
        <button
          className="btnPrimary"
          style={{ marginTop: 16, alignSelf: 'flex-end' }}
          onClick={async () => {
            const { error } = modalTitle === 'Create Label'
              ? await supabase.from('labels').insert({ project_id: projectId, name: labelName, description: labelDescription })
              : await supabase.from('labels').update({ project_id: projectId, name: labelName, description: labelDescription }).eq('id', idOfLabelToEdit.current);
            if (error) {
              console.error(error);
              return;
            }
            location.reload();
          }}
        >
          Submit
        </button>
      </div>
    </Modal>
  </AuthWrapper>
}

export default App
