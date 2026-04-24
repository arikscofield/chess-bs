import {Group, Panel, Separator} from "react-resizable-panels";
import RuleList from "../../components/RuleList.tsx";
import {MdOutlineDragIndicator} from "react-icons/md";
import {
    Color,
    type GameMoveSendRequest,
    getMoveNotation,
    type Move,
    type PlayerDTO
} from "@chess-bs/common";
import OwnRules from "../../components/OwnRules.tsx";
import Board from "../../components/Board.tsx";
import Timer from "../../components/Timer.tsx";
import CallBluffButton from "../../components/CallBluffButton.tsx";
import BluffButton from "../../components/BluffButton.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import {useAtom, useAtomValue, useSetAtom} from "jotai";
import {
    addTurnAtom,
    clockInfoAtom, drawOfferedColorAtom,
    gameIdAtom,
    gameResultAtom,
    gameResultReasonAtom,
    gameStatusAtom,
    isBluffingAtom,
    playerAtom,
    playersAtom,
    removeTurnAtom,
    rulePoolIdsAtom,
    startBoardAtom,
    turnColorAtom,
    turnHistoryAtom,
    viewAtom
} from "./atoms.ts";
import {useGameViewer} from "../../components/GameViewer.tsx";
import {useSocket} from "../../components/context/SocketContext.ts";
import {useEffect, useState} from "react";
import GameActions from "../../components/GameActions.tsx";

function Play() {
    const socket = useSocket();

    const gameId = useAtomValue(gameIdAtom);
    const startBoard = useAtomValue(startBoardAtom);
    const gameStatus = useAtomValue(gameStatusAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);
    const players = useAtomValue(playersAtom);
    const player = useAtomValue(playerAtom);
    const turnHistory = useAtomValue(turnHistoryAtom);
    const clockInfo = useAtomValue(clockInfoAtom);
    const gameResult = useAtomValue(gameResultAtom);
    const gameResultReason = useAtomValue(gameResultReasonAtom);

    const [view, setView] = useAtom(viewAtom);
    const [turnColor, setTurnColor] = useAtom(turnColorAtom);
    const [isBluffing, setIsBluffing] = useAtom(isBluffingAtom);
    const [drawOfferedColor, setDrawOfferedColor] = useAtom(drawOfferedColorAtom);

    const addTurn = useSetAtom(addTurnAtom);
    const removeTurn = useSetAtom(removeTurnAtom);

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory, clockInfo);

    const [opponent, setOpponent] = useState<PlayerDTO | null>(null)


    useEffect(() => {
        const oppColor = player?.color === Color.White ? Color.Black : Color.White;
        setOpponent(players.find(player => player.color === oppColor) ?? null);
    }, [player, players])


    function handleMove(move: Move) {
        if (!socket) {
            console.error("socket not connected");
            return;
        }

        if (!gameId) {
            console.error("Couldn't get game id to send move");
            return;
        }

        const payload: GameMoveSendRequest = {
            gameId: gameId,
            move: move,
        }

        if (visibleBoard)
            move.notation = getMoveNotation(visibleBoard, move);
        const oldTurnColor = turnColor;

        addTurn(move);
        setTurnColor(turnColor === Color.White ? Color.Black : Color.White);

        socket.emit("game:move:send", payload, (ok, message) => {
            if (!ok) {
                removeTurn(-1);
                setTurnColor(oldTurnColor);
                console.error(message);
            }

            setIsBluffing(false);
        })
    }

    const topColor: Color = view === undefined ? (player?.color === Color.White ? Color.Black : Color.White) : (view === Color.White ? Color.Black : Color.White)
    const bottomColor: Color = topColor === Color.White ? Color.Black : Color.White;


    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen text-white "}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>

            {/* Left Side*/}
            <div className={"w-[300px] h-full"}>
                <Group className={""}
                    // style={{ height: 'calc(90vh-50px)' }}
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
                    <div className={"float-start text-white text-xl"}>{view === player?.color || view === undefined ? opponent?.username : player?.username}</div>

                    <Timer
                        clockMs={players.find(p => p.color === topColor)?.clockMs}
                        isRunning={(view && view !== turnColor) || (view === undefined && player?.color !== turnColor)}
                    />
                </div>
                {visibleBoard !== null && player && <Board
                    board={visibleBoard}
                    gameStatus={gameStatus}
                    player={player}
                    view={view ?? player.color}
                    turn={turnColor}
                    canMove={viewMoveIndex == -1}
                    isBluffing={isBluffing}
                    handleMove={handleMove}
                    highlightedMove={highlightedMove}
                />
                }
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>{view === player?.color || view === undefined ? player?.username : opponent?.username}</div>
                    <div className={"flex flex-row justify-center gap-5 py-3"}>
                        <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                        <CallBluffButton gameId={gameId} />
                    </div>
                    <Timer
                        clockMs={players.find(p => p.color === bottomColor)?.clockMs}
                        isRunning={(view === turnColor) || (view === undefined && player?.color === turnColor)}
                    />
                </div>

            </div>

            {/* Right Side */}
            <div className={"hidden lg:block w-[300px] h-full"}>
                <Group className={""}
                    // style={{ height: 'calc(90vh-50px)' }}
                       orientation={"vertical"}
                       defaultLayout={{
                           "turn-history": 1.3,
                           "chat": 1
                       }}
                >
                    <Panel
                        id={"turn-history"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2 p-1"}>
                            <div className={"h-full"}>
                                <TurnHistory
                                    turnHistory={turnHistory}
                                    viewMoveIndex={viewMoveIndex}
                                    setViewMoveIndex={setViewMoveIndex}
                                    setView={setView}
                                    playerColor={player?.color ?? Color.White}
                                />
                            </div>

                            <div className={"flex flex-wrap w-full justify-between pt-2 pb-1"}>
                                <GameActions gameId={gameId}
                                             color={player?.color ?? Color.White}
                                             drawOfferedColor={drawOfferedColor}
                                             setDrawOfferedColor={setDrawOfferedColor}
                                             gameStatus={gameStatus}
                                             gameResult={gameResult}
                                             gameResultReason={gameResultReason}
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
                            gameId={gameId}
                        />
                    </Panel>
                </Group>


            </div>
        </div>
    </div>)
}


export default Play;