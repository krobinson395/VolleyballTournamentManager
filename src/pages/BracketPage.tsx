import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import type { BracketMatch, Match, Team } from '../types';
import { generateSingleEliminationBracket } from '../utils/bracket';
import { calculateStandings } from '../utils/standings';

function BracketPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bracket, setBracket] = useState<BracketMatch[]>([]);

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

  function handleGenerateBracket() {
    setBracket(generateSingleEliminationBracket(standings));
  }

  function getRoundTitle(round: number, totalRounds: number) {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinal';
    return `Round ${round}`;
  }

  useEffect(() => {
    fetchTeams();
    fetchMatches();
  }, []);

  const rounds = [...new Set(bracket.map((match) => match.round))];

  return (
    <main style={{ maxWidth: '1100px', margin: '40px auto', fontFamily: 'Arial' }}>
      <Navbar />

      <section>
        <h2>Tournament Bracket</h2>

        <p>
          Generate a single-elimination bracket based on the current standings.
        </p>

        <button onClick={handleGenerateBracket} disabled={standings.length < 2}>
          Generate Bracket
        </button>

        {standings.length < 2 && (
          <p>You need at least two teams to generate a bracket.</p>
        )}

        {bracket.length > 0 && (
          <div
            style={{
              marginTop: '32px',
              overflowX: 'auto',
              padding: '24px',
              border: '1px solid #eee',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '96px',
                alignItems: 'center',
                minWidth: 'max-content',
              }}
            >
              {rounds.map((round) => {
                const roundMatches = bracket.filter(
                  (match) => match.round === round
                );

                return (
                  <section
                    key={round}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: `${Math.pow(2, round - 1) * 32}px`,
                      minWidth: '220px',
                    }}
                  >
                    <h3 style={{ textAlign: 'center', marginTop: 0 }}>
                      {getRoundTitle(round, rounds.length)}
                    </h3>

                    {roundMatches.map((match) => (
                      <div
                        key={`${match.round}-${match.matchNumber}`}
                        style={{
                          border: '1px solid #d7d7d7',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          minWidth: '220px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: '#f5f5f5',
                            padding: '8px',
                            borderBottom: '1px solid #ddd',
                            fontWeight: 'bold',
                          }}
                        >
                          Match {match.matchNumber}
                        </div>

                        <div
                          style={{
                            padding: '10px',
                            borderBottom: '1px solid #eee',
                            color:
                              match.teamAName === 'BYE' ? '#999' : 'inherit',
                            fontStyle:
                              match.teamAName === 'BYE' ? 'italic' : 'normal',
                          }}
                        >
                          {match.teamAName}
                        </div>

                        <div
                          style={{
                            padding: '10px',
                            color:
                              match.teamBName === 'BYE' ? '#999' : 'inherit',
                            fontStyle:
                              match.teamBName === 'BYE' ? 'italic' : 'normal',
                          }}
                        >
                          {match.teamBName}
                        </div>
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default BracketPage;