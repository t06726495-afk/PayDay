import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Background } from "../components/Background";
import { Badge } from "../components/Badge";
import { Movement } from "../components/Movement";
import { data, fmt, movement, Team } from "../data";
import { body, colors, display } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = Easing.bezier(0.16, 1, 0.3, 1);

const Stat: React.FC<{ label: string; children: React.ReactNode; delay: number }> = ({ label, children, delay }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        flex: 1,
        background: colors.panel,
        borderTop: `5px solid ${colors.gold}`,
        borderRadius: 8,
        padding: "14px 22px",
        opacity: interpolate(frame, [delay, delay + 8], [0, 1], clamp),
        translate: interpolate(frame, [delay, delay + 12], ["0px 40px", "0px 0px"], { ...clamp, easing: pop }),
      }}
    >
      <div style={{ fontFamily: body, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: colors.muted }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.1,
          color: "white",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = [colors.gold, "#ffffff", colors.red, "#ffe28a"];
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {new Array(90).fill(0).map((_, i) => {
        const x = random(`x${i}`) * 1920;
        const speed = 7 + random(`s${i}`) * 9;
        const delay = random(`d${i}`) * 40;
        const y = (frame - delay) * speed - 60;
        const sway = Math.sin((frame + i * 13) / 9) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + sway,
              top: y,
              width: 14,
              height: 24,
              background: palette[i % palette.length],
              rotate: `${frame * (4 + (i % 7)) + i * 40}deg`,
              opacity: frame < delay ? 0 : 0.95,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Card: React.FC<{ team: Team; top: boolean }> = ({ team, top }) => {
  const frame = useCurrentFrame();
  const change = movement(team);
  const accent = top ? colors.gold : team.color;
  const moveSound = change > 0 ? "sfx/up.ogg" : change < 0 ? "sfx/down.ogg" : null;

  return (
    <AbsoluteFill>
      {/* Sound design */}
      <Audio src={staticFile("sfx/swoosh.ogg")} volume={0.45} />
      <Sequence from={10} layout="none">
        <Audio src={staticFile("sfx/slam.ogg")} volume={0.7} />
      </Sequence>
      {moveSound ? (
        <Sequence from={40} layout="none">
          <Audio src={staticFile(moveSound)} volume={0.6} />
        </Sequence>
      ) : null}
      {team.sound ? (
        <Sequence from={48} layout="none">
          <Audio src={staticFile(`sfx/${team.sound}.ogg`)} volume={0.9} />
        </Sequence>
      ) : null}
      {top ? (
        <Sequence from={10} layout="none">
          <Audio src={staticFile("sfx/champ-sax.ogg")} volume={0.7} />
        </Sequence>
      ) : null}

      {/* Team color slab behind the rank number */}
      <div
        style={{
          position: "absolute",
          left: -200,
          top: 0,
          bottom: 0,
          width: 900,
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 60%, ${accent}55 100%)`,
          clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)",
          translate: interpolate(frame, [0, 12], ["-900px 0px", "0px 0px"], { ...clamp, easing: pop }),
          boxShadow: "20px 0 60px rgba(0,0,0,0.4)",
        }}
      />

      {top ? <Confetti /> : null}

      {/* Rank number */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 0,
          bottom: 64,
          width: 560,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: 500,
            fontSize: 44,
            letterSpacing: 10,
            color: top ? colors.navy : "rgba(255,255,255,0.85)",
            opacity: interpolate(frame, [6, 14], [0, 1], clamp),
          }}
        >
          RANK
        </div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 360,
            lineHeight: 0.95,
            color: top ? colors.navy : "white",
            fontStyle: "italic",
            textShadow: top ? "none" : "0 18px 50px rgba(0,0,0,0.45)",
            scale: interpolate(frame, [4, 14], [3, 1], { ...clamp, easing: pop, output: "perceptual-scale" }),
            opacity: interpolate(frame, [4, 9], [0, 1], clamp),
          }}
        >
          {team.rank}
        </div>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 22,
            background: "rgba(3, 8, 22, 0.85)",
            borderRadius: 60,
            padding: "12px 30px",
            scale: interpolate(frame, [38, 48], [0, 1], {
              ...clamp,
              easing: Easing.spring({ damping: 11 }),
              output: "perceptual-scale",
            }),
          }}
        >
          <Movement change={change} />
          <div style={{ fontFamily: body, fontWeight: 600, fontSize: 32, color: colors.muted, letterSpacing: 2 }}>
            LAST WEEK #{team.lastWeek}
          </div>
        </div>
      </div>

      {/* Team identity + stats + blurb */}
      <div
        style={{
          position: "absolute",
          left: 760,
          right: 110,
          top: 100,
          bottom: 130,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 34,
            opacity: interpolate(frame, [12, 20], [0, 1], clamp),
            translate: interpolate(frame, [12, 24], ["120px 0px", "0px 0px"], { ...clamp, easing: pop }),
          }}
        >
          <div
            style={{
              scale: interpolate(frame, [14, 26], [0, 1], {
                ...clamp,
                easing: Easing.spring({ damping: 10 }),
                output: "perceptual-scale",
              }),
            }}
          >
            <Badge abbr={team.abbr} color={team.color} size={170} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: team.team.length > 16 ? 88 : 104,
                lineHeight: 1,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {team.team}
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: body,
                fontWeight: 600,
                fontSize: 46,
                color: accent === colors.gold ? colors.gold : colors.muted,
              }}
            >
              Owner: <span style={{ color: "white" }}>{team.owner}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <Stat label="RECORD" delay={22}>
            {team.record}
          </Stat>
          <Stat label="POINTS FOR" delay={26}>
            {fmt(interpolate(frame, [26, 50], [0, team.pf], { ...clamp, easing: Easing.out(Easing.cubic) }))}
          </Stat>
          <Stat label="POINTS AGAINST" delay={30}>
            {fmt(interpolate(frame, [30, 54], [0, team.pa], { ...clamp, easing: Easing.out(Easing.cubic) }))}
          </Stat>
          <Stat label="STREAK" delay={34}>
            <span style={{ color: team.streak.startsWith("W") ? colors.up : colors.down }}>{team.streak}</span>
          </Stat>
        </div>

        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.96)",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            clipPath: `inset(0 ${interpolate(frame, [26, 40], [100, 0], { ...clamp, easing: pop })}% 0 0)`,
          }}
        >
          <div style={{ width: 16, background: accent, flexShrink: 0 }} />
          <div
            style={{
              padding: "22px 30px",
              fontFamily: body,
              fontWeight: 600,
              fontSize: 44,
              lineHeight: 1.22,
              color: colors.navy,
            }}
          >
            {team.blurb}
          </div>
        </div>
      </div>

    </AbsoluteFill>
  );
};

// Countdown bug in the top-left corner.
const Bug: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 760,
      top: 40,
      fontFamily: display,
      fontWeight: 500,
      fontSize: 30,
      letterSpacing: 6,
      color: colors.gold,
    }}
  >
    POWER RANKINGS · WEEK {data.week}
  </div>
);

export const RankReveal: React.FC<{ team: Team; top?: boolean }> = ({ team, top = false }) => {
  const frame = useCurrentFrame();
  const lead = top ? 45 : 0;

  return (
    <AbsoluteFill>
      <Background accent={top ? colors.gold : team.color} />
      <Bug />
      {top ? (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: interpolate(frame, [0, 8, lead - 6, lead], [0, 1, 1, 0], clamp),
          }}
        >
          <div
            style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 120,
              fontStyle: "italic",
              color: "white",
              letterSpacing: 4,
              scale: interpolate(frame, [0, lead], [0.9, 1.15], clamp),
            }}
          >
            AND YOUR <span style={{ color: colors.gold }}>NUMBER ONE</span>...
          </div>
        </AbsoluteFill>
      ) : null}
      <Sequence from={lead} layout="absolute-fill">
        <Card team={team} top={top} />
      </Sequence>
    </AbsoluteFill>
  );
};
