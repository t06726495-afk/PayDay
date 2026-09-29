// All weekly content lives in ../../data/league.json — edit that file, not this one.
import league from "../../data/league.json";

export type Team = {
  rank: number;
  lastWeek: number;
  team: string;
  owner: string;
  abbr: string;
  color: string;
  record: string;
  pf: number;
  pa: number;
  streak: string;
  blurb: string;
  sound?: string;
};

export type Side = { team: string; score: number };
export type Matchup = { home: Side; away: Side };
export type Headline = { tag: string; title: string; detail: string };

export type League = {
  league: string;
  week: number;
  matchups: Matchup[];
  headlines: Headline[];
  teams: Team[];
};

export const data: League = league;

// Countdown order: last place first, #1 last.
export const countdown = [...data.teams].sort((a, b) => b.rank - a.rank);

export const teamByName = (name: string) =>
  data.teams.find((t) => t.team === name);

export const fmt = (n: number) => n.toFixed(2);

// Positive = moved up.
export const movement = (t: Team) => t.lastWeek - t.rank;
