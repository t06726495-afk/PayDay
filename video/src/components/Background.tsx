import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// Deep navy studio backdrop with slowly drifting light streaks.
export const Background: React.FC<{ accent?: string }> = ({ accent = "#1f4fd6" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 70% 30%, ${accent}55 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, #d7263d33 0%, transparent 50%), linear-gradient(160deg, #0b1a3d 0%, #07122b 55%, #040a1a 100%)`,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: -400,
            left: 0,
            width: 180 + i * 90,
            height: 2200,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            rotate: "25deg",
            translate: `${interpolate(frame, [0, 600], [-600 + i * 700, 1400 + i * 700], {
              extrapolateRight: "extend",
            }) % 2800 - 400}px 0px`,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "linear-gradient(180deg, transparent 0%, black 40%, black 70%, transparent 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
