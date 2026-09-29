import { display } from "../theme";

// Circular team "logo" built from the team color and abbreviation.
export const Badge: React.FC<{ abbr: string; color: string; size: number }> = ({ abbr, color, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `radial-gradient(circle at 35% 30%, ${color}, ${color}aa 60%, #000000cc 100%)`,
      border: `${Math.max(3, size * 0.045)}px solid rgba(255,255,255,0.9)`,
      boxShadow: `0 0 ${size * 0.35}px ${color}88`,
      fontFamily: display,
      fontWeight: 700,
      fontSize: size * 0.3,
      color: "white",
      letterSpacing: size * 0.01,
      textShadow: "0 3px 8px rgba(0,0,0,0.5)",
    }}
  >
    {abbr}
  </div>
);
