// Weekly content lives in ../../data/league.json (this week) and
// ../../data/previous.json (last week's board). Edit those, not this file.
import league from "../../data/league.json";
import previous from "../../data/previous.json";

export type Team = {
  rank: number;
  team: string;
  owner: string;
  abbr: string;
  color: string;
  record: string;
  pf: number;
  pa: number;
  streak: string;
  blurb?: string;
  sound?: string;
};

export type PrevTeam = Pick<Team, "rank" | "team" | "record" | "pf" | "pa" | "streak">;
export type Side = { team: string; score: number };
export type Matchup = { home: Side; away: Side };
export type Headline = { tag: string; title: string; detail: string };

export type League = {
  league: string;
  week: number;
  matchups: Matchup[];
  headlines?: Headline[];
  teams: Team[];
};

export const data: League = league;
export const prev: { week: number; teams: PrevTeam[] } = previous;

// Countdown order: last place first, #1 last.
export const countdown = [...data.teams].sort((a, b) => b.rank - a.rank);

export const teamByName = (name: string) => data.teams.find((t) => t.team === name);

export const prevOf = (t: Team): PrevTeam => prev.teams.find((p) => p.team === t.team) ?? t;

export const fmt = (n: number) => n.toFixed(2);

// Positive = moved up since last week.
export const movement = (t: Team) => prevOf(t).rank - t.rank;
