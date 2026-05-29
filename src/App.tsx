import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

type Team = {
  id: string;
  name: string;
  created_at: string;
};

type Player = {
  id: string;
  team_id: string;
  name: string;
  created_at: string;
};

function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  async function fetchTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) {
      alert(error.message);
      return;
    }

    setTeams(data ?? []);

    if (!selectedTeamId && data && data.length > 0) {
      setSelectedTeamId(data[0].id);
    }
  }

  async function fetchPlayers(teamId: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name');

    if (error) {
      alert(error.message);
      return;
    }

    setPlayers(data ?? []);
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
      alert(error.message);
      return;
    }

    setTeamName('');
    fetchTeams();
  }

  async function deleteTeam(id: string) {
    if (!window.confirm('Delete this team and all its players?')) return;

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    if (selectedTeamId === id) {
      setSelectedTeamId('');
      setPlayers([]);
    }

    fetchTeams();
  }

  async function addPlayer() {
    const trimmedName = playerName.trim();

    if (!trimmedName || !selectedTeamId) return;

    const { error } = await supabase
      .from('players')
      .insert({
        name: trimmedName,
        team_id: selectedTeamId,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setPlayerName('');
    fetchPlayers(selectedTeamId);
  }

  async function deletePlayer(id: string) {
    if (!window.confirm('Delete this player?')) return;

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchPlayers(selectedTeamId);
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchPlayers(selectedTeamId);
    }
  }, [selectedTeamId]);

  return (
    <main style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'Arial' }}>
      <h1>Admin Management</h1>

      <section style={{ marginBottom: '32px' }}>
        <h2>Teams</h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Team name"
            style={{ flex: 1, padding: '8px' }}
          />

          <button onClick={addTeam} disabled={loading}>
            {loading ? 'Adding...' : 'Add Team'}
          </button>
        </div>

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
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid #ddd',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  background: selectedTeamId === team.id ? '#f2f2f2' : 'white',
                }}
              >
                <button
                  onClick={() => setSelectedTeamId(team.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontWeight: selectedTeamId === team.id ? 'bold' : 'normal',
                  }}
                >
                  {team.name}
                </button>

                <button onClick={() => deleteTeam(team.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>
          Players
          {selectedTeam ? ` - ${selectedTeam.name}` : ''}
        </h2>

        {!selectedTeamId ? (
          <p>Select a team first.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Player name"
                style={{ flex: 1, padding: '8px' }}
              />

              <button onClick={addPlayer}>Add Player</button>
            </div>

            {players.length === 0 ? (
              <p>No players on this team yet.</p>
            ) : (
              <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                {players.map((player) => (
                  <li
                    key={player.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px',
                      border: '1px solid #ddd',
                      marginBottom: '8px',
                      borderRadius: '6px',
                    }}
                  >
                    <span>{player.name}</span>
                    <button onClick={() => deletePlayer(player.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;