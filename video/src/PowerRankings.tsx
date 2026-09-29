import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Fragment } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Ticker } from "./components/Ticker";
import { countdown } from "./data";
import { FinalBoard } from "./scenes/FinalBoard";
import { Headlines } from "./scenes/Headlines";
import { Intro } from "./scenes/Intro";
import { RankReveal } from "./scenes/RankReveal";
import { Scoreboard } from "./scenes/Scoreboard";
import { FINAL, HEADLINES, INTRO, REVEAL, REVEAL_TOP, SCOREBOARD, TRANSITION } from "./theme";

const timing = linearTiming({ durationInFrames: TRANSITION });

// Scenes: intro, scoreboard, headlines, one reveal per team, final board.
const sceneCount = 4 + countdown.length;
export const TOTAL_FRAMES =
  INTRO + SCOREBOARD + HEADLINES + (countdown.length - 1) * REVEAL + REVEAL_TOP + FINAL -
  (sceneCount - 1) * TRANSITION;

export const PowerRankings: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#07122b" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro" durationInFrames={INTRO}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence name="Final scores" durationInFrames={SCOREBOARD}>
          <Scoreboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
        <TransitionSeries.Sequence name="Headlines" durationInFrames={HEADLINES}>
          <Headlines />
        </TransitionSeries.Sequence>
        {countdown.map((team) => (
          <Fragment key={team.team}>
            <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
            <TransitionSeries.Sequence
              name={`#${team.rank} ${team.team}`}
              durationInFrames={team.rank === 1 ? REVEAL_TOP : REVEAL}
            >
              <RankReveal team={team} top={team.rank === 1} />
            </TransitionSeries.Sequence>
          </Fragment>
        ))}
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence name="Full board" durationInFrames={FINAL}>
          <FinalBoard />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Score crawl runs under everything after the intro */}
      <Sequence name="Ticker" from={INTRO - TRANSITION} layout="absolute-fill">
        <Ticker />
      </Sequence>
    </AbsoluteFill>
  );
};
