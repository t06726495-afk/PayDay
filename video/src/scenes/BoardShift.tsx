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
import { Movement } from "../components/Movement";
import { data, fmt, movement, prev, prevOf, Team } from "../data";
import { body, colors, display } from "../theme";

// Board geometry.
const TOP = 230;
const STEP = 64;
const ROW_H = 58;

// Key moments (frames, relative to this scene).
const MOVE_START = 75;
const MOVE_END = 165;
const ARROWS = 168;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const glide = Easing.bezier(0.65, 0, 0.35, 1);

const Row: React.FC<{ team: Team; enter: number }> = ({ team, enter }) => {
  const frame = useCurrentFrame();
  const before = prevOf(team);
  const change = movement(team);
  const fromY = (before.rank - 1) * STEP;
  const toY = (team.rank - 1) * STEP;
  const gained = team.pf - before.pf;
  const leader = team.rank === 1;

  return (
    <div
      style={{
        position: "absolute",
        left: 200,
        right: 110,
        height: ROW_H,
        zIndex: change > 0 ? 3 : change < 0 ? 1 : 2,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 24px",
        borderRadius: 8,
        background: colors.panel,
        borderLeft: `8px solid ${team.color}`,
        boxShadow: change !== 0 ? "0 10px 30px rgba(0,0,0,0.45)" : "none",
        translate: interpolate(frame, [MOVE_START, MOVE_END], [`0px ${fromY}px`, `0px ${toY}px`], {
          ...clamp,
          easing: glide,
        }),
        scale: interpolate(frame, [MOVE_START, (MOVE_START + MOVE_END) / 2, MOVE_END], [1, change === 0 ? 1 : 1.03, 1], {
          ...clamp,
          output: "perceptual-scale",
        }),
        opacity: interpolate(frame, [enter, enter + 8], [0, 1], clamp),
      }}
    >
      {/* Gold wash for the new #1 once the board settles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 8,
          background: "linear-gradient(90deg, rgba(245,197,66,0.35), rgba(245,197,66,0.05))",
          opacity: leader ? interpolate(frame, [MOVE_END, MOVE_END + 15], [0, 1], clamp) : 0,
        }}
      />
      <Badge abbr={team.abbr} color={team.color} size={44} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 16, zIndex: 1 }}>
        <span style={{ fontFamily: body, fontWeight: 700, fontSize: 38, color: "white", whiteSpace: "nowrap" }}>
          {team.team}
        </span>
        <span style={{ fontFamily: body, fontWeight: 500, fontSize: 28, color: colors.muted }}>{team.owner}</span>
      </div>

      {/* Record: last week's flips to this week's mid-move */}
      <div style={{ width: 130, position: "relative", height: 44, zIndex: 1 }}>
        <div
          style={{
            position: "absolute",
            right: 0,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 36,
            color: colors.muted,
            opacity: interpolate(frame, [110, 122], [1, 0], clamp),
          }}
        >
          {before.record}
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 36,
            color: "white",
            opacity: interpolate(frame, [116, 128], [0, 1], clamp),
          }}
        >
          {team.record}
        </div>
      </div>

      {/* This week's points */}
      <div style={{ width: 170, display: "flex", justifyContent: "flex-end", zIndex: 1 }}>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 30,
            color: colors.navy,
            background: colors.gold,
            borderRadius: 30,
            padding: "2px 16px",
            opacity: interpolate(frame, [MOVE_START - 10, MOVE_START], [0, 1], clamp),
            scale: interpolate(frame, [MOVE_START - 10, MOVE_START], [0.6, 1], {
              ...clamp,
              easing: Easing.spring({ damping: 12 }),
              output: "perceptual-scale",
            }),
          }}
        >
          +{fmt(gained)}
        </div>
      </div>

      {/* Season total counting up */}
      <div
        style={{
          width: 170,
          textAlign: "right",
          fontFamily: display,
          fontWeight: 700,
          fontSize: 42,
          color: leader ? colors.gold : "white",
          fontVariantNumeric: "tabular-nums",
          zIndex: 1,
        }}
      >
        {fmt(interpolate(frame, [MOVE_START, MOVE_END], [before.pf, team.pf], { ...clamp, easing: glide }))}
      </div>

      <div
        style={{
          width: 90,
          display: "flex",
          justifyContent: "center",
          zIndex: 1,
          scale: interpolate(frame, [ARROWS, ARROWS + 10], [0, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 11 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <Movement change={change} size={0.8} />
      </div>
    </div>
  );
};

export const BoardShift: React.FC = () => {
  const frame = useCurrentFrame();
  const anyUp = data.teams.some((t) => movement(t) > 0);
  const anyDown = data.teams.some((t) => movement(t) < 0);

  return (
    <AbsoluteFill>
      <Background />

      <Sequence name="Move whoosh" from={MOVE_START} layout="none">
        <Audio src={staticFile("sfx/swoosh.ogg")} volume={0.6} />
      </Sequence>
      {anyUp ? (
        <Sequence name="Up sound" from={ARROWS} layout="none">
          <Audio src={staticFile("sfx/up.ogg")} volume={0.6} />
        </Sequence>
      ) : null}
      {anyDown ? (
        <Sequence name="Down sound" from={ARROWS + 6} layout="none">
          <Audio src={staticFile("sfx/down.ogg")} volume={0.6} />
        </Sequence>
      ) : null}

      {/* Header: title plate + "after week" label that flips from last week to this week */}
      <AbsoluteFill style={{ padding: "90px 110px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            alignSelf: "flex-start",
            clipPath: `inset(0 ${interpolate(frame, [0, 14], [100, 0], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}% 0 0)`,
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
            POWER RANKINGS
          </Interactive.Div>
          <div style={{ position: "relative", width: 330, background: colors.navy }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: display,
                fontWeight: 700,
                fontSize: 40,
                letterSpacing: 4,
                color: colors.muted,
                opacity: interpolate(frame, [MOVE_START - 12, MOVE_START - 2], [1, 0], clamp),
              }}
            >
              AFTER WEEK {prev.week}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: display,
                fontWeight: 700,
                fontSize: 40,
                letterSpacing: 4,
                color: colors.gold,
                opacity: interpolate(frame, [MOVE_START - 4, MOVE_START + 6], [0, 1], clamp),
                translate: interpolate(frame, [MOVE_START - 4, MOVE_START + 6], ["0px 20px", "0px 0px"], {
                  ...clamp,
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            >
              AFTER WEEK {data.week}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Column labels */}
      <div
        style={{
          position: "absolute",
          top: TOP - 40,
          right: 110,
          display: "flex",
          gap: 20,
          paddingRight: 24,
          fontFamily: body,
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: 3,
          color: colors.muted,
          opacity: interpolate(frame, [10, 20], [0, 1], clamp),
        }}
      >
        <div style={{ width: 130, textAlign: "right" }}>RECORD</div>
        <div style={{ width: 170, textAlign: "right" }}>THIS WEEK</div>
        <div style={{ width: 170, textAlign: "right" }}>TOTAL PTS</div>
        <div style={{ width: 90, textAlign: "center" }}>MOVE</div>
      </div>

      {/* Fixed rank slots on the left; the team rows slide between them */}
      {data.teams.map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 110,
            top: TOP + i * STEP,
            width: 70,
            height: ROW_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: display,
            fontWeight: 700,
            fontSize: 44,
            color: i === 0 ? colors.gold : "white",
            opacity: interpolate(frame, [4 + i * 2, 12 + i * 2], [0, 1], clamp),
          }}
        >
          {i + 1}
        </div>
      ))}

      <div style={{ position: "absolute", top: TOP, left: 0, right: 0 }}>
        {[...data.teams]
          .sort((a, b) => prevOf(a).rank - prevOf(b).rank)
          .map((team) => (
            <Row key={team.team} team={team} enter={6 + (prevOf(team).rank - 1) * 3} />
          ))}
      </div>

      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "flex-end",
          padding: "104px 110px",
          pointerEvents: "none",
        }}
      >
        <Interactive.Div
          name="Sign-off"
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 40,
            letterSpacing: 6,
            color: colors.gold,
            opacity: interpolate(frame, [330, 350], [0, 1], clamp),
          }}
        >
          SEE YOU NEXT WEEK
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
