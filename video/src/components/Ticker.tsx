import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { data, fmt } from "../data";
import { body, colors, display } from "../theme";

// Bottom-of-screen score ticker, like a sports network crawl.
export const Ticker: React.FC = () => {
  const frame = useCurrentFrame();
  const items = data.matchups.map((m) => {
    const homeWon = m.home.score >= m.away.score;
    return (
      <span key={m.home.team} style={{ marginRight: 70, whiteSpace: "nowrap" }}>
        <span style={{ color: homeWon ? colors.text : colors.muted, fontWeight: homeWon ? 700 : 500 }}>
          {m.home.team.toUpperCase()} {fmt(m.home.score)}
        </span>
        <span style={{ color: colors.gold, margin: "0 18px" }}>•</span>
        <span style={{ color: homeWon ? colors.muted : colors.text, fontWeight: homeWon ? 500 : 700 }}>
          {m.away.team.toUpperCase()} {fmt(m.away.score)}
        </span>
        <span style={{ color: colors.red, marginLeft: 70 }}>◆</span>
      </span>
    );
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        translate: interpolate(frame, [0, 15], ["0px 90px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          background: "rgba(3, 8, 22, 0.94)",
          borderTop: `3px solid ${colors.gold}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            zIndex: 2,
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 36px",
            background: colors.red,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 30,
            color: "white",
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          WEEK {data.week} FINALS
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: body,
            fontSize: 32,
            letterSpacing: 1,
            translate: `${interpolate(frame, [0, 1], [60, 56], { extrapolateRight: "extend" })}px 0px`,
          }}
        >
          {items}
          {items}
          {items}
          {items}
        </div>
      </div>
    </AbsoluteFill>
  );
};
