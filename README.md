# GVR Power Rankings

TV-broadcast-style animated videos for the GVR 12-team fantasy football league, built with [Remotion](https://www.remotion.dev).

**Default video (`PowerRankings`, about 24 seconds):**
1. **Intro**: "GVR Power Rankings, Week N"
2. **Final scores** for every matchup
3. **The board**: opens on last week's rankings, then every team slides into its new spot while total points count up. Each team gets a "+points this week" pill, a record update and a movement arrow.

A score ticker runs along the bottom.

There's also a long format (`PowerRankingsFull`, about 75 seconds) with a #12-to-#1 countdown and a blurb per team. It needs `blurb` and `headlines` filled in, so it's off by default.

## Updating it each week

You edit two files in [`data/`](data/):

1. **`previous.json`**: replace its contents with last week's `league.json`. This is the board the animation starts from.
2. **`league.json`**: bump `"week"`, replace the six `matchups` scores, then update each team's `rank`, `record`, `pf` (total points for), `pa` and `streak`.
3. Optional: copy `league.json` to `history/weekN.json` to keep a record.

The movement arrows and "+points this week" are worked out automatically by comparing the two files.

## Rendering the video

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd video
npm install        # first time only
npm run render     # writes video/out/power-rankings.mp4 (short format)
```

To preview and scrub through it in your browser: `npm run dev`.

For the long format: `npx remotion render PowerRankingsFull out/full.mp4`.

## Credits

- Sound effects: [Kenney](https://kenney.nl) (CC0 public domain)
- Fonts: Oswald and Barlow Condensed (SIL Open Font License)
- Remotion is free for individuals and teams of up to 3 people.
