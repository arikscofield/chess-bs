import {Color, GameStatus, nextTurnColor} from "@chess-bs/common";
import Timer from "../../components/Timer.tsx";
import Board from "../../components/Board.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import {useGameViewer} from "../../hooks/GameViewer.ts";
import ReplayPlayerRuleList from "../../components/ReplayPlayerRuleList.tsx";
import {useAtom, useAtomValue} from "jotai";
import {
    clockInfoAtom,
    playersAtom,
    startBoardAtom,
    turnHistoryAtom,
    viewAtom
} from "./atoms.ts";
import {usePieceAnimations} from "../../hooks/PieceAnimation.ts";
import {useClockState} from "../../hooks/LiveClock.ts";
import type {CSSProperties} from "react";

const PLAY_AREA_STYLE = {
    "--play-h": "calc(100dvh - var(--app-shell-header-offset) - var(--app-shell-padding) * 2)",
} as CSSProperties;

function Replay() {
    const startBoard = useAtomValue(startBoardAtom);
    const turnHistory = useAtomValue(turnHistoryAtom);
    const players = useAtomValue(playersAtom);
    const clockInfo = useAtomValue(clockInfoAtom);

    const [view, setView] = useAtom(viewAtom);

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory);
    const clockState = useClockState(turnHistory, clockInfo, viewMoveIndex);
    const { activeAnimations, hiddenSquares } = usePieceAnimations(turnHistory, viewMoveIndex);

    const playerRuleIds: Map<Color, number[]> = new Map(players.map(player => [player.color, player.ruleIds ?? []]));

    const topColor: Color = view === undefined ? (Color.Black) : (view === Color.White ? Color.Black : Color.White)
    const bottomColor: Color = topColor === Color.White ? Color.Black : Color.White;
    const topClock = clockState.get(topColor);
    const bottomClock = clockState.get(bottomColor);

    return (<div style={PLAY_AREA_STYLE} className={"flex flex-col min-h-[var(--play-h)] w-full text-white"}>
        <div className={"flex flex-col md:flex-row gap-3 lg:gap-5 justify-center items-stretch md:items-start min-h-[var(--play-h)] md:h-[var(--play-h)]"}>

            {/* Board Area */}
            <div className={"relative flex flex-1 flex-col max-w-[min(calc(80vh-50px),100vw)] md:max-w-[min(calc(80vh-50px),80vw)]"}>

                {/* Top Player */}
                <div className={"flex flex-row shrink justify-between w-full"}>
                    <div className={"flex flex-row justify-center items-end gap-1"}>
                        {/* Player Name*/}
                        <p className={"text-base font-semibold"}>{players.find(p => p.color === nextTurnColor(view || Color.White))?.username ?? nextTurnColor(view || Color.White)}</p>
                        {/* Piece Eval */}
                        <p className={"text-sm text-gray-400 "}>{visibleBoard?.getPieceEval(topColor, true)}</p>
                    </div>

                    <div className={"overflow-auto"}>
                        <ReplayPlayerRuleList color={topColor} playerRuleIds={playerRuleIds.get(topColor) ?? []} className={"pb-1"}/>
                    </div>

                    {clockInfo.usesClock && topClock && <Timer
                        baseMs={topClock.baseMs}
                        anchorMs={topClock.anchorMs}
                        isRunning={false}
                    />}
                </div>

                {/* Board */}
                <div className={"w-full max-w-[min(100vw,calc(100dvh_-_240px))] md:max-w-[min(calc(100dvh_-_180px),65vw)] aspect-square"}>
                    {visibleBoard !== null && <Board
                        board={visibleBoard}
                        gameStatus={GameStatus.DONE}
                        player={null}
                        view={view || Color.White}
                        turn={Color.White}
                        canMove={false}
                        isBluffing={false}
                        handleMove={() => {}}
                        highlightedMove={highlightedMove}
                        animations={activeAnimations}
                        hiddenSquares={hiddenSquares}
                    />}
                </div>

                {/* Bottom Player */}
                <div className={"flex flex-row shrink justify-between w-full"}>
                    <div className={"flex flex-row justify-center items-start gap-1"}>
                        {/* Player Name*/}
                        <p className={"text-base font-semibold"}>{players.find(p => p.color === bottomColor)?.username ?? (bottomColor)}</p>
                        {/* Piece Eval */}
                        <p className={"text-sm text-gray-400 "}>{visibleBoard?.getPieceEval(bottomColor, true)}</p>
                    </div>

                    <div className={"overflow-auto"}>
                        <ReplayPlayerRuleList color={bottomColor} playerRuleIds={playerRuleIds.get(bottomColor) ?? []} className={"pt-1"}/>
                    </div>


                    {clockInfo.usesClock && bottomClock && <Timer
                        baseMs={bottomClock.baseMs}
                        anchorMs={bottomClock.anchorMs}
                        isRunning={false}
                    />}
                </div>

            </div>

            {/* Right Side */}
            <div className={"w-full md:w-[300px] h-full max-h-[80vh]"}>
                <div className={"flex flex-col rounded-md h-full bg-bg-2"}>
                    <TurnHistory
                        turnHistory={turnHistory}
                        viewMoveIndex={viewMoveIndex}
                        setViewMoveIndex={setViewMoveIndex}
                        playerColor={Color.White}
                        setView={setView}
                    />
                </div>
            </div>
        </div>
    </div>)
}


export default Replay;