import { useState } from 'react';
import { supabase } from './supabase';
import { AuthWrapper, useAuthWrapper } from './AuthWrapper';

function App() {
  const authWrapperHook = useAuthWrapper();
  const [projects, setProjects] = useState([]);

  async function fetchData(session) {
    const { data: projects, error: projectsError } = await supabase
      .from('project_members')
      .select('*, projects(*)')
      .eq('uid', session.user.id);
    if (projectsError) {
      console.error(projectsError);
      return;
    }
    setProjects(projects);
    authWrapperHook.setUser(session?.user);
  }

  return <AuthWrapper fetchData={fetchData} authWrapperHook={authWrapperHook}>
    <div style={{ padding: 16, width: '100%', maxWidth: 700 }}>
      <button
        className="btnPrimary"
        onClick={async () => {
          const projectName = prompt('Project Name');
          if (!projectName) return;
          const { data: project, error: projectError } = await supabase.from('projects').insert({ name: projectName }).select().single();
          if (projectError) {
            console.error(projectError);
            return;
          }
          const { error: projectMemberError } = await supabase.from('project_members').insert({ project_id: project.id, uid: authWrapperHook.user.id, role: 'admin' });
          if (projectMemberError) {
            console.error(projectMemberError);
            return;
          }
          location.href = `/project/?id=${project.id}`;
        }}
      >
        New Project
      </button>
      <div className="issuesList" style={{ marginTop: 16 }}>
        {projects.length === 0 && <p style={{ color: '#aaa' }}>No projects yet</p>}
        {projects.map(project => <div key={project.projects.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px 8px', gap: 8, borderTop: 'solid 1px #555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={`/project/?id=${project.projects.id}`}>{project.projects.name}</a>
          </div>
        </div>)}
      </div>
    </div>
  </AuthWrapper>
}

export default App
