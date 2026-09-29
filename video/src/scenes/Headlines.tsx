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
import { SceneTitle } from "../components/SceneTitle";
import { data, Headline } from "../data";
import { body, colors, display } from "../theme";

const HeadlineCard: React.FC<{ h: Headline }> = ({ h }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        background: colors.panel,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        scale: interpolate(frame, [0, 12], [0.85, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 14 }),
          output: "perceptual-scale",
        }),
        opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          background: colors.gold,
          color: colors.navy,
          fontFamily: display,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: 4,
          padding: "8px 28px",
        }}
      >
        {h.tag}
      </div>
      <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 48, lineHeight: 1.1, color: "white" }}>
          {h.title}
        </div>
        <div style={{ fontFamily: body, fontWeight: 500, fontSize: 38, lineHeight: 1.2, color: colors.muted }}>
          {h.detail}
        </div>
      </div>
    </div>
  );
};

export const Headlines: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background accent="#e0b43a" />
      <Audio src={staticFile("sfx/swoosh.ogg")} volume={0.5} />
      <SceneTitle kicker={`WEEK ${data.week}`} title="HEADLINES" />
      <AbsoluteFill style={{ padding: "250px 110px 130px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 36,
            height: "100%",
          }}
        >
          {data.headlines.slice(0, 4).map((h, i) => (
            <Sequence key={h.tag} from={10 + i * 40} layout="none">
              <Audio src={staticFile("sfx/slam.ogg")} volume={0.45} />
              <HeadlineCard h={h} />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
