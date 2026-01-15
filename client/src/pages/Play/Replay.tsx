import {Color, GameStatus, type ReplayTimerInfo, type Turn} from "@chess-bs/common";
import Timer from "../../components/Timer.tsx";
import Board from "../../components/Board.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import {type RefObject, useState} from "react";
import {useGameViewer} from "../../components/GameViewer.tsx";
import BoardClass from "@chess-bs/common/dist/board.js";
import ReplayPlayerRuleList from "../../components/ReplayPlayerRuleList.tsx";

function Replay(
    {startBoard, turnHistory, playerRuleIds, replayTimerInfo=undefined}:
    {startBoard: BoardClass, turnHistory: RefObject<Turn[]>, playerRuleIds: Record<Color, number[]>, replayTimerInfo?: ReplayTimerInfo }) {
    const [view, setView] = useState<Color>(Color.White);
    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove, timersMs } = useGameViewer(startBoard, turnHistory.current, replayTimerInfo);

    const oppColor = view === Color.White ? Color.Black : Color.White;

    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-full"}>

            {/* Board */}
            <div className={"flex flex-1 flex-col justify-center min-w-0 max-w-[min(calc(80vh-50px),80vw)] "}>
                <div className={"flex flex-row shrink justify-between items-end "}>
                    <div className={"float-start text-white text-xl"}>{oppColor}</div>

                    <div className={"overflow-auto"}>
                        <ReplayPlayerRuleList color={oppColor} playerRuleIds={playerRuleIds[oppColor]} className={"pb-1"}/>
                    </div>

                    <Timer
                        timeMs={timersMs?.[oppColor]}
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
                    animateMove={false}
                />
                }
                <div className={"flex flex-row shrink justify-between"}>
                    <div className={"float-start text-white text-xl"}>{view}</div>

                    <div className={"overflow-auto"}>
                        <ReplayPlayerRuleList color={view} playerRuleIds={playerRuleIds[view]} className={"pt-1"}/>
                    </div>


                    <Timer
                        timeMs={timersMs?.[view]}
                        isRunning={false}
                    />
                </div>

            </div>

            {/* Right Side */}
            <div className={"w-[300px] h-full "}>
                <div className={"flex flex-col rounded-md h-full bg-bg-2"}>
                    <TurnHistory
                        turnHistory={turnHistory.current}
                        viewMoveIndex={viewMoveIndex}
                        setViewMoveIndex={setViewMoveIndex}
                        setView={setView}
                    />
                </div>
            </div>
        </div>
    </div>)
}


export default Replay;