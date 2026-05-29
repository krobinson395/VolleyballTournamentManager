import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import type { Match, Team } from '../types';

function MatchesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  function getTeamName(teamId: string) {
    return teams.find((team) => team.id === teamId)?.name ?? 'Unknown Team';
  }

  async function fetchTeams() {
    const { data, error } = await supabase.from('teams').select('*').order('name');

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
        <h2>Match History</h2>

        {matches.length === 0 ? (
          <p>No matches have been recorded yet.</p>
        ) : (
          matches.map((match) => (
            <article
              key={match.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {getTeamName(match.team_a_id)} vs {getTeamName(match.team_b_id)}
              </h3>

              <p>
                Winner: <strong>{getTeamName(match.winner_team_id)}</strong>
              </p>

              <ul>
                {match.match_sets.map((set) => (
                  <li key={set.id}>
                    Set {set.set_number}: {getTeamName(match.team_a_id)}{' '}
                    {set.team_a_score} - {set.team_b_score}{' '}
                    {getTeamName(match.team_b_id)}
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default MatchesPage;