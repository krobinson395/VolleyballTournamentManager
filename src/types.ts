export type Team = {
  id: string;
  name: string;
  created_at: string;
};

export type MatchSet = {
  id: string;
  match_id: string;
  set_number: number;
  team_a_score: number;
  team_b_score: number;
};

export type Match = {
  id: string;
  team_a_id: string;
  team_b_id: string;
  winner_team_id: string;
  played_at: string;
  match_sets: MatchSet[];
};

export type Standing = {
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

export type BracketMatch = {
  round: number;
  matchNumber: number;
  teamAName: string;
  teamBName: string;
};