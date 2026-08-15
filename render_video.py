#!/usr/bin/env python3
"""
Compound growth explainer — flat-diagram animation, rendered with matplotlib.

    python3 render_video.py                  # 16:9 MP4 -> out/compound_growth_16x9.mp4
    python3 render_video.py --aspect 9:16    # vertical
    python3 render_video.py --stills 1 6 14 26 34 41   # PNG stills, no encode
    python3 render_video.py --scale 0.5      # half-res draft (fast)

Everything you'll want to tune while refining lives in the CONFIG block below:
money, rate, palette, scene boundaries, and the year-by-year beat timings.

Coordinate system: one full-bleed axes measured in "units", where 1 unit = 10px.
16:9 is 192x108 units, 9:16 is 108x192. Font sizes are points; at dpi=100,
1pt = 1.389px, so a 46pt number is ~64px tall on a 1080p frame.
"""

from __future__ import annotations

import argparse
import math
import os

import numpy as np

import matplotlib

matplotlib.use("Agg")

import imageio_ffmpeg

matplotlib.rcParams["animation.ffmpeg_path"] = imageio_ffmpeg.get_ffmpeg_exe()

import matplotlib.pyplot as plt
from matplotlib.animation import FFMpegWriter
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

MONTHLY = 20.0      # dollars contributed per month
RATE = 0.07         # hypothetical average annual growth, compounded monthly
YEARS = 30          # length of the illustration
FPS = 30

RATE_LINE = "HYPOTHETICAL 7% AVERAGE ANNUAL GROWTH RATE, COMPOUNDED MONTHLY"
RATE_LINE_SHORT = "HYPOTHETICAL 7% AVERAGE ANNUAL GROWTH"
FINE_PRINT = ("Figures are rounded illustrations — not a prediction, promise or "
              "guarantee of any return.")

# --- palette: "Clay & Deep Teal on Warm Paper" -----------------------------
PAPER = "#F4EFE6"   # background
INK = "#22201D"     # primary type
SOFT = "#8A8177"    # secondary type, disclaimers
RULE = "#DFD6C6"    # gridlines, hairlines
CLAY = "#DD5B3E"    # the hero: money that is invested
CLAY_FILL = "#F3C9BC"
TEAL = "#1F6F6B"    # the control: money in a jar
TEAL_FILL = "#C9DEDB"

# --- scene boundaries, in seconds ------------------------------------------
HOOK_IN, HOOK_OUT = 0.0, 3.6
SETUP_IN, SETUP_OUT = 3.6, 11.0
LAPSE_IN, LAPSE_OUT = 11.0, 31.0
PAYOFF_IN, PAYOFF_OUT = 31.0, 39.4
CARD_IN, CARD_OUT = 39.4, 42.0
DURATION = CARD_OUT

# Cross-fades through paper. Lapse -> payoff is deliberately absent: the chart
# stays on screen and the annotations simply arrive.
FADES = [(HOOK_OUT, 0.22), (SETUP_OUT, 0.22), (CARD_IN, 0.22)]

# Time-lapse beats: (target year, seconds to sweep there, seconds to hold).
# The holds are where a year marker lands and the camera zooms out.
LAPSE_STEPS = [
    (1, 1.4, 0.9),
    (5, 2.6, 0.9),
    (10, 3.0, 1.0),
    (20, 4.0, 1.0),
    (30, 4.2, 1.0),
]
# Camera per sweep: (x max in years, y max in dollars, x ticks, y ticks)
VIEWS = [
    (1.5, 300, [0, 1], [0, 100, 200, 300]),
    (6, 1600, [0, 1, 2, 3, 4, 5], [0, 500, 1000, 1500]),
    (12, 4000, [0, 2, 4, 6, 8, 10], [0, 1000, 2000, 3000, 4000]),
    (22, 12000, [0, 5, 10, 15, 20], [0, 3000, 6000, 9000, 12000]),
    (31, 26000, [0, 5, 10, 15, 20, 25, 30], [0, 5000, 10000, 15000, 20000, 25000]),
]

ASPECTS = {
    "16:9": dict(px=(1920, 1080), units=(192.0, 108.0)),
    "9:16": dict(px=(1080, 1920), units=(108.0, 192.0)),
}

# ---------------------------------------------------------------------------
# money
# ---------------------------------------------------------------------------

MONTHS = np.arange(0, YEARS * 12 + 1)
YEAR_AXIS = MONTHS / 12.0
_r = RATE / 12.0
INVESTED = MONTHLY * ((1.0 + _r) ** MONTHS - 1.0) / _r   # end-of-month contributions
JAR = MONTHLY * MONTHS                                   # same cash, no growth


def invested_at(year: float) -> float:
    return float(np.interp(year, YEAR_AXIS, INVESTED))


