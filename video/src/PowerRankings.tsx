import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Ticker } from "./components/Ticker";
import { BoardShift } from "./scenes/BoardShift";
import { Intro } from "./scenes/Intro";
import { Scoreboard } from "./scenes/Scoreboard";
import { BOARD, SHORT_INTRO, SHORT_SCORES, TRANSITION } from "./theme";

const timing = linearTiming({ durationInFrames: TRANSITION });

export const TOTAL_FRAMES = SHORT_INTRO + SHORT_SCORES + BOARD - 2 * TRANSITION;

// Short format: intro, final scores, then last week's board shuffling into this week's.
export const PowerRankings: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#07122b" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro" durationInFrames={90}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence name="Final scores" durationInFrames={210}>
          <Scoreboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
        <TransitionSeries.Sequence name="Board shift" durationInFrames={450}>
          <BoardShift />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Sequence name="Ticker" from={SHORT_INTRO - TRANSITION} premountFor={fps} layout="absolute-fill">
        <Ticker />
      </Sequence>
    </AbsoluteFill>
  );
};
