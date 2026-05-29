import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Match, Team } from '../types';
import { calculateStandings } from '../utils/standings';
import Navbar from '../components/Navbar';

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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Seed</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Team</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>W</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>L</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Sets</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Set +/-</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Point +/-</th>
              </tr>
            </thead>

            <tbody>
              {standings.map((standing, index) => (
                <tr key={standing.teamId}>
                  <td style={{ padding: '8px 0' }}>{index + 1}</td>
                  <td style={{ padding: '8px 0' }}>{standing.teamName}</td>
                  <td style={{ padding: '8px 0' }}>{standing.wins}</td>
                  <td style={{ padding: '8px 0' }}>{standing.losses}</td>
                  <td style={{ padding: '8px 0' }}>
                    {standing.setsWon}-{standing.setsLost}
                  </td>
                  <td style={{ padding: '8px 0' }}>{standing.setDifferential}</td>
                  <td style={{ padding: '8px 0' }}>{standing.pointDifferential}</td>
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