import {useEffect} from "react";
import {useSocket} from "../../components/context/SocketContext.ts";
import {Color, type GameSpectateRequest, GameStatus, type GenericCallback} from "@chess-bs/common"
import {useAtom, useAtomValue} from "jotai";
import {
    clockInfoAtom,
    gameIdAtom, gameResultAtom, gameResultReasonAtom,
    gameStatusAtom,
    playersAtom,
    rulePoolIdsAtom, startBoardAtom, turnColorAtom,
    turnHistoryAtom,
    viewAtom
} from "./atoms.ts";
import {useNavigate} from "react-router";
import {Group, Panel, Separator} from "react-resizable-panels";
import RuleList from "../../components/RuleList.tsx";
import {MdOutlineDragIndicator} from "react-icons/md";
import Timer from "../../components/Timer.tsx";
import Board from "../../components/Board.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import {useLiveClock} from "../../components/LiveClock.tsx";
import {useGameViewer} from "../../components/GameViewer.tsx";
import GameActions from "../../components/GameActions.tsx";


function Spectate() {
    const navigate = useNavigate();
    const socket = useSocket();

    const gameId = useAtomValue(gameIdAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);
    const turnHistory = useAtomValue(turnHistoryAtom);
    const clockInfo = useAtomValue(clockInfoAtom);
    const gameStatus = useAtomValue(gameStatusAtom);
    const turnColor = useAtomValue(turnColorAtom);
    const startBoard = useAtomValue(startBoardAtom);
    const players = useAtomValue(playersAtom);
    const gameResult = useAtomValue(gameResultAtom);
    const gameResultReason = useAtomValue(gameResultReasonAtom);

    const [view, setView] = useAtom(viewAtom);

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory);
    const liveClocks = useLiveClock(turnHistory.filter(t => t.timestamp), clockInfo, true, -1, gameStatus);

    useEffect(() => {
        if (!socket) return;

        const payload: GameSpectateRequest = {
            gameId: gameId,
        }

        socket.emit("game:spectate", payload, ((ok, message) => {
            if (!ok) {
                console.error(message);
                navigate("/");
                return;
            }

        }) as GenericCallback)
    }, [socket]);


    const topColor: Color = view === undefined ? (Color.Black) : (view === Color.White ? Color.Black : Color.White)
    const bottomColor: Color = topColor === Color.White ? Color.Black : Color.White;

    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>

            {/* Left Side*/}
            <div className={"w-[300px] h-full"}>
                <Group className={""}
                       orientation={"vertical"}
                       defaultLayout={{
                           "rule-pool": 1,
                       }}
                >
                    <Panel
                        id={"rule-pool"}
                        minSize={"250px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2 "}>
                            <h3 className={"text-white text-xl font-bold text-center"}>Game Rules</h3>
                            <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={view ?? Color.White} onlyShowEnabled={true} wrapChips={true}/>
                        </div>
                    </Panel>
                </Group>
            </div>

            {/* Board */}
            <div className={"relative flex flex-1 flex-col max-w-[min(calc(80vh-50px),80vw)]"}>
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>{players.find(p => p.color === topColor)?.username ?? topColor}</div>

                    {clockInfo.usesClock && <Timer
                        clockMs={liveClocks.get(topColor)}
                        isRunning={gameStatus !== GameStatus.DONE && ((view && view !== turnColor) || (view === undefined && turnColor === topColor))}
                    />}
                </div>
                {visibleBoard !== null && <Board
                    board={visibleBoard}
                    gameStatus={gameStatus}
                    player={null}
                    view={view ?? Color.White}
                    turn={turnColor}
                    canMove={false}
                    isBluffing={false}
                    handleMove={() => {}}
                    highlightedMove={highlightedMove}
                />}
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>{players.find(p => p.color === bottomColor)?.username ?? bottomColor}</div>
                    {clockInfo.usesClock && <Timer
                        clockMs={liveClocks.get(bottomColor)}
                        isRunning={gameStatus !== GameStatus.DONE && ((view === turnColor) || (view === undefined && turnColor === bottomColor))}
                    />}
                </div>

            </div>

            {/* Right Side */}
            <div className={"hidden lg:block w-[300px] h-full"}>
                <Group className={""}
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
                            <div className={"flex-1 min-h-0"}>
                                <TurnHistory
                                    turnHistory={turnHistory}
                                    viewMoveIndex={viewMoveIndex}
                                    setViewMoveIndex={setViewMoveIndex}
                                    setView={setView}
                                    playerColor={view ?? Color.White}
                                />
                            </div>

                            <div className={"shrink-0 w-full pt-2 pb-1"}>
                                <GameActions gameId={gameId}
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
                            gameId={gameId}
                            canSend={false}
                        />
                    </Panel>
                </Group>


            </div>
        </div>
    </div>)
}


export default Spectate;