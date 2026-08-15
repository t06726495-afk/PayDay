# Compound growth explainer

A 42-second flat-diagram animation showing what $20 a month does over 30 years
when it sits in a jar versus when it's invested — plus a matching voiceover
script for ElevenLabs.

Rendered with **matplotlib** (not manim). For this style — flat shapes, exact
type placement, an axis that re-scales under the curve — matplotlib gives
frame-accurate control with no scene-graph fighting, and every position in the
file is a number you can nudge. Manim's strengths (LaTeX, 3D, mobject
transforms) aren't in play here.

```bash
pip install matplotlib imageio-ffmpeg

python3 render_video.py                 # 1920x1080 -> out/compound_growth_16x9.mp4
python3 render_video.py --aspect 9:16   # 1080x1920 -> out/compound_growth_9x16.mp4
```

Roughly 80 s to render per aspect. No system ffmpeg needed — `imageio-ffmpeg`
ships its own binary and the script points matplotlib at it.

## Previewing while you tweak

```bash
python3 render_video.py --stills 1.8 7.5 13 22 30 36.8 41   # PNGs, no encode
python3 render_video.py --scale 0.5                          # half-res draft
```

`--stills` is the fast loop: it renders single frames at the times you name,
straight to `out/`, in about a second each.

## The 42 seconds

| Time | Scene | What happens |
| --- | --- | --- |
| 0.0 – 3.6 | Hook | Coins and a bill drop in. "Put $20 a month **here instead**." |
| 3.6 – 11.0 | Setup | $20/month forks two ways: a jar that fills flat, bars that climb. |
| 11.0 – 31.0 | Time-lapse | The chart sweeps year by year. Markers land on years 1, 5, 10, 20, 30. |
| 31.0 – 39.4 | Payoff | Both endpoints labelled, and the gap between the lines called out. |
| 39.4 – 42.0 | End card | "$20 a month. Time does the heavy lifting." No CTA — that's yours to add. |

The time-lapse is the piece worth understanding. It doesn't scroll at a
constant rate: it **sweeps to a year, holds, then zooms the camera out** while
the next sweep begins. Year 1 is drawn on a $300 axis, year 30 on a $26,000
axis. That's what sells the acceleration — the curve keeps filling the frame,
so the only way to read "faster" is off the axis numbers changing underneath
it. Two knobs control it:

```python
LAPSE_STEPS = [(1, 1.4, 0.9), (5, 2.6, 0.9), ...]   # (year, sweep secs, hold secs)
VIEWS = [(1.5, 300, [...], [...]), ...]              # (x max, y max, x ticks, y ticks)
CAMERA_LEAD = 0.45   # how far the zoom-out bleeds into the next sweep
```

One entry in each, per beat. The scene runs exactly `sum(sweep + hold)` seconds,
so if you change them, move `LAPSE_OUT` / `PAYOFF_IN` to match.

## The numbers

$20/month, contributed at the end of each month, compounded monthly at a
**hypothetical 7% average annual rate**, for 30 years.

| | Year 1 | Year 5 | Year 10 | Year 20 | Year 30 |
| --- | --- | --- | --- | --- | --- |
| In a jar | $240 | $1,200 | $2,400 | $4,800 | $7,200 |
| Invested | $250 | $1,430 | $3,460 | $10,420 | $24,400 |

Every figure on screen is rounded to the nearest $10 by `money()`, so nothing
implies precision the illustration doesn't have. The jar line is just the
running total of contributions, which is also exactly what you paid in — that's
why the payoff can say $17,000 of the $24,400 is growth.

Rate and contribution live at the top of the file:

```python
MONTHLY = 20.0
RATE = 0.07
YEARS = 30
```

Changing `RATE` or `MONTHLY` updates the curve and every label automatically,
but **`VIEWS` is hand-tuned to these numbers** — if you change them
substantially, re-pick the five y-maxima so each sweep still ends with the
curve near the top of the frame.

### On not making promises

7% is presented as an assumption, never a forecast. On screen for the whole
chart section:

> HYPOTHETICAL 7% AVERAGE ANNUAL GROWTH RATE, COMPOUNDED MONTHLY
> Figures are rounded illustrations — not a prediction, promise or guarantee of any return.

and again on the end card. The narration is written the same way (see
`voiceover.txt`). Real returns are not smooth, are not guaranteed, and this is
an educational illustration of how compounding works — it is not investment
advice. If it's going anywhere public, get it past whoever needs to see it.

## Palette

"Clay & Deep Teal on Warm Paper" — deliberately not finance-blue.

| | Hex | Role |
| --- | --- | --- |
| Paper | `#F4EFE6` | background, and the fade colour between scenes |
| Clay | `#DD5B3E` | invested — the hero line, the markers, the growth |
| Deep teal | `#1F6F6B` | in a jar — the flat control |
| Ink | `#22201D` | headlines |
| Soft | `#8A8177` | axis labels, fine print |

Two accents doing one job each, warm neutral behind them. Swap the hexes at the
top of the file and the whole piece re-skins.

Type is DejaVu Sans (matplotlib's built-in), mono for every number so digits
don't jitter as counters run. It's clean but generic — dropping in a real
display face is the single biggest visual upgrade available. Put a `.ttf`
somewhere, `matplotlib.font_manager.fontManager.addfont(path)`, and change the
`fontname` in `T()`.

## How the file is organised

One `render_video.py`, top to bottom: config, the money maths, easing helpers,
layout, drawing primitives, one `draw_*` function per scene, then frame
assembly. Everything is drawn on a single full-bleed axes measured in "units"
where 1 unit = 10 px, so 16:9 is a 192 × 108 grid and 9:16 is 108 × 192. Font
sizes stay in points and get multiplied by `L["fs"]` for the vertical cut.

Scenes are pure functions of `t`. `draw_frame(ax, L, t)` clears the axes and
redraws from scratch, which is why any time can be rendered on its own — that's
what makes `--stills` cheap and what makes the whole thing easy to re-time.

The layout dict `L` holds every per-aspect number in one place: the chart rect,
the header columns, and the scene anchors (`hook_head`, `setup_base`, `cs`,
`card_mark`, …) as fractions of frame height. Re-composing a scene for one
aspect means editing `layout_for`, not the drawing code.

## Known rough edges

- **The vertical cut still has dead space** below the setup scene. It has its
  own anchors (`hook_money`, `setup_src`, `setup_base`, `cs`, `card_mark` in
  `layout_for`) and its own type scale, so the fix is moving those numbers —
  but the composition hasn't been designed against a real 9:16 feed yet.
- **Type is DejaVu Sans**, per above.
- **The setup scene's climbing bars are illustrative shape only** — deliberately
  unlabelled, because over ten months compounding is invisible and drawing it
  to scale would say nothing.
- **No audio track.** Render the ElevenLabs read and mux it:
  `ffmpeg -i out/compound_growth_16x9.mp4 -i vo.mp3 -c:v copy -shortest final.mp4`
