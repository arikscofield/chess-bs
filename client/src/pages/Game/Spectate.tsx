import {type CSSProperties, useEffect, useState} from "react";
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
import {useGameViewer} from "../../hooks/GameViewer.ts";
import GameActions from "../../components/GameActions.tsx";
import {usePieceAnimations} from "../../hooks/PieceAnimation.ts";
import {useClockState} from "../../hooks/LiveClock.ts";

const PLAY_AREA_STYLE = {
    "--play-h": "calc(100dvh - var(--app-shell-header-offset) - var(--app-shell-padding) * 2)",
} as CSSProperties;

type MobileTab = "rules" | "history" | "chat";

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

    const [mobileTab, setMobileTab] = useState<MobileTab>("history");

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory);
    const clockState = useClockState(turnHistory, clockInfo, -1);
    const { activeAnimations, hiddenSquares } = usePieceAnimations(turnHistory, viewMoveIndex);

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
    const topClock = clockState.get(topColor);
    const bottomClock = clockState.get(bottomColor);

    const mobileTabs: { id: MobileTab; label: string }[] = [
        { id: "rules", label: "Rules" },
        { id: "history", label: "History" },
        { id: "chat", label: "Chat" },
    ];

    return (<div style={PLAY_AREA_STYLE} className={"flex flex-col min-h-[var(--play-h)] w-full text-white"}>
        <div className={"flex flex-col xl:flex-row gap-3 xl:gap-5 justify-center items-stretch xl:items-start min-h-[var(--play-h)] xl:h-[var(--play-h)]"}>

            {/* Left Side (desktop only)*/}
            <div className={"hidden xl:block w-[300px] h-full"}>
                <Group orientation={"vertical"}
                       defaultLayout={{
                           "rule-pool": 1,
                       }}
                >
                    <Panel id={"rule-pool"} minSize={"250px"}>
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10"}>
                            <h3 className={"text-base font-semibold text-center pt-2 text-gray-300 uppercase "}>Game Rules</h3>
                            <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={view ?? Color.White} onlyShowEnabled={true} wrapChips={true}/>
                        </div>
                    </Panel>
                </Group>
            </div>

            {/* Board Area */}
            <div className={"flex flex-col items-center justify-center flex-1 w-full min-w-0 max-w-full xl:max-w-[min(calc(100dvh_-_100px),75vw)]"}>

                {/* Top Player */}
                <div className={"flex flex-row justify-between w-full mb-0.5"}>
                    <div className={"flex flex-row justify-center items-end gap-1"}>
                        {/* Player Name*/}
                        <p className={"text-base font-semibold"}>{players.find(p => p.color === topColor)?.username ?? topColor}</p>
                        {/* Piece Eval */}
                        <p className={"text-sm text-gray-400 "}>{visibleBoard?.getPieceEval(topColor, true)}</p>
                    </div>

                    {clockInfo.usesClock && topClock && <Timer
                        baseMs={topClock.baseMs}
                        anchorMs={topClock.anchorMs}
                        isRunning={gameStatus !== GameStatus.DONE && topClock.running}
                    />}
                </div>

                {/* Board */}
                <div className={"w-full max-w-[min(92vw,calc(100dvh_-_240px))] xl:max-w-[min(calc(100dvh_-_180px),65vw)] aspect-square"}>
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
                        animations={activeAnimations}
                        hiddenSquares={hiddenSquares}
                    />}
                </div>

                {/* Bottom Player */}
                <div className={"flex flex-row justify-between w-full mt-1"}>
                    <div className={"flex flex-row justify-center items-start gap-1"}>
                        {/* Player Name*/}
                        <p className={"text-base font-semibold"}>{players.find(p => p.color === bottomColor)?.username ?? bottomColor}</p>
                        {/* Piece Eval */}
                        <p className={"text-sm text-gray-400 "}>{visibleBoard?.getPieceEval(bottomColor, true)}</p>
                    </div>

                    {clockInfo.usesClock && bottomClock && <Timer
                        baseMs={bottomClock.baseMs}
                        anchorMs={bottomClock.anchorMs}
                        isRunning={gameStatus !== GameStatus.DONE && bottomClock.running}
                    />}
                </div>

            </div>

            {/* Right Side (desktop only) */}
            <div className={"hidden xl:block w-[300px] h-full"}>
                <Group orientation={"vertical"}
                       defaultLayout={{
                           "turn-history": 1.3,
                           "chat": 1
                       }}
                >
                    <Panel
                        id={"turn-history"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
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
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
                            <h3 className={"text-base font-semibold text-center pt-1 text-gray-300 uppercase "}>Chat</h3>
                            <Chatroom
                                gameId={gameId}
                                canSend={false}
                            />
                        </div>
                    </Panel>
                </Group>


            </div>

            {/* Mobile secondary content: tabbed Rules / History / Chat */}
            <div className={"xl:hidden flex flex-col w-full mt-3"}>
                <div className={"flex flex-row gap-1 mb-2"}>
                    {mobileTabs.map(({ id, label }) => (
                        <button
                            key={id}
                            type={"button"}
                            onClick={() => setMobileTab(id)}
                            className={`flex-1 min-h-11 rounded-lg text-sm font-semibold uppercase transition-colors ${
                                mobileTab === id ? "bg-bg-2 text-white" : "bg-bg-2/40 text-gray-400 hover:bg-bg-2/70"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className={"h-[50dvh] min-h-[300px]"}>
                    {mobileTab === "rules" && (
                        <div className={"flex flex-col gap-2 h-full overflow-y-auto"}>
                            <div className={"flex flex-col rounded-lg bg-bg-2 border border-white/10"}>
                                <h3 className={"text-base font-semibold text-center pt-2 text-gray-300 uppercase "}>Game Rules</h3>
                                <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={view ?? Color.White} onlyShowEnabled={true} wrapChips={true}/>
                            </div>
                        </div>
                    )}

                    {mobileTab === "history" && (
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
                            <div className={"flex-1 min-h-0"}>
                                <TurnHistory
                                    turnHistory={turnHistory}
                                    viewMoveIndex={viewMoveIndex}
                                    setViewMoveIndex={setViewMoveIndex}
                                    setView={setView}
                                    playerColor={view ?? Color.White}
                                />
                            </div>
                        </div>
                    )}

                    {mobileTab === "chat" && (
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
                            <h3 className={"text-base font-semibold text-center pt-1 text-gray-300 uppercase "}>Chat</h3>
                            <Chatroom
                                gameId={gameId}
                                canSend={false}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>)
}


export default Spectate;