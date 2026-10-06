import "./index.css";
import { Composition, Folder } from "remotion";
import { countdown } from "./data";
import { PowerRankings, TOTAL_FRAMES } from "./PowerRankings";
import { FULL_TOTAL_FRAMES, PowerRankingsFull } from "./PowerRankingsFull";
import { BoardShift } from "./scenes/BoardShift";
import { FinalBoard } from "./scenes/FinalBoard";
import { Headlines } from "./scenes/Headlines";
import { Intro } from "./scenes/Intro";
import { RankReveal } from "./scenes/RankReveal";
import { Scoreboard } from "./scenes/Scoreboard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Default: ~24s short format */}
      <Composition
        id="PowerRankings"
        component={PowerRankings}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Long format: one reveal per team (needs blurbs in league.json) */}
      <Composition
        id="PowerRankingsFull"
        component={PowerRankingsFull}
        durationInFrames={FULL_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition id="Intro" component={Intro} durationInFrames={90} fps={30} width={1920} height={1080} />
        <Composition id="Scoreboard" component={Scoreboard} durationInFrames={210} fps={30} width={1920} height={1080} />
        <Composition id="BoardShift" component={BoardShift} durationInFrames={450} fps={30} width={1920} height={1080} />
        <Composition id="Headlines" component={Headlines} durationInFrames={270} fps={30} width={1920} height={1080} />
        <Composition
          id="RankReveal"
          component={RankReveal}
          durationInFrames={135}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ team: countdown[0], top: false }}
        />
        <Composition
          id="NumberOne"
          component={RankReveal}
          durationInFrames={210}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ team: countdown[countdown.length - 1], top: true }}
        />
        <Composition id="FinalBoard" component={FinalBoard} durationInFrames={180} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
