import type { BracketMatch, Standing } from '../types';

function nextPowerOfTwo(value: number) {
  return Math.pow(2, Math.ceil(Math.log2(value)));
}

export function generateSingleEliminationBracket(
  standings: Standing[]
): BracketMatch[] {
  const teamCount = standings.length;

  if (teamCount < 2) return [];

  const bracketSize = nextPowerOfTwo(teamCount);
  const firstRoundMatches = bracketSize / 2;
  const bracket: BracketMatch[] = [];

  for (let i = 0; i < firstRoundMatches; i++) {
    const highSeed = standings[i];
    const lowSeed = standings[bracketSize - 1 - i];

    bracket.push({
      round: 1,
      matchNumber: i + 1,
      teamAName: highSeed?.teamName ?? 'BYE',
      teamBName: lowSeed?.teamName ?? 'BYE',
    });
  }

  let round = 2;
  let matchesInRound = firstRoundMatches / 2;

  while (matchesInRound >= 1) {
    for (let i = 0; i < matchesInRound; i++) {
      bracket.push({
        round,
        matchNumber: i + 1,
        teamAName: `Winner R${round - 1}M${i * 2 + 1}`,
        teamBName: `Winner R${round - 1}M${i * 2 + 2}`,
      });
    }

    round++;
    matchesInRound = matchesInRound / 2;
  }

  return bracket;
}