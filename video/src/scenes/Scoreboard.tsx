import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Background } from "../components/Background";
import { Badge } from "../components/Badge";
import { SceneTitle } from "../components/SceneTitle";
import { data, fmt, Side, teamByName } from "../data";
import { body, colors, display } from "../theme";

const Row: React.FC<{ side: Side; won: boolean; frame: number }> = ({ side, won, frame }) => {
  const team = teamByName(side.team);
  const counted = interpolate(frame, [10, 40], [0, side.score], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: won ? 1 : 0.55 }}>
      <Badge abbr={team?.abbr ?? "?"} color={team?.color ?? "#555"} size={62} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: body,
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1.05,
            color: "white",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {side.team}
        </div>
        <div style={{ fontFamily: body, fontWeight: 500, fontSize: 26, color: colors.muted }}>
          {team?.owner}
        </div>
      </div>
      <div
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 56,
          color: won ? colors.gold : "white",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmt(counted)}
      </div>
      <div style={{ width: 20, fontSize: 30, color: colors.gold, opacity: won && frame > 40 ? 1 : 0 }}>◀</div>
    </div>
  );
};

const Card: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const m = data.matchups[index];
  const homeWon = m.home.score >= m.away.score;
  return (
    <div
      style={{
        background: colors.panel,
        borderLeft: `8px solid ${colors.gold}`,
        borderRadius: 10,
        padding: "16px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: interpolate(frame, [0, 14], ["0px 50px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <Row side={m.home} won={homeWon} frame={frame} />
      <div style={{ height: 2, background: "rgba(255,255,255,0.12)" }} />
      <Row side={m.away} won={!homeWon} frame={frame} />
    </div>
  );
};

export const Scoreboard: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background accent="#d7263d" />
      <Audio src={staticFile("sfx/swoosh.ogg")} volume={0.5} />
      <SceneTitle kicker={`WEEK ${data.week}`} title="FINAL SCORES" />
      <AbsoluteFill style={{ padding: "235px 110px 110px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "22px 48px",
          }}
        >
          {data.matchups.map((m, i) => (
            <Sequence key={m.home.team} from={8 + i * 7} layout="none">
              <Card index={i} />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
