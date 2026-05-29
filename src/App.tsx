import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

type Team = {
  id: string;
  name: string;
  created_at: string;
};

function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) {
      console.error(error);
      return;
    }

    setTeams(data ?? []);
  }

  async function addTeam() {
    const trimmedName = teamName.trim();

    if (!trimmedName) return;

    setLoading(true);

    const { error } = await supabase
      .from('teams')
      .insert({ name: trimmedName });

    setLoading(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setTeamName('');
    fetchTeams();
  }

  async function deleteTeam(id: string) {
    const confirmed = window.confirm('Delete this team?');

    if (!confirmed) return;

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    fetchTeams();
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <main style={{ maxWidth: '720px', margin: '40px auto', fontFamily: 'Arial' }}>
      <h1>Admin Team Management</h1>

      <section style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Team name"
          style={{ flex: 1, padding: '8px' }}
        />

        <button onClick={addTeam} disabled={loading}>
          {loading ? 'Adding...' : 'Add Team'}
        </button>
      </section>

      <section>
        <h2>Teams</h2>

        {teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {teams.map((team) => (
              <li
                key={team.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  border: '1px solid #ddd',
                  marginBottom: '8px',
                  borderRadius: '6px',
                }}
              >
                <span>{team.name}</span>
                <button onClick={() => deleteTeam(team.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;