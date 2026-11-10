import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Background } from "../components/Background";
import { Badge } from "../components/Badge";
import { data, Team } from "../data";
import { body, colors, display } from "../theme";

// Pyramid geometry (1920x1080).
const CENTER_X = 960;
const TOP_Y = 240;
const BOTTOM_Y = 980;
const APEX_W = 640;
const BASE_W = 1500;
const GAP = 8;

// Timing: the base lands first, each tier above it STEP frames later.
const FIRST = 20;
const STEP = 18;
const TOP_EXTRA = 20;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const land = Easing.bezier(0.16, 1, 0.3, 1);

const wins = (t: Team) => Number(t.record.split("-")[0]);

// One tier per record, best record on top.
const tiers: Team[][] = (() => {
  const byRecord = new Map<string, Team[]>();
  for (const t of [...data.teams].sort((a, b) => a.rank - b.rank)) {
    byRecord.set(t.record, [...(byRecord.get(t.record) ?? []), t]);
  }
  return [...byRecord.values()].sort((a, b) => wins(b[0]) - wins(a[0]));
})();

const tierFill = (i: number, n: number) => {
  if (i === 0) return `linear-gradient(180deg, #ffe08a, ${colors.gold} 45%, #c9971f)`;
  if (i === n - 1) return "linear-gradient(180deg, #3a4560, #252d40)";
  const mix = (i - 1) / Math.max(n - 3, 1);
  const top = mix < 0.5 ? "#2a5bd7" : "#1f3d8f";
  return `linear-gradient(180deg, ${top}, #142a66)`;
};

// When a tier lands, counted from the base up.
const landAt = (i: number, n: number) => FIRST + (n - 1 - i) * STEP + (i === 0 ? TOP_EXTRA : 0);

const Chip: React.FC<{ team: Team; delay: number }> = ({ team, delay }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: 172,
        display: "flex",
        alignItems: "center",
        gap: 10,
        scale: interpolate(frame, [delay, delay + 10], [0.4, 1], {
          ...clamp,
          easing: Easing.spring({ damping: 12 }),
          output: "perceptual-scale",
        }),
        opacity: interpolate(frame, [delay, delay + 6], [0, 1], clamp),
      }}
    >
      <Badge abbr={team.abbr} color={team.color} size={44} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 30, lineHeight: 1, color: "white" }}>
          {team.owner}
        </div>
        <div
          style={{
            fontFamily: body,
            fontWeight: 500,
            fontSize: 19,
            color: colors.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {team.team}
        </div>
      </div>
    </div>
  );
};

const Tier: React.FC<{ teams: Team[]; i: number; n: number }> = ({ teams, i, n }) => {
  const frame = useCurrentFrame();
  const h = (BOTTOM_Y - TOP_Y - GAP * (n - 1)) / n;
  const y = TOP_Y + i * (h + GAP);
  const wTop = APEX_W + ((BASE_W - APEX_W) * i) / n;
  const wBottom = APEX_W + ((BASE_W - APEX_W) * (i + 1)) / n;
  const inset = ((wBottom - wTop) / 2 / wBottom) * 100;
  const at = landAt(i, n);
  const top = i === 0;
  const leader = teams[0];

  return (
    <div
      style={{
        position: "absolute",
        left: CENTER_X - wBottom / 2,
        top: y,
        width: wBottom,
        height: h,
        translate: interpolate(frame, [at - 12, at], ["0px -140px", "0px 0px"], { ...clamp, easing: land }),
        opacity: interpolate(frame, [at - 12, at - 6], [0, 1], clamp),
      }}
    >
      {/* Trapezoid block */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: tierFill(i, n),
          clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%)`,
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        }}
      />
      {/* Record label on the right slope */}
      <div
        style={{
          position: "absolute",
          left: wBottom - (wBottom - wTop) / 4 + 18,
          top: 0,
          height: h,
          display: "flex",
          alignItems: "center",
          fontFamily: display,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 2,
          color: top ? colors.gold : colors.muted,
          whiteSpace: "nowrap",
        }}
      >
        {teams[0].record}
      </div>
      {/* Teams */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {top ? (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Badge abbr={leader.abbr} color={leader.color} size={74} />
            <div>
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: 52, lineHeight: 1, color: colors.navy }}>
                {leader.owner.toUpperCase()}
              </div>
              <div style={{ fontFamily: body, fontWeight: 700, fontSize: 26, color: "#4a3a0c" }}>{leader.team}</div>
            </div>
          </div>
        ) : (
          teams.map((t, k) => <Chip key={t.team} team={t} delay={at + 2 + k * 3} />)
        )}
      </div>
    </div>
  );
};

export const Pyramid: React.FC = () => {
  const frame = useCurrentFrame();
  const n = tiers.length;
  const topAt = landAt(0, n);

  return (
    <AbsoluteFill>
      <Background accent={colors.gold} />

      {tiers.map((_, i) => (
        <Sequence key={i} name={`Tier ${i + 1} sound`} from={landAt(i, n)} layout="none">
          <Audio src={staticFile("sfx/slam.ogg")} volume={i === 0 ? 0.8 : 0.45} />
        </Sequence>
      ))}
      <Sequence name="Top fanfare" from={topAt} layout="none">
        <Audio src={staticFile("sfx/champ-sax.ogg")} volume={0.7} />
      </Sequence>

      {/* Header */}
      <AbsoluteFill style={{ padding: "90px 110px" }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            clipPath: `inset(0 ${interpolate(frame, [0, 14], [100, 0], { ...clamp, easing: land })}% 0 0)`,
          }}
        >
          <Interactive.Div
            name="League tag"
            style={{
              background: colors.red,
              color: "white",
              fontFamily: display,
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: 4,
              padding: "8px 26px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {data.league.toUpperCase()}
          </Interactive.Div>
          <Interactive.Div
            name="Title"
            style={{
              background: "white",
              color: colors.navy,
              fontFamily: display,
              fontWeight: 700,
              fontSize: 64,
              letterSpacing: 3,
              padding: "0 34px",
            }}
          >
            THE PYRAMID
          </Interactive.Div>
          <div
            style={{
              background: colors.navy,
              color: colors.gold,
              fontFamily: display,
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: 4,
              padding: "0 30px",
              display: "flex",
              alignItems: "center",
            }}
          >
            AFTER WEEK {data.week}
          </div>
        </div>
      </AbsoluteFill>

      {/* Glow behind the top tier once it lands */}
      <div
        style={{
          position: "absolute",
          left: CENTER_X - 420,
          top: TOP_Y - 120,
          width: 840,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(245,197,66,0.45), transparent 70%)",
          opacity: interpolate(frame, [topAt, topAt + 20], [0, 1], clamp),
          scale: interpolate(frame, [topAt, topAt + 20], [0.6, 1], {
            ...clamp,
            easing: land,
            output: "perceptual-scale",
          }),
        }}
      />

      {tiers.map((teams, i) => (
        <Tier key={teams[0].record} teams={teams} i={i} n={n} />
      ))}
    </AbsoluteFill>
  );
};
