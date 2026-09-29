# Family League Power Rankings

A TV-broadcast-style animated video for our 12-team fantasy football league, built with [Remotion](https://www.remotion.dev). Each week it shows:

1. **Intro**: "Power Rankings, Week N"
2. **Final scores** for every matchup
3. **Headlines**: upsets, high score, nail-biters
4. **The countdown**, #12 up to #1. Each team gets movement arrows, record, points for and against, streak, and a funny blurb.
5. **The full board**: all 12 teams at once

A score ticker runs along the bottom the whole time.

## Updating it each week

Everything lives in **one file: [`data/league.json`](data/league.json)**.

1. Copy the current file to `data/history/weekN.json` so you keep a record.
2. In `data/league.json`:
   - Bump `"week"`.
   - Replace the `matchups` scores.
   - Rewrite the `headlines` (up to 4 cards: `tag`, `title`, `detail`).
   - For each team, set `lastWeek` to its old `rank`, then fill in the new `rank`, `record`, `pf` (points for), `pa` (points against), `streak` and `blurb`.
   - Optional: `"sound"` plays a voice clip on that team's reveal. Choices: `vo-congratulations`, `vo-new_highscore`, `vo-level_up`, `vo-mission_failed`, `vo-game_over`.
3. Render (below).

The movement arrows come from `lastWeek - rank`, so they update on their own.

## Rendering the video

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd video
npm install        # first time only
npm run render     # writes video/out/power-rankings.mp4
```

To preview and scrub through it in your browser: `npm run dev`.

The video is 1920×1080 at 30fps and about 75 seconds long. The length adjusts on its own if you change the number of teams.

## Credits

- Sound effects: [Kenney](https://kenney.nl) (CC0 public domain)
- Fonts: Oswald and Barlow Condensed (SIL Open Font License)
- Remotion is free for individuals and teams of up to 3 people.
