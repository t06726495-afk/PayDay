import { colors, display } from "../theme";

// Up / down / no-change badge for movement since last week.
export const Movement: React.FC<{ change: number; size?: number }> = ({ change, size = 1 }) => {
  const color = change > 0 ? colors.up : change < 0 ? colors.down : colors.flat;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10 * size,
        color,
        fontFamily: display,
        fontWeight: 700,
        fontSize: 44 * size,
        lineHeight: 1,
      }}
    >
      <svg width={40 * size} height={40 * size} viewBox="0 0 40 40">
        {change > 0 ? (
          <polygon points="20,4 38,34 2,34" fill={color} />
        ) : change < 0 ? (
          <polygon points="20,36 38,6 2,6" fill={color} />
        ) : (
          <rect x="4" y="16" width="32" height="8" rx="3" fill={color} />
        )}
      </svg>
      {change === 0 ? null : Math.abs(change)}
    </div>
  );
};
