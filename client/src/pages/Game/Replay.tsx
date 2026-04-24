import {Color, GameStatus} from "@chess-bs/common";
import Timer from "../../components/Timer.tsx";
import Board from "../../components/Board.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import {useGameViewer} from "../../components/GameViewer.tsx";
import ReplayPlayerRuleList from "../../components/ReplayPlayerRuleList.tsx";
import {useAtomValue} from "jotai";
import {
    clockInfoAtom,
    playersAtom,
    startBoardAtom,
    turnHistoryAtom,
    viewAtom
} from "./atoms.ts";

function Replay() {
    const startBoard = useAtomValue(startBoardAtom);
    const turnHistory = useAtomValue(turnHistoryAtom);
    const players = useAtomValue(playersAtom);
    const view = useAtomValue(viewAtom);

    const clockInfo = useAtomValue(clockInfoAtom);
    // const clockTimes = useAtomValue(clockTimesAtom);

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove, clock } = useGameViewer(startBoard, turnHistory, clockInfo);

    const oppColor = view === Color.White ? Color.Black : Color.White;
    const playerRuleIds: Map<Color, number[]> = new Map(players.map(player => [player.color, player.ruleIds ?? []]));

    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-full"}>

            {/* Board */}
            <div className={"flex flex-1 flex-col justify-center min-w-0 max-w-[min(calc(80vh-50px),80vw)] "}>
                <div className={"flex flex-row shrink justify-between items-end "}>
                    <div className={"float-start text-white text-xl"}>{oppColor}</div>

                    <div className={"overflow-auto"}>
                        <ReplayPlayerRuleList color={oppColor} playerRuleIds={playerRuleIds.get(oppColor) ?? []} className={"pb-1"}/>
                    </div>

                    <Timer
                        clockMs={clock.get(oppColor)}
                        isRunning={false}
                    />
                </div>
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
                />
                }
                <div className={"flex flex-row shrink justify-between"}>
                    <div className={"float-start text-white text-xl"}>{view}</div>

                    <div className={"overflow-auto"}>
                        <ReplayPlayerRuleList color={view} playerRuleIds={playerRuleIds.get(view) ?? []} className={"pt-1"}/>
                    </div>


                    <Timer
                        clockMs={clock.get(view)}
                        isRunning={false}
                    />
                </div>

            </div>

            {/* Right Side */}
            <div className={"w-[300px] h-full "}>
                <div className={"flex flex-col rounded-md h-full bg-bg-2"}>
                    <TurnHistory
                        turnHistory={turnHistory}
                        viewMoveIndex={viewMoveIndex}
                        setViewMoveIndex={setViewMoveIndex}
                    />
                </div>
            </div>
        </div>
    </div>)
}


export default Replay;