def jar_at(year: float) -> float:
    return MONTHLY * 12.0 * year


def money(v: float, step: int = 10) -> str:
    """Round hard so nothing on screen implies false precision."""
    return f"${round(v / step) * step:,.0f}"


GROWTH_ONLY = invested_at(YEARS) - jar_at(YEARS)


# ---------------------------------------------------------------------------
# easing / timing
# ---------------------------------------------------------------------------

def clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def seg(t: float, a: float, b: float) -> float:
    """Linear progress of t through the window [a, b], clamped to 0..1."""
    return clamp01((t - a) / (b - a)) if b > a else (1.0 if t >= b else 0.0)


def ease_out(x: float) -> float:
    return 1.0 - (1.0 - clamp01(x)) ** 3


def ease_in_out(x: float) -> float:
    x = clamp01(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_back(x: float) -> float:
    """Overshoot slightly, for things that pop into place."""
    x = clamp01(x)
    c1, c3 = 1.20, 2.20
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def rise(t: float, a: float, b: float):
    """Common entrance: (alpha, y-offset in units) for a fade-and-lift."""
    p = ease_out(seg(t, a, b))
    return p, (1.0 - p) * 2.4


# ---------------------------------------------------------------------------
# layout
# ---------------------------------------------------------------------------

def layout_for(aspect: str) -> dict:
    W, H = ASPECTS[aspect]["units"]
    L = dict(aspect=aspect, W=W, H=H, cx=W / 2.0, vert=(aspect == "9:16"))
    if aspect == "16:9":
        L.update(
            fs=1.0,
            chart=(24.0, 28.0, 156.0, 80.0),      # x0, y0, x1, y1
            callout_x=160.0,
            xtick_y=24.4, xlabel_y=20.5, disc_y=10.0,
            head_eyebrow_y=101.0, head_num_y=87.0,
            col_invested=24.0, col_jar=76.0, col_year=156.0,
            chip_y=104.0,
            num_size=46, eyebrow_size=16,
        )
    else:
        L.update(
            fs=0.66,
            chart=(19.0, 62.0, 88.0, 140.0),
            callout_x=90.5,
            xtick_y=58.0, xlabel_y=52.5, disc_y=40.0,
            head_eyebrow_y=157.0, head_num_y=146.0,
            col_invested=19.0, col_jar=88.0, col_year=None,
            chip_y=176.0,
            num_size=32, eyebrow_size=13,
        )
    return L


class Chart:
    """Maps (year, dollars) into unit coordinates for the current camera."""

    def __init__(self, L, xmax, ymax):
        self.x0, self.y0, self.x1, self.y1 = L["chart"]
        self.xmax, self.ymax = xmax, ymax

    def px(self, year):
        return self.x0 + (self.x1 - self.x0) * (year / self.xmax)

    def py(self, dollars):
        return self.y0 + (self.y1 - self.y0) * (dollars / self.ymax)


# ---------------------------------------------------------------------------
# drawing helpers
# ---------------------------------------------------------------------------

def T(ax, x, y, s, size=16, color=INK, ha="left", va="baseline",
      alpha=1.0, weight="bold", mono=False, z=20, linespacing=1.25):
    if alpha <= 0.004:
        return
    ax.text(x, y, s, fontsize=size, color=color, ha=ha, va=va, alpha=min(alpha, 1.0),
            fontweight=weight, zorder=z, linespacing=linespacing,
            fontname="DejaVu Sans Mono" if mono else "DejaVu Sans")


def spaced(s: str, gap: str = "  ") -> str:
    """Fake letter-spacing for small caps labels."""
    return gap.join(s)


def chip(ax, x, y, label, size=14, fg=PAPER, bg=INK, alpha=1.0, ha="center",
         z=20, pad=0.55, mono=False):
    """A pill label. The box is sized by matplotlib from the text itself."""
    if alpha <= 0.004:
        return
    a = min(alpha, 1.0)
    box = None if bg is None else dict(
        boxstyle=f"round,pad={pad},rounding_size=0.85", fc=bg, ec="none", alpha=a)
    ax.text(x, y, label, fontsize=size, color=fg, ha=ha, va="center", alpha=a,
            fontweight="bold", zorder=z, bbox=box, multialignment="center",
            linespacing=1.2, fontname="DejaVu Sans Mono" if mono else "DejaVu Sans")


def coin(ax, x, y, r, alpha=1.0, color=CLAY, face=None, z=15, label="$"):
    if alpha <= 0.004:
        return
    ax.add_patch(Circle((x, y), r, fc=face if face else color, ec=color, lw=2.2,
                        alpha=min(alpha, 1.0), zorder=z))
    if label:
        T(ax, x, y - r * 0.04, label, size=r * 7.6, color=PAPER if not face else color,
          ha="center", va="center", alpha=alpha, z=z + 1)


def bill(ax, x, y, w, h, alpha=1.0, color=TEAL, z=15):
    if alpha <= 0.004:
        return
    a = min(alpha, 1.0)
    ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h,
                                boxstyle="round,pad=0,rounding_size=0.8",
                                fc="none", ec=color, lw=2.4, alpha=a, zorder=z))
    ax.add_patch(Circle((x, y), h * 0.26, fc="none", ec=color, lw=2.0, alpha=a, zorder=z))


def bezier(p0, p1, p2, t):
    t = clamp01(t)
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


def head(ax, x, y, angle, size, color, alpha, z=16):
    """Filled triangular arrowhead pointing along `angle`."""
    if alpha <= 0.004:
        return
    pts = [(x, y)]
    for s in (-0.40, 0.40):
        pts.append((x - size * math.cos(angle + s), y - size * math.sin(angle + s)))
    ax.add_patch(Polygon(pts, closed=True, fc=color, ec="none",
                         alpha=min(alpha, 1.0), zorder=z))


def curve_arrow(ax, p0, p1, p2, alpha=1.0, color=SOFT, lw=2.0, size=1.8, z=8, progress=1.0):
    if alpha <= 0.004 or progress <= 0.01:
        return
    ts = np.linspace(0, progress, 48)
    pts = np.array([bezier(p0, p1, p2, t) for t in ts])
    ax.plot(pts[:, 0], pts[:, 1], color=color, lw=lw, alpha=min(alpha, 1.0), zorder=z,
            solid_capstyle="round")
    if progress > 0.95:
        a, b = pts[-3], pts[-1]
        head(ax, b[0], b[1], math.atan2(b[1] - a[1], b[0] - a[0]), size, color, alpha, z + 1)


# ---------------------------------------------------------------------------
# scene 1 — hook (0 - 3.6s)
# ---------------------------------------------------------------------------

def draw_hook(ax, L, t):
    fs, cx, H = L["fs"], L["cx"], L["H"]
    money_y = H * 0.40

    # cash from allowance / yard work / summer job, dropping in
    items = [(-26, 0.00, "coin"), (-9, 0.10, "bill"), (8, 0.20, "coin"), (25, 0.30, "coin")]
    for dx, delay, kind in items:
        p = ease_back(seg(t, 0.15 + delay, 0.95 + delay))
        a = ease_out(seg(t, 0.15 + delay, 0.75 + delay))
        if p <= 0.001:
            continue
        x = cx + dx * fs
        y = money_y + (1 - p) * 9
        if kind == "coin":
            coin(ax, x, y, 5.6 * fs, alpha=a, color=CLAY, face=PAPER)
        else:
            bill(ax, x, y, 18 * fs, 10 * fs, alpha=a, color=TEAL)

    a, dy = rise(t, 0.9, 1.7)
    T(ax, cx, money_y - 13 * fs - dy, spaced("ALLOWANCE  ·  YARD WORK  ·  SUMMER JOB"),
      size=17 * fs, color=SOFT, ha="center", va="center", alpha=a * 0.95)

    head_y = H * 0.70
    a1, d1 = rise(t, 1.35, 2.15)
    a2, d2 = rise(t, 1.60, 2.40)
    T(ax, cx, head_y + d1, "Put $20 a month", size=76 * fs, color=INK,
      ha="center", va="center", alpha=a1)
    T(ax, cx, head_y - 11.5 * fs - d2, "here instead", size=76 * fs, color=CLAY,
      ha="center", va="center", alpha=a2)


# ---------------------------------------------------------------------------
# scene 2 — setup (3.6 - 11.0s)
# ---------------------------------------------------------------------------

SETUP_FIRST_COIN = 4.9
SETUP_GAP = 0.5
SETUP_PAIRS = 10
SETUP_FLIGHT = 0.85


def draw_setup(ax, L, t):
    fs, cx, W, H = L["fs"], L["cx"], L["W"], L["H"]

    src_y = H * 0.86
    base = H * 0.28
    ch_ = 34 * fs                       # container height
    half = W * 0.25
    lx, rx = cx - half, cx + half
    mouth = base + ch_ + 4 * fs

    a_l, dl = rise(t, 3.75, 4.5)
    a_r, dr = rise(t, 3.95, 4.7)

    # -- source chip
    a_s, ds = rise(t, 4.45, 5.05)
    chip(ax, cx, src_y + 3.0 * fs + ds, "  $20 EVERY MONTH  ", size=20 * fs,
         fg=PAPER, bg=INK, alpha=a_s, ha="center", z=22)

    arrived = sum(1 for i in range(SETUP_PAIRS)
                  if t >= SETUP_FIRST_COIN + i * SETUP_GAP + SETUP_FLIGHT)
    fill = arrived / SETUP_PAIRS

    # -- left: a jar that just fills up
    jw = 32 * fs
    jar_box = FancyBboxPatch((lx - jw / 2, base), jw, ch_,
                             boxstyle="round,pad=0,rounding_size=3.4",
                             fc="none", ec=TEAL, lw=3.0, alpha=a_l, zorder=10)
    ax.add_patch(jar_box)
    ax.add_patch(FancyBboxPatch((lx - jw * 0.36, base + ch_), jw * 0.72, 3.2 * fs,
                                boxstyle="round,pad=0,rounding_size=1.4",
                                fc="none", ec=TEAL, lw=3.0, alpha=a_l, zorder=10))
    level = ch_ * 0.86 * fill
    if level > 0.4:
        liquid = Rectangle((lx - jw / 2, base), jw, level, fc=TEAL_FILL, ec="none",
                           alpha=a_l, zorder=9)
        ax.add_patch(liquid)
        liquid.set_clip_path(jar_box)
        ax.plot([lx - jw / 2 + 1.2, lx + jw / 2 - 1.2], [base + level, base + level],
                color=TEAL, lw=2.4, alpha=a_l, zorder=11, solid_capstyle="round")

    # -- right: bars that keep climbing (illustrative shape, deliberately unlabelled)
    n = SETUP_PAIRS
    cluster = 34 * fs
    bw = cluster / n
    for i in range(n):
        grown = clamp01((t - (SETUP_FIRST_COIN + i * SETUP_GAP + SETUP_FLIGHT)) / 0.45)
        if grown <= 0.001:
            continue
        shape = ((i + 1) / n) ** 2.1
        h = ch_ * 1.14 * (0.09 + 0.91 * shape) * ease_out(grown)
        x = rx - cluster / 2 + i * bw
        ax.add_patch(FancyBboxPatch((x + bw * 0.13, base), bw * 0.74, max(h, 0.4),
                                    boxstyle="round,pad=0,rounding_size=0.55",
                                    fc=CLAY if i >= n - 3 else CLAY_FILL,
                                    ec=CLAY, lw=1.6, alpha=a_r, zorder=10))

    for x, c, a in ((lx, TEAL, a_l), (rx, CLAY, a_r)):
        ax.plot([x - 22 * fs, x + 22 * fs], [base, base], color=c, lw=2.8, alpha=a,
                zorder=12, solid_capstyle="round")

    # -- labels below each container
    T(ax, lx, base - 7.5 * fs - dl, spaced("IN A JAR"), size=21 * fs, color=TEAL,
      ha="center", va="center", alpha=a_l)
    T(ax, rx, base - 7.5 * fs - dr, spaced("INVESTED"), size=21 * fs, color=CLAY,
      ha="center", va="center", alpha=a_r)

    # -- the split, and the coins travelling down it
    p0 = (cx, src_y - 5.0 * fs)
    for side, tx in ((-1, lx), (1, rx)):
        ctrl = (cx + side * half * 0.10, mouth + 6 * fs)
        curve_arrow(ax, p0, ctrl, (tx, mouth), alpha=ease_out(seg(t, 4.6, 5.4)) * 0.55,
                    color=SOFT, lw=2.0, size=2.0 * fs)

    for i in range(SETUP_PAIRS):
        t0 = SETUP_FIRST_COIN + i * SETUP_GAP
        p = seg(t, t0, t0 + SETUP_FLIGHT)
        if p <= 0.0 or p >= 1.0:
            continue
        pe = ease_in_out(p)
        fade = 1.0 - clamp01((p - 0.74) / 0.26)
        for side, tx, col in ((-1, lx, TEAL), (1, rx, CLAY)):
            ctrl = (cx + side * half * 0.10, mouth + 6 * fs)
            x, y = bezier(p0, ctrl, (tx, base + ch_ * 0.92), pe)
            coin(ax, x, y, 3.4 * fs, alpha=fade, color=col, face=PAPER, z=16)

    a, dy = rise(t, 9.9, 10.6)
    T(ax, cx, base - 18 * fs + dy, "Same $20. Two very different places to put it.",
      size=27 * fs, color=INK, ha="center", va="center", alpha=a)


# ---------------------------------------------------------------------------
# scene 3 — the time-lapse chart (11.0 - 31.0s)
# ---------------------------------------------------------------------------

CAMERA_LEAD = 0.45   # fraction of the next sweep the zoom-out keeps easing through


def lapse_state(local_t: float) -> dict:
    """Where the sweep is: current year, camera, and which markers have landed.

    The camera starts easing out when a year marker lands and keeps easing into
    the first `CAMERA_LEAD` of the following sweep, so the zoom feels continuous
    rather than stepped and the curve never sits in an empty frame for long.
    """
    n = len(LAPSE_STEPS)
    cur = 0.0
    for i, (ty, sweep, hold) in enumerate(LAPSE_STEPS):
        prev = LAPSE_STEPS[i - 1][0] if i else 0.0
        if local_t < cur + sweep:
            into = local_t - cur
            year = prev + (ty - prev) * ease_in_out(into / sweep)
            if i == 0:
                base, blend = 0, 0.0
            else:
                prev_hold = LAPSE_STEPS[i - 1][2]
                span = prev_hold + CAMERA_LEAD * sweep
                base, blend = i - 1, ease_in_out(clamp01((prev_hold + into) / span))
            return dict(year=year, base=base, blend=blend, reached=i, marker_age=99.0)
        cur += sweep
        if local_t < cur + hold:
            into = local_t - cur
            if i < n - 1:
                span = hold + CAMERA_LEAD * LAPSE_STEPS[i + 1][1]
                blend = ease_in_out(clamp01(into / span))
            else:
                blend = 0.0
            return dict(year=float(ty), base=i, blend=blend,
                        reached=i + 1, marker_age=into)
        cur += hold
    return dict(year=float(LAPSE_STEPS[-1][0]), base=n - 1, blend=0.0,
                reached=n, marker_age=99.0)


def camera(st: dict):
    """Interpolate the camera between the current view and the next one."""
    i, b = st["base"], st["blend"]
    j = min(i + 1, len(VIEWS) - 1)
    xa, ya, xta, yta = VIEWS[i]
    xb, yb, xtb, ytb = VIEWS[j]
    if b <= 0:
        return xa, ya, [(xta, 1.0)], [(yta, 1.0)]
    out, inn = 1.0 - clamp01(b / 0.35), clamp01((b - 0.55) / 0.45)
    return (xa + (xb - xa) * b, ya + (yb - ya) * b,
            [(xta, out), (xtb, inn)], [(yta, out), (ytb, inn)])


def draw_chart(ax, L, ch, xticks, yticks, year, alpha=1.0, dim=0.0):
    """Grid, axes, both series. Shared by the time-lapse and the payoff."""
    fs = L["fs"]
    g = alpha * (1.0 - dim * 0.62)

    for tset, ta in yticks:
        for v in tset:
            if v > ch.ymax * 1.02:
                continue
            y = ch.py(v)
            ax.plot([ch.x0, ch.x1], [y, y], color=RULE, lw=1.6, alpha=g * ta,
                    zorder=2, solid_capstyle="butt")
            T(ax, ch.x0 - 2.6, y, money(v, 1), size=17 * fs, color=SOFT,
              ha="right", va="center", alpha=g * ta, mono=True, z=6)

    for tset, ta in xticks:
        for v in tset:
            if v > ch.xmax * 1.02:
                continue
            T(ax, ch.px(v), L["xtick_y"], f"{v:g}", size=17 * fs, color=SOFT, ha="center",
              va="center", alpha=g * ta, mono=True, z=6)

    ax.plot([ch.x0, ch.x1], [ch.y0, ch.y0], color=INK, lw=2.2, alpha=alpha,
            zorder=4, solid_capstyle="round")
    T(ax, (ch.x0 + ch.x1) / 2, L["xlabel_y"], spaced("YEARS"), size=16 * fs, color=SOFT,
      ha="center", va="center", alpha=alpha * 0.9)

    mask = YEAR_AXIS <= year + 1e-9
    yrs = np.append(YEAR_AXIS[mask], year)
    inv = np.append(INVESTED[mask], invested_at(year))
    jr = np.append(JAR[mask], jar_at(year))
    xs = np.array([ch.px(v) for v in yrs])

    ax.fill_between(xs, ch.py(0), [ch.py(v) for v in inv], color=CLAY_FILL,
                    alpha=alpha * 0.5, lw=0, zorder=5)
    ax.plot(xs, [ch.py(v) for v in inv], color=CLAY, lw=5.0, alpha=alpha, zorder=7,
            solid_capstyle="round")
    ax.plot(xs, [ch.py(v) for v in jr], color=TEAL, lw=3.2, alpha=alpha, zorder=8,
            solid_capstyle="round")

    return xs[-1], ch.py(inv[-1]), ch.py(jr[-1])


def draw_lapse(ax, L, t):
    fs = L["fs"]
    st = lapse_state(t - LAPSE_IN)
    xmax, ymax, xticks, yticks = camera(st)
    ch = Chart(L, xmax, ymax)
    year = st["year"]

    intro = ease_out(seg(t, LAPSE_IN, LAPSE_IN + 0.5))
    hx, hy_inv, hy_jar = draw_chart(ax, L, ch, xticks, yticks, year, alpha=intro)

    coin(ax, hx, hy_jar, 1.5 * fs, alpha=intro, color=TEAL, face=PAPER, label=None, z=13)
    coin(ax, hx, hy_inv, 2.1 * fs, alpha=intro, color=CLAY, face=CLAY, label=None, z=13)

    draw_markers(ax, L, ch, st, intro)
    draw_header(ax, L, year, invested_at(year), jar_at(year), intro)
    draw_disclaimer(ax, L, intro)


def draw_markers(ax, L, ch, st, alpha):
    """Year pins. Newest gets a solid pill, the one before it stays as quiet type."""
    fs = L["fs"]
    for i in range(st["reached"]):
        yr = LAPSE_STEPS[i][0]
        if yr > ch.xmax * 1.02:
            continue
        val = invested_at(yr)
        x, y = ch.px(yr), ch.py(val)
        age = st["reached"] - 1 - i
        pop = ease_back(clamp01(st["marker_age"] / 0.42)) if age == 0 else 1.0

        ax.plot([x, x], [ch.y0, y], color=CLAY, lw=1.6, ls=(0, (2, 3)), zorder=6,
                alpha=alpha * (0.45 if age == 0 else 0.16))
        coin(ax, x, y, 1.9 * fs, alpha=alpha * (1.0 if age <= 1 else 0.4), color=CLAY,
             face=PAPER, label=None, z=14)

        lx = min(max(x, ch.x0 + 9 * fs), ch.x1 - 9 * fs)
        ly = y + (5.0 + 2.0 * (1 - pop)) * fs
        if age == 0:
            chip(ax, lx, ly, f"  YEAR {yr}   {money(val)}  ", size=17 * fs, fg=PAPER,
                 bg=CLAY, alpha=alpha * pop, ha="center", z=18)
        elif age == 1:
            T(ax, lx, ly, f"YEAR {yr}   {money(val)}", size=15 * fs, color=CLAY,
              ha="center", va="center", alpha=alpha * 0.72, z=18)


def draw_header(ax, L, year, inv, jar, alpha, dim=0.0):
    a = alpha * (1.0 - dim)
    ey, ny = L["head_eyebrow_y"], L["head_num_y"]

    T(ax, L["col_invested"], ey, spaced("INVESTED"), size=L["eyebrow_size"], color=CLAY,
      ha="left", va="center", alpha=a)
    T(ax, L["col_invested"], ny, money(inv), size=L["num_size"], color=CLAY,
      ha="left", va="baseline", alpha=a, mono=True)

    ja = "right" if L["vert"] else "left"
    T(ax, L["col_jar"], ey, spaced("IN A JAR"), size=L["eyebrow_size"], color=TEAL,
      ha=ja, va="center", alpha=a)
    T(ax, L["col_jar"], ny, money(jar), size=L["num_size"], color=TEAL,
      ha=ja, va="baseline", alpha=a, mono=True)

    if L["col_year"] is not None:
        T(ax, L["col_year"], ey, spaced("YEAR"), size=L["eyebrow_size"], color=SOFT,
          ha="right", va="center", alpha=a)
        T(ax, L["col_year"], ny, f"{int(year + 1e-9):d}", size=L["num_size"], color=INK,
          ha="right", va="baseline", alpha=a, mono=True)
    else:
        T(ax, L["cx"], L["chip_y"] - 9.0, f"YEAR {int(year + 1e-9):d}", size=L["num_size"],
          color=INK, ha="center", va="baseline", alpha=a, mono=True)


def draw_disclaimer(ax, L, alpha):
    """The growth rate is labelled as hypothetical on every chart frame."""
    fs, x = L["fs"], L["chart"][0]
    rate = RATE_LINE_SHORT if L["vert"] else RATE_LINE
    fine = FINE_PRINT
    if L["vert"]:
        fine = ("Figures are rounded illustrations — not a prediction,\n"
                "promise or guarantee of any return.")
    T(ax, x, L["disc_y"] + 5.2 * fs, spaced(rate, " "), size=13 * fs, color=CLAY,
      ha="left", va="center", alpha=alpha * 0.85)
    T(ax, x, L["disc_y"], fine, size=15 * fs, color=SOFT, ha="left",
      va="center", alpha=alpha * 0.9, weight="normal")


# ---------------------------------------------------------------------------
# scene 4 — payoff (31.0 - 39.4s)
# ---------------------------------------------------------------------------

def draw_payoff(ax, L, t):
    fs = L["fs"]
    xmax, ymax, xt, yt = VIEWS[-1]
    ch = Chart(L, xmax, ymax)
    cal_x = L["callout_x"]

    dim = ease_in_out(seg(t, PAYOFF_IN + 0.3, PAYOFF_IN + 1.3))
    hx, hy_inv, hy_jar = draw_chart(ax, L, ch, [(xt, 1.0)], [(yt, 1.0)], YEARS,
                                    alpha=1.0, dim=dim)
    draw_header(ax, L, YEARS, invested_at(YEARS), jar_at(YEARS), 1.0, dim=dim)
    draw_disclaimer(ax, L, 1.0)

    # the year pins hand over to the two endpoints
    keep = 1.0 - dim
    for yr, _, _ in LAPSE_STEPS:
        coin(ax, ch.px(yr), ch.py(invested_at(yr)), 1.9 * fs, alpha=keep * 0.7,
             color=CLAY, face=PAPER, label=None, z=14)
    val = invested_at(YEARS)
    chip(ax, ch.px(YEARS) - 9 * fs, ch.py(val) + 5.0 * fs, f"  YEAR 30   {money(val)}  ",
         size=17 * fs, fg=PAPER, bg=CLAY, alpha=keep, ha="center", z=18)

    pulse = 1.0 + 0.15 * math.sin((t - PAYOFF_IN) * 3.0)
    coin(ax, hx, hy_jar, 2.4 * fs * pulse, alpha=1.0, color=TEAL, face=PAPER, label=None, z=15)
    coin(ax, hx, hy_inv, 2.8 * fs * pulse, alpha=1.0, color=CLAY, face=CLAY, label=None, z=15)

    # -- endpoint callouts, in the right margin
    a1, d1 = rise(t, PAYOFF_IN + 1.2, PAYOFF_IN + 2.1)
    a2, d2 = rise(t, PAYOFF_IN + 1.9, PAYOFF_IN + 2.8)
    for a, d, y, name, amount, col, size in (
        (a1, d1, hy_inv, "INVESTED", money(val), CLAY, 34),
        (a2, d2, hy_jar, "IN A JAR", money(jar_at(YEARS)), TEAL, 28),
    ):
        T(ax, cal_x + d, y + 4.4 * fs, spaced(name, " "), size=15 * fs, color=col,
          ha="left", va="center", alpha=a)
        T(ax, cal_x + d, y - 2.0 * fs, amount, size=size * fs, color=col,
          ha="left", va="center", alpha=a, mono=True)

    # -- the gap between the two lines is the growth
    gx = ch.px(28.0)
    gy0, gy1 = ch.py(jar_at(28.0)), ch.py(invested_at(28.0))
    gp = ease_in_out(seg(t, PAYOFF_IN + 3.4, PAYOFF_IN + 4.4))
    if gp > 0.01:
        top = gy0 + (gy1 - gy0) * gp
        ax.plot([gx, gx], [gy0, top], color=INK, lw=2.0, alpha=gp, zorder=16,
                solid_capstyle="butt")
        head(ax, gx, gy0, -math.pi / 2, 1.9 * fs, INK, gp, z=17)
        if gp > 0.98:
            head(ax, gx, gy1, math.pi / 2, 1.9 * fs, INK, gp, z=17)
        # sit the callout on the mid-line of the wedge measured at its own left
        # edge, so it tucks between the two series instead of crossing either
        a3 = ease_out(seg(t, PAYOFF_IN + 4.2, PAYOFF_IN + 5.0))
        left = gx - (2.6 + 27.0) * fs
        yr_l = (left - ch.x0) / (ch.x1 - ch.x0) * ch.xmax
        chip(ax, gx - 2.6 * fs,
             (ch.py(jar_at(yr_l)) + ch.py(invested_at(yr_l))) / 2 + 1.0 * fs,
             f" {money(GROWTH_ONLY, 1000)} \nof this is growth ",
             size=17 * fs, fg=INK, bg=PAPER, alpha=a3, ha="right", z=18)

    # -- closing lines, in the band the header just vacated
    a4, d4 = rise(t, PAYOFF_IN + 5.4, PAYOFF_IN + 6.2)
    a5, d5 = rise(t, PAYOFF_IN + 6.1, PAYOFF_IN + 6.9)
    tx = L["col_invested"]
    T(ax, tx, L["head_eyebrow_y"] - 1.0 + d4, "Same $20 a month. Same 30 years.",
      size=26 * fs, color=SOFT, ha="left", va="center", alpha=a4 * 0.95)
    T(ax, tx, L["head_eyebrow_y"] - 11.0 * fs - d5, "Only where you put it changed.",
      size=36 * fs, color=INK, ha="left", va="center", alpha=a5)


# ---------------------------------------------------------------------------
# scene 5 — end card (39.4 - 42.0s)
# ---------------------------------------------------------------------------

def draw_card(ax, L, t):
    fs, cx, H = L["fs"], L["cx"], L["H"]
    a0 = ease_out(seg(t, CARD_IN + 0.15, CARD_IN + 0.85))
    mark_y = H * 0.66

    p = ease_in_out(seg(t, CARD_IN + 0.2, CARD_IN + 1.6))
    x0, x1 = cx - 30 * fs, cx + 30 * fs
    xs = np.linspace(0, 1, 60)
    keep = xs <= p
    curve_y = mark_y + (xs ** 2.6) * 18 * fs
    ax.plot([x0, x1], [mark_y, mark_y], color=TEAL, lw=3.4, alpha=a0 * 0.6,
            zorder=9, solid_capstyle="round")
    if keep.sum() > 1:
        ax.plot(x0 + (x1 - x0) * xs[keep], curve_y[keep], color=CLAY, lw=5.4,
                alpha=a0, zorder=10, solid_capstyle="round")

    a1, d1 = rise(t, CARD_IN + 0.5, CARD_IN + 1.2)
    a2, d2 = rise(t, CARD_IN + 0.8, CARD_IN + 1.5)
    T(ax, cx, H * 0.40 + d1, "$20 a month.", size=62 * fs, color=INK,
      ha="center", va="center", alpha=a1)
    T(ax, cx, H * 0.40 - 11.0 * fs - d2, "Time does the heavy lifting.", size=40 * fs,
      color=CLAY, ha="center", va="center", alpha=a2)

    a3 = ease_out(seg(t, CARD_IN + 1.3, CARD_IN + 2.0))
    T(ax, cx, H * 0.15, "Educational illustration at a hypothetical 7% average annual\n"
                        "growth rate. Not financial advice, and not a guarantee.",
      size=15 * fs, color=SOFT, ha="center", va="center", alpha=a3 * 0.9, weight="normal")


# ---------------------------------------------------------------------------
# frame assembly
# ---------------------------------------------------------------------------

def overlay_alpha(t: float) -> float:
    """Paper wipe: scene fades plus the top and tail."""
    a = 0.0
    for centre, half in FADES:
        a = max(a, 1.0 - min(abs(t - centre) / half, 1.0))
    a = max(a, 1.0 - ease_out(seg(t, 0.0, 0.45)))
    a = max(a, ease_in_out(seg(t, DURATION - 0.55, DURATION)))
    return a


def draw_frame(ax, L, t):
    ax.clear()
    ax.set_xlim(0, L["W"])
    ax.set_ylim(0, L["H"])
    ax.set_axis_off()
    ax.add_patch(Rectangle((0, 0), L["W"], L["H"], fc=PAPER, ec="none", zorder=0))

    if t < HOOK_OUT:
        draw_hook(ax, L, t)
    elif t < SETUP_OUT:
        draw_setup(ax, L, t)
    elif t < PAYOFF_IN:
        draw_lapse(ax, L, t)
    elif t < CARD_IN:
        draw_payoff(ax, L, t)
    else:
        draw_card(ax, L, t)

    a = overlay_alpha(t)
    if a > 0.002:
        ax.add_patch(Rectangle((0, 0), L["W"], L["H"], fc=PAPER, ec="none",
                               alpha=a, zorder=90))


def make_figure(aspect: str, scale: float):
    px_w, px_h = ASPECTS[aspect]["px"]
    fig = plt.figure(figsize=(px_w / 100.0, px_h / 100.0), dpi=100 * scale, facecolor=PAPER)
    ax = fig.add_axes([0, 0, 1, 1])
    return fig, ax


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--aspect", choices=list(ASPECTS), default="16:9")
    ap.add_argument("--out", default=None)
    ap.add_argument("--scale", type=float, default=1.0, help="render scale, e.g. 0.5 for a draft")
    ap.add_argument("--fps", type=int, default=FPS)
    ap.add_argument("--stills", nargs="*", type=float, default=None,
                    help="render PNG stills at these times instead of a video")
    args = ap.parse_args()

    L = layout_for(args.aspect)
    fig, ax = make_figure(args.aspect, args.scale)
    os.makedirs("out", exist_ok=True)

    if args.stills is not None:
        times = args.stills or [1.8, 6.5, 13.0, 20.0, 27.5, 33.5, 37.5, 41.0]
        for t in times:
            draw_frame(ax, L, t)
            path = f"out/still_{args.aspect.replace(':', 'x')}_{t:05.1f}s.png"
            fig.savefig(path, facecolor=PAPER)
            print(path)
        return

    out = args.out or f"out/compound_growth_{args.aspect.replace(':', 'x')}.mp4"
    frames = int(round(DURATION * args.fps))
    writer = FFMpegWriter(
        fps=args.fps, codec="libx264", bitrate=-1,
        extra_args=["-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "18",
                    "-movflags", "+faststart"],
    )
    print(f"{args.aspect}  {frames} frames  {DURATION:.1f}s  -> {out}")
    with writer.saving(fig, out, dpi=100 * args.scale):
        for i in range(frames):
            draw_frame(ax, L, i / args.fps)
            writer.grab_frame(facecolor=PAPER)
            if i % 120 == 0:
                print(f"  {i:4d}/{frames}  {i / args.fps:5.1f}s", flush=True)
    print(f"done: {out}  ({os.path.getsize(out) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
