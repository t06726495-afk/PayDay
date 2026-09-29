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
import { Movement } from "../components/Movement";
import { SceneTitle } from "../components/SceneTitle";
import { data, movement, Team } from "../data";
import { body, colors, display } from "../theme";

const Row: React.FC<{ team: Team }> = ({ team }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        height: 96,
        padding: "0 26px",
        background: team.rank === 1 ? "rgba(245, 197, 66, 0.22)" : colors.panel,
        borderLeft: `8px solid ${team.rank === 1 ? colors.gold : team.color}`,
        borderRadius: 8,
        opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: interpolate(frame, [0, 12], ["-60px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <div
        style={{
          width: 64,
          fontFamily: display,
          fontWeight: 700,
          fontSize: 54,
          color: team.rank === 1 ? colors.gold : "white",
          textAlign: "center",
        }}
      >
        {team.rank}
      </div>
      <div style={{ width: 90 }}>
        <Movement change={movement(team)} size={0.75} />
      </div>
      <Badge abbr={team.abbr} color={team.color} size={62} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: body,
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1,
            color: "white",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {team.team}
        </div>
        <div style={{ fontFamily: body, fontWeight: 500, fontSize: 26, color: colors.muted }}>{team.owner}</div>
      </div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 42, color: "white" }}>{team.record}</div>
    </div>
  );
};

export const FinalBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const ranked = [...data.teams].sort((a, b) => a.rank - b.rank);
  return (
    <AbsoluteFill>
      <Background />
      <Audio src={staticFile("sfx/swoosh.ogg")} volume={0.5} />
      <SceneTitle kicker={`WEEK ${data.week}`} title="THE FULL BOARD" />
      <AbsoluteFill style={{ padding: "230px 110px 130px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "repeat(6, 96px)",
            gridAutoFlow: "column",
            gap: "18px 44px",
          }}
        >
          {ranked.map((t, i) => (
            <Sequence key={t.team} from={6 + i * 4} layout="none">
              <Row team={t} />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "flex-end",
          padding: "0 110px 110px",
          opacity: interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: colors.gold }}>
          SEE YOU NEXT WEEK
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
