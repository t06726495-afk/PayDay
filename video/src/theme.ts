import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled in public/fonts so rendering works offline.
export const display = "Oswald";
export const body = "Barlow Condensed";

const fonts: [string, string][] = [
  [display, "500"],
  [display, "700"],
  [body, "500"],
  [body, "600"],
  [body, "700"],
];

for (const [family, weight] of fonts) {
  loadFont({
    family,
    weight,
    url: staticFile(`fonts/${family.replace(" ", "")}-${weight}.woff2`),
  });
}

export const colors = {
  navy: "#07122b",
  navyLight: "#10224d",
  panel: "rgba(10, 22, 52, 0.88)",
  gold: "#f5c542",
  red: "#e23b3b",
  up: "#2fd46b",
  down: "#ff4d4d",
  flat: "#9aa7c2",
  text: "#ffffff",
  muted: "#b7c3de",
};

export const FPS = 30;

// Scene lengths in frames.
export const INTRO = 4 * FPS;
export const SCOREBOARD = 8 * FPS;
export const HEADLINES = 9 * FPS;
export const REVEAL = 4.5 * FPS;
export const REVEAL_TOP = 7 * FPS;
export const FINAL = 6 * FPS;
export const TRANSITION = 12;
