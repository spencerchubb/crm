import { useRef, useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';
import Modal from './components/Modal';

const searchParams = new URLSearchParams(window.location.search);
const projectId = searchParams.get('project_id');

function LabelModal({ modalTitle, idOfItemToEdit, labelName, setLabelName, labelDescription, setLabelDescription }) {
  return <div style={{ display: 'flex', flexDirection: 'column', padding: 12 }}>
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
          : await supabase.from('labels').update({ project_id: projectId, name: labelName, description: labelDescription }).eq('id', idOfItemToEdit.current);
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
}

function AddMemberModal() {
  const lastQueryTime = useRef(0);
  const [role, setRole] = useState('member');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);

  async function searchUsers(query) {
    // Debounce the query
    if (Date.now() - lastQueryTime.current < 500) return;
    lastQueryTime.current = Date.now();

    if (!query) {
      setQuery('');
      setUsers([]);
      return;
    }

    const { data, error } = await supabase.from('users').select('*').ilike('name', `%${query}%`);
    if (error) {
      console.error(error);
      return;
    }
    setQuery(query);
    setUsers(data ?? []);
  }

  async function addMember(user, role) {
    const { error } = await supabase.from('project_members').insert({ project_id: projectId, uid: user.id, role });
    if (error) {
      console.error(error);
      return;
    }
    location.reload();
  }

  return <div style={{ display: 'flex', flexDirection: 'column', padding: 16 }}>
    <select value={role} onChange={e => setRole(e.target.value)}>
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
    <p style={{ marginTop: 24, fontSize: 14, color: '#aaa' }}>Name</p>
    <input
      style={{ marginTop: 4 }}
      type="text"
      placeholder="Search name"
      // value={query}
      onChange={e => searchUsers(e.target.value)}
    />
    {users.map(user => <button
      key={user.id}
      style={{ marginTop: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
      className="btnSecondary"
      onClick={() => addMember(user, role)}
    >
      <img src={user.picture} style={{ width: 24, height: 24, borderRadius: '50%' }} />
      {user.name}
    </button>)}
    {query && users.length === 0 && <p style={{ marginTop: 8, color: '#aaa' }}>No users found</p>}
  </div>
}

function App() {
  const authWrapperHook = useAuthWrapper();
  const [project, setProject] = useState(null);
  const [labels, setLabels] = useState([]);
  const [members, setMembers] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelDescription, setLabelDescription] = useState('');
  const idOfLabelToEdit = useRef(null);

  async function fetchData(session) {
    const [{ data: project, error: projectError }, { data: labels, error: labelsError }, { data: members, error: membersError }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('labels').select('*').eq('project_id', projectId),
      supabase.from('project_members').select('*, users(*)').eq('project_id', projectId),
    ]);

    if (projectError) {
      console.error(projectError);
      return;
    }
    if (labelsError) {
      console.error(labelsError);
      return;
    }
    if (membersError) {
      console.error(membersError);
      return;
    }

    setProject(project);
    setLabels(labels || []);
    setMembers(members || []);
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
    setProject(project => ({ ...project, name }));
  }

  function showCreateLabelModal() {
    setModalTitle('Create Label');
    setLabelName('');
    setLabelDescription('');
  }

  function showEditModal(label) {
    idOfLabelToEdit.current = label.id;
    setModalTitle('Edit Label');
    setLabelName(label.name);
    setLabelDescription(label.description);
  }

  async function deleteLabel(label) {
    if (!window.confirm(`Do you want to delete the label "${label.name}"?`)) return;
    const { error } = await supabase.from('labels').delete().eq('id', label.id);
    if (error) {
      console.error(error);
      return;
    }
    setLabels(labels => labels.filter(l => l.id !== label.id));
  }

  function showAddMemberModal() {
    setModalTitle('Add Member');
  }

  async function updateMemberRole(member, role) {
    const { error } = await supabase.from('project_members').update({ role }).eq('uid', member.uid);
    if (error) {
      console.error(error);
      return;
    }
    setMembers(members => members.map(m => m.uid === member.uid ? { ...m, role } : m));
  }

  async function deleteMember(member) {
    if (!window.confirm(`Do you want to remove ${member.users.name} from the project?`)) return;
    const { error } = await supabase.from('project_members').delete().eq('uid', member.uid);
    if (error) {
      console.error(error);
      return;
    }
    setMembers(members => members.filter(m => m.uid !== member.uid));
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{ padding: 16, width: '100%', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 22 }}>{project?.name}</h1>
        <button className="btnPrimary" onClick={changeProjectName}>Change Name</button>
      </div>
      <div style={{ marginTop: 50 }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <h2 style={{ fontSize: 18 }}>Labels</h2>
        <button
          className="btnPrimary"
          onClick={() => showCreateLabelModal()}
        >
          Create Label
        </button>
      </div>
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', width: '100%' }}>
        {labels.length === 0 && <p style={{ color: '#aaa' }}>No labels yet</p>}
        {labels.map(label => <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: 'solid 1px #555', padding: 8 }}>
          <div>
            <p>{label.name}</p>
            <p style={{ marginTop: 4, color: '#aaa', fontSize: 14 }}>{label.description}</p>
          </div>
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
            onClick={() => deleteLabel(label)}>
            🗑️
          </button>
        </div>)}
      </div>
      <div style={{ marginTop: 50 }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <h2 style={{ fontSize: 18 }}>Members</h2>
        <button
          className="btnPrimary"
          onClick={() => showAddMemberModal()}
        >
          Add Member
        </button>
      </div>
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', width: '100%' }}>
        {members.length === 0 && <p style={{ color: '#aaa' }}>No members yet</p>}
        {members.map(member => <div key={member.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: 'solid 1px #555', padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={member.users.picture} style={{ width: 24, height: 24, borderRadius: '50%' }} />
            <p>{member.users.name}</p>
          </div>
          <div style={{ flex: 1 }} />
          <select value={member.role} onChange={e => updateMemberRole(member, e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            className="btnSecondary"
            style={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => deleteMember(member)}>
            🗑️
          </button>
        </div>)}
      </div>
    </div>

    <Modal open={modalTitle} setOpen={v => !v && setModalTitle('')} title={modalTitle}>
      {(modalTitle === 'Create Label' || modalTitle === 'Edit Label') && <LabelModal
        modalTitle={modalTitle}
        idOfItemToEdit={idOfLabelToEdit}
        labelName={labelName}
        setLabelName={setLabelName}
        labelDescription={labelDescription}
        setLabelDescription={setLabelDescription}
      />}
      {modalTitle == 'Add Member' && <AddMemberModal />}
    </Modal>
  </AuthWrapper>
}

export default App
