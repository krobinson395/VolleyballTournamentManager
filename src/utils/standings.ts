import type { Match, Standing, Team } from '../types';

export function calculateStandings(teams: Team[], matches: Match[]): Standing[] {
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

  return Array.from(standingsMap.values())
    .map((standing) => ({
      ...standing,
      setDifferential: standing.setsWon - standing.setsLost,
      pointDifferential: standing.pointsFor - standing.pointsAgainst,
    }))
    .sort((a, b) => {
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