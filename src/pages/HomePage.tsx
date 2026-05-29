import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Match, Team } from '../types';
import { calculateStandings } from '../utils/standings';
import Navbar from '../components/Navbar';

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '2px solid #ddd',
  borderRight: '1px solid #eee',
  textAlign: 'center',
};

const tableCellCentered: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #eee',
  borderRight: '1px solid #f0f0f0',
  textAlign: 'center',
};

const tableCellLeft: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #eee',
  borderRight: '1px solid #f0f0f0',
  textAlign: 'left',
};
function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const standings = calculateStandings(teams, matches);

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
  }

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        match_sets (*)
      `)
      .order('played_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const sortedMatches = (data ?? []).map((match) => ({
      ...match,
      match_sets: [...match.match_sets].sort(
        (a, b) => a.set_number - b.set_number
      ),
    }));

    setMatches(sortedMatches);
  }

  useEffect(() => {
    fetchTeams();
    fetchMatches();
  }, []);

  return (
    <main style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'Arial' }}>
      <Navbar />

      <section>
        <h1>Standings</h1>

        {standings.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <table
  style={{
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px',
  }}
>
  <thead>
    <tr style={{ backgroundColor: '#f5f5f5' }}>
      <th style={tableHeaderStyle}>Seed</th>
      <th style={tableHeaderStyle}>Team</th>
      <th style={tableHeaderStyle}>W</th>
      <th style={tableHeaderStyle}>L</th>
      <th style={tableHeaderStyle}>Sets</th>
      <th style={tableHeaderStyle}>Set +/-</th>
      <th style={tableHeaderStyle}>Point +/-</th>
    </tr>
  </thead>

  <tbody>
    {standings.map((standing, index) => (
      <tr
        key={standing.teamId}
        style={{
          backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
        }}
      >
        <td style={tableCellCentered}>{index + 1}</td>

        <td style={tableCellLeft}>
          {standing.teamName}
        </td>

        <td style={tableCellCentered}>
          {standing.wins}
        </td>

        <td style={tableCellCentered}>
          {standing.losses}
        </td>

        <td style={tableCellCentered}>
          {standing.setsWon}-{standing.setsLost}
        </td>

        <td style={tableCellCentered}>
          {standing.setDifferential}
        </td>

        <td style={tableCellCentered}>
          {standing.pointDifferential}
        </td>
      </tr>
    ))}
  </tbody>
</table>
        )}
      </section>
    </main>
  );
}

export default HomePage;