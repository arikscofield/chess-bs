import {Group, Panel, Separator} from "react-resizable-panels";
import RuleList from "../../components/RuleList.tsx";
import {MdOutlineDragIndicator} from "react-icons/md";
import {
    Color,
    getMoveNotation,
    type Move,
} from "@chess-bs/common";
import OwnRules from "../../components/OwnRules.tsx";
import Board from "../../components/Board.tsx";
import {CallBluffButtonLocal} from "../../components/CallBluffButton.tsx";
import BluffButton from "../../components/BluffButton.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import {useAtom, useAtomValue, useSetAtom} from "jotai";
import {
    addTurnAtom,
    gameResultAtom,
    gameResultReasonAtom,
    gameStatusAtom,
    isBluffingAtom, isDragMoveAtom,
    playerAtom,
    rulePoolIdsAtom,
    startBoardAtom,
    turnColorAtom,
    turnHistoryAtom,
    viewAtom
} from "./atoms.ts";
import {useGameViewer} from "../../hooks/GameViewer.ts";
import GameActions from "../../components/GameActions.tsx";
import {usePieceAnimations} from "../../hooks/PieceAnimation.ts";

function Bot() {

    const startBoard = useAtomValue(startBoardAtom);
    const gameStatus = useAtomValue(gameStatusAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);
    const player = useAtomValue(playerAtom);
    const turnHistory = useAtomValue(turnHistoryAtom);
    const gameResult = useAtomValue(gameResultAtom);
    const gameResultReason = useAtomValue(gameResultReasonAtom);

    const [view, setView] = useAtom(viewAtom);
    const [turnColor, setTurnColor] = useAtom(turnColorAtom);
    const [isBluffing, setIsBluffing] = useAtom(isBluffingAtom);
    const [isDragMove, setIsDragMove] = useAtom(isDragMoveAtom);

    const addTurn = useSetAtom(addTurnAtom);

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory);
    const { activeAnimations, clearAnimations, hiddenSquares } = usePieceAnimations(turnHistory, viewMoveIndex, isDragMove);


    function handleMove(move: Move) {
        if (visibleBoard)
            move.notation = getMoveNotation(visibleBoard, move);
        move.timestamp = Date.now();

        addTurn(move);
        setTurnColor(turnColor === Color.White ? Color.Black : Color.White);
        setIsBluffing(false);
    }

    function handleCallBluff() {

    }

    const topColor: Color = view === undefined ? (player?.color === Color.White ? Color.Black : Color.White) : (view === Color.White ? Color.Black : Color.White)
    const bottomColor: Color = topColor === Color.White ? Color.Black : Color.White;


    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen text-white "}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>

            {/* Left Side*/}
            <div className={"w-[300px] h-full"}>
                <Group className={""}
                       orientation={"vertical"}
                       defaultLayout={{
                           "rule-pool": 1,
                           "own-rules": 1
                       }}
                >
                    <Panel
                        id={"rule-pool"}
                        minSize={"250px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2 "}>
                            <h3 className={"text-xl font-bold text-center"}>Game Rules</h3>
                            <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={player?.color || Color.White} onlyShowEnabled={true} wrapChips={true}/>
                        </div>
                    </Panel>

                    <Separator className={"flex flex-row justify-center h-4 my-1 outline-none bg-bg-2/50 hover:bg-bg-2"}>
                        <MdOutlineDragIndicator color={"gray"} className={"rotate-90"}/>
                    </Separator>

                    <Panel
                        id={"own-rules"}
                        minSize={"200px"}
                    >
                        <OwnRules ruleIds={player?.ruleIds ?? []} color={player?.color || Color.White}/>
                    </Panel>
                </Group>
            </div>

            {/* Board */}
            <div className={"relative flex flex-1 flex-col max-w-[min(calc(80vh-50px),80vw)]"}>
                <div className={"flex flex-row justify-between"}>
                    <div className={"flex text-start items-end text-white text-xl"}>{view === player?.color || view === undefined ? "Bot" : player?.username}</div>

                </div>
                {visibleBoard !== null && <Board
                    board={visibleBoard}
                    gameStatus={gameStatus}
                    player={null}
                    view={(view ?? player?.color) ?? Color.White}
                    turn={turnColor}
                    canMove={viewMoveIndex == -1}
                    isBluffing={isBluffing}
                    handleMove={handleMove}
                    highlightedMove={highlightedMove}
                    animations={activeAnimations}
                    hiddenSquares={hiddenSquares}
                    setIsDragMove={setIsDragMove}
                />}
                <div className={"flex flex-row justify-between"}>
                    <div className={"flex text-start items-start text-white text-xl"}>{view === player?.color || view === undefined ? player?.username : "Bot"}</div>
                    <div className={"flex flex-row justify-center gap-5 py-3"}>
                        <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                        <CallBluffButtonLocal
                            onCallBluff={handleCallBluff}
                            disabled={
                                turnColor !== player?.color ||
                                turnHistory.length === 0 ||
                                !("from" in (turnHistory.at(-1) ?? {}))
                            }
                        />
                    </div>
                </div>

            </div>

            {/* Right Side */}
            <div className={"hidden lg:block w-[300px] h-full"}>
                <Group className={""}
                       orientation={"vertical"}
                       defaultLayout={{
                           "turn-history": 1.5,
                           "chat": 1
                       }}
                >
                    <Panel
                        id={"turn-history"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2 p-1"}>
                            <div className={"flex-1 min-h-0"}>
                                <TurnHistory
                                    turnHistory={turnHistory}
                                    viewMoveIndex={viewMoveIndex}
                                    setViewMoveIndex={setViewMoveIndex}
                                    setView={setView}
                                    playerColor={player?.color ?? Color.White}
                                />
                            </div>

                            <div className={"shrink-0 w-full pt-2 pb-1"}>
                                <GameActions gameId={""}
                                             color={view ?? Color.White}
                                             drawOfferedColor={null}
                                             setDrawOfferedColor={() => {}}
                                             gameStatus={gameStatus}
                                             gameResult={gameResult}
                                             gameResultReason={gameResultReason}
                                             isSpectating={true}
                                />
                            </div>
                        </div>
                    </Panel>

                    <Separator className={"flex flex-row justify-center h-4 my-1 outline-none bg-bg-2/50 hover:bg-bg-2"}>
                        <MdOutlineDragIndicator color={"gray"} className={"rotate-90"}/>
                    </Separator>

                    <Panel
                        id={"chat"}
                        minSize={"100px"}
                    >
                        <Chatroom
                            gameId={""}
                            canSend={false}
                        />
                    </Panel>
                </Group>


            </div>
        </div>
    </div>)
}


export default Bot;