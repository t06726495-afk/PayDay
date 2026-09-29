import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, display } from "../theme";

// Broadcast-style section header in the top-left.
export const SceneTitle: React.FC<{ kicker: string; title: string }> = ({ kicker, title }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: "90px 110px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          alignSelf: "flex-start",
          clipPath: `inset(0 ${interpolate(frame, [0, 14], [100, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}% 0 0)`,
        }}
      >
        <div
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
          {kicker}
        </div>
        <div
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
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
