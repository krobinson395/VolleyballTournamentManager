import { useEffect, useState } from 'react';
import {Link } from 'react-router-dom';
import type {Match, MatchSet, Team } from '../types';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import '../App.css';


type Player = {
  id: string;
  team_id: string;
  name: string;
  created_at: string;
};

type SetScore = {
  teamAScore: string;
  teamBScore: string;
};


type Standing = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
  setDifferential: number;
  pointDifferential: number;
};

function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const [matchTeamAId, setMatchTeamAId] = useState('');
  const [matchTeamBId, setMatchTeamBId] = useState('');
  const [setScores, setSetScores] = useState<SetScore[]>([
    { teamAScore: '', teamBScore: '' },
    { teamAScore: '', teamBScore: '' },
    { teamAScore: '', teamBScore: '' },
  ]);

  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editSetScores, setEditSetScores] = useState<SetScore[]>([]);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
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

    if (!selectedTeamId && data && data.length > 0) {
      setSelectedTeamId(data[0].id);
    }

    if (!matchTeamAId && data && data.length > 0) {
      setMatchTeamAId(data[0].id);
    }

    if (!matchTeamBId && data && data.length > 1) {
      setMatchTeamBId(data[1].id);
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

    const { error } = await supabase
      .from('teams')
      .insert({ name: trimmedName });

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

    fetchTeams();
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

function startEditingMatch(match: Match) {
  setEditingMatchId(match.id);

  setEditSetScores(
    match.match_sets.map((set) => ({
      teamAScore: String(set.team_a_score),
      teamBScore: String(set.team_b_score),
    }))
  );
}

function cancelEditingMatch() {
  setEditingMatchId(null);
  setEditSetScores([]);
}

function updateEditSetScore(
  setIndex: number,
  field: keyof SetScore,
  value: string
) {
  const nextScores = [...editSetScores];

  nextScores[setIndex] = {
    ...nextScores[setIndex],
    [field]: value,
  };

  setEditSetScores(nextScores);
}

async function saveEditedMatch(match: Match) {
  for (const set of editSetScores) {
    if (set.teamAScore === '' || set.teamBScore === '') {
      alert('Please enter all set scores.');
      return;
    }

    if (Number(set.teamAScore) === Number(set.teamBScore)) {
      alert('A set cannot end in a tie.');
      return;
    }
  }

  const winnerTeamId = calculateWinnerFromScores(
    match.team_a_id,
    match.team_b_id,
    editSetScores
  );

  if (!winnerTeamId) {
    alert('Match cannot end in a tie.');
    return;
  }

  const { error: matchError } = await supabase
    .from('matches')
    .update({
      winner_team_id: winnerTeamId,
    })
    .eq('id', match.id);

  if (matchError) {
    alert(matchError.message);
    return;
  }

  for (let i = 0; i < match.match_sets.length; i++) {
    const set = match.match_sets[i];
    const editedSet = editSetScores[i];

    const { error: setError } = await supabase
      .from('match_sets')
      .update({
        team_a_score: Number(editedSet.teamAScore),
        team_b_score: Number(editedSet.teamBScore),
      })
      .eq('id', set.id);

    if (setError) {
      alert(setError.message);
      return;
    }
  }

  setEditingMatchId(null);
  setEditSetScores([]);
  fetchMatches();
}

async function deleteMatch(matchId: string) {
  if (!window.confirm('Delete this match and all set scores?')) return;

  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId);

  if (error) {
    alert(error.message);
    return;
  }

  fetchMatches();
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

  function updateSetScore(
    setIndex: number,
    field: keyof SetScore,
    value: string
  ) {
    const nextScores = [...setScores];

    nextScores[setIndex] = {
      ...nextScores[setIndex],
      [field]: value,
    };

    setSetScores(nextScores);
  }

  function calculateWinner() {
    let teamASetWins = 0;
    let teamBSetWins = 0;

    for (const set of setScores) {
      const teamAScore = Number(set.teamAScore);
      const teamBScore = Number(set.teamBScore);

      if (teamAScore > teamBScore) {
        teamASetWins++;
      } else if (teamBScore > teamAScore) {
        teamBSetWins++;
      }
    }

    if (teamASetWins > teamBSetWins) return matchTeamAId;
    if (teamBSetWins > teamASetWins) return matchTeamBId;

    return null;
  }
  function getTeamName(teamId: string) {
  return teams.find((team) => team.id === teamId)?.name ?? 'Unknown Team';
}

function calculateWinnerFromScores(
  teamAId: string,
  teamBId: string,
  scores: SetScore[]
) {
  let teamASetWins = 0;
  let teamBSetWins = 0;

  for (const set of scores) {
    const teamAScore = Number(set.teamAScore);
    const teamBScore = Number(set.teamBScore);

    if (teamAScore > teamBScore) teamASetWins++;
    if (teamBScore > teamAScore) teamBSetWins++;
  }

  if (teamASetWins > teamBSetWins) return teamAId;
  if (teamBSetWins > teamASetWins) return teamBId;

  return null;
}

function calculateStandings(teams: Team[], matches: Match[]): Standing[] {
  const standingsMap = new Map<string, Standing>();

  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      setDifferential: 0,
      pointDifferential: 0,
    });
  }

  for (const match of matches) {
    const teamA = standingsMap.get(match.team_a_id);
    const teamB = standingsMap.get(match.team_b_id);

    if (!teamA || !teamB) continue;

    if (match.winner_team_id === match.team_a_id) {
      teamA.wins++;
      teamB.losses++;
    } else if (match.winner_team_id === match.team_b_id) {
      teamB.wins++;
      teamA.losses++;
    }

    for (const set of match.match_sets) {
      teamA.pointsFor += set.team_a_score;
      teamA.pointsAgainst += set.team_b_score;

      teamB.pointsFor += set.team_b_score;
      teamB.pointsAgainst += set.team_a_score;

      if (set.team_a_score > set.team_b_score) {
        teamA.setsWon++;
        teamB.setsLost++;
      } else {
        teamB.setsWon++;
        teamA.setsLost++;
      }
    }
  }

  const standings = Array.from(standingsMap.values()).map((standing) => ({
    ...standing,
    setDifferential: standing.setsWon - standing.setsLost,
    pointDifferential: standing.pointsFor - standing.pointsAgainst,
  }));

  return standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifferential !== a.setDifferential) {
      return b.setDifferential - a.setDifferential;
    }
    if (b.pointDifferential !== a.pointDifferential) {
      return b.pointDifferential - a.pointDifferential;
    }

    return a.teamName.localeCompare(b.teamName);
  });
}

  async function submitMatch() {
    if (!matchTeamAId || !matchTeamBId) {
      alert('Please select both teams.');
      return;
    }

    if (matchTeamAId === matchTeamBId) {
      alert('A team cannot play against itself.');
      return;
    }

    for (const set of setScores) {
      if (set.teamAScore === '' || set.teamBScore === '') {
        alert('Please enter all set scores.');
        return;
      }

      if (Number(set.teamAScore) === Number(set.teamBScore)) {
        alert('A set cannot end in a tie.');
        return;
      }
    }

    const winnerTeamId = calculateWinner();

    if (!winnerTeamId) {
      alert('Match cannot end in a tie.');
      return;
    }

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        team_a_id: matchTeamAId,
        team_b_id: matchTeamBId,
        winner_team_id: winnerTeamId,
      })
      .select()
      .single();

    if (matchError) {
      alert(matchError.message);
      return;
    }

    const matchSetsToInsert = setScores.map((set, index) => ({
      match_id: match.id,
      set_number: index + 1,
      team_a_score: Number(set.teamAScore),
      team_b_score: Number(set.teamBScore),
    }));

    const { error: setsError } = await supabase
      .from('match_sets')
      .insert(matchSetsToInsert);

    if (setsError) {
      alert(setsError.message);
      return;
    }

    alert('Match saved!');

    setSetScores([
      { teamAScore: '', teamBScore: '' },
      { teamAScore: '', teamBScore: '' },
      { teamAScore: '', teamBScore: '' },
    ]);
    fetchMatches();
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
  fetchMatches();
}, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchPlayers(selectedTeamId);
    }
  }, [selectedTeamId]);

  return (
    <main style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'Arial' }}>
    <Navbar />
      <h1>Volleyball League Admin</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2>Report Match</h2>

        {teams.length < 2 ? (
          <p>You need at least two teams before reporting a match.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select
                value={matchTeamAId}
                onChange={(event) => setMatchTeamAId(event.target.value)}
                style={{ flex: 1, padding: '8px' }}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>

              <strong>vs</strong>

              <select
                value={matchTeamBId}
                onChange={(event) => setMatchTeamBId(event.target.value)}
                style={{ flex: 1, padding: '8px' }}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {setScores.map((set, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 1fr',
                  gap: '8px',
                  marginBottom: '8px',
                  alignItems: 'center',
                }}
              >
                <strong>Set {index + 1}</strong>

                <input
                  type="number"
                  min="0"
                  value={set.teamAScore}
                  onChange={(event) =>
                    updateSetScore(index, 'teamAScore', event.target.value)
                  }
                  placeholder="Team A score"
                  style={{ padding: '8px' }}
                />

                <input
                  type="number"
                  min="0"
                  value={set.teamBScore}
                  onChange={(event) =>
                    updateSetScore(index, 'teamBScore', event.target.value)
                  }
                  placeholder="Team B score"
                  style={{ padding: '8px' }}
                />
              </div>
            ))}

            <button onClick={submitMatch} style={{ marginTop: '12px' }}>
              Save Match
            </button>
          </>
        )}
      </section>
        <section style={{ marginBottom: '40px' }}>
    <h2>Entered Matches</h2>

    {matches.length === 0 ? (
      <p>No matches entered yet.</p>
    ) : (
      matches.map((match) => {
        const isEditing = editingMatchId === match.id;

        return (
          <div
            key={match.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '12px',
            }}
          >
            <h3>
              {getTeamName(match.team_a_id)} vs {getTeamName(match.team_b_id)}
            </h3>

            <p>
              Winner: <strong>{getTeamName(match.winner_team_id)}</strong>
            </p>

            {isEditing ? (
              <>
                {editSetScores.map((set, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 1fr',
                      gap: '8px',
                      marginBottom: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <strong>Set {index + 1}</strong>

                    <input
                      type="number"
                      min="0"
                      value={set.teamAScore}
                      onChange={(event) =>
                        updateEditSetScore(
                          index,
                          'teamAScore',
                          event.target.value
                        )
                      }
                      style={{ padding: '8px' }}
                    />

                    <input
                      type="number"
                      min="0"
                      value={set.teamBScore}
                      onChange={(event) =>
                        updateEditSetScore(
                          index,
                          'teamBScore',
                          event.target.value
                        )
                      }
                      style={{ padding: '8px' }}
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveEditedMatch(match)}>Save</button>
                  <button onClick={cancelEditingMatch}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <ul>
                  {match.match_sets.map((set) => (
                    <li key={set.id}>
                      Set {set.set_number}: {set.team_a_score} -{' '}
                      {set.team_b_score}
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEditingMatch(match)}>Edit</button>
                  <button onClick={() => deleteMatch(match.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        );
      })
    )}
  </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Teams</h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Team name"
            style={{ flex: 1, padding: '8px' }}
          />

          <button onClick={addTeam}>Add Team</button>
        </div>

        {teams.map((team) => (
          <div
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
            <button
              onClick={() => setSelectedTeamId(team.id)}
              style={{ border: 'none', background: 'transparent' }}
            >
              {team.name}
            </button>

            <button onClick={() => deleteTeam(team.id)}>Delete</button>
          </div>
        ))}
      </section>

      <section>
        <h2>Players {selectedTeam ? `- ${selectedTeam.name}` : ''}</h2>

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

            {players.map((player) => (
              <div
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
              </div>
            ))}
          </>
        )}
      </section>
    </main>
  );
}

export default AdminPage;