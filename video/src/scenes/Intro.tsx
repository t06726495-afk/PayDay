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
import { data } from "../data";
import { colors, display } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background />
      <Audio src={staticFile("sfx/swoosh.ogg")} volume={0.6} />
      <Sequence from={10} layout="none">
        <Audio src={staticFile("sfx/intro-hit.ogg")} volume={0.8} />
      </Sequence>

      {/* Sweeping color bars */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 2600,
            height: 300,
            background: `linear-gradient(90deg, ${colors.red}, #8e1b2b)`,
            rotate: "-6deg",
            translate: interpolate(frame, [0, 14], ["-2600px 0px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 2600,
            height: 26,
            background: colors.gold,
            rotate: "-6deg",
            translate: interpolate(frame, [4, 18], ["2600px 175px", "0px 175px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <Interactive.Div
          name="League name"
          style={{
            fontFamily: display,
            fontWeight: 500,
            fontSize: 54,
            letterSpacing: 18,
            color: colors.gold,
            opacity: interpolate(frame, [16, 26], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [16, 26], ["0px -30px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {data.league.toUpperCase()}
        </Interactive.Div>
        <Interactive.Div
          name="Title"
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 190,
            lineHeight: 1,
            color: "white",
            fontStyle: "italic",
            letterSpacing: 4,
            textShadow: "0 12px 40px rgba(0,0,0,0.55)",
            rotate: "-6deg",
            scale: interpolate(frame, [8, 20], [2.4, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            }),
            opacity: interpolate(frame, [8, 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          POWER RANKINGS
        </Interactive.Div>
        <Interactive.Div
          name="Week plate"
          style={{
            marginTop: 70,
            padding: "10px 48px",
            background: "white",
            color: colors.navy,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 72,
            letterSpacing: 8,
            rotate: "-6deg",
            scale: interpolate(frame, [24, 34], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 12 }),
              output: "perceptual-scale",
            }),
          }}
        >
          WEEK {data.week}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
