import {type CSSProperties, useEffect} from "react";
import {useSocket} from "../../components/context/SocketContext.ts";
import {BOT_UUID, Color, type GameSpectateRequest, GameStatus, type GenericCallback} from "@chess-bs/common"
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
import {Group, Panel} from "react-resizable-panels";
import RuleList from "../../components/RuleList.tsx";
import Timer from "../../components/Timer.tsx";
import Board from "../../components/Board.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import {useGameViewer} from "../../hooks/GameViewer.ts";
import GameActions from "../../components/GameActions.tsx";
import {usePieceAnimations} from "../../hooks/PieceAnimation.ts";
import {useClockState} from "../../hooks/LiveClock.ts";
import {LuEye, LuLayers, LuListOrdered, LuMessageSquare} from "react-icons/lu";
import PlayerBar from "../../components/PlayerBar.tsx";
import GamePanel from "../../components/GamePanel.tsx";
import PanelSeparator from "../../components/PanelSeparator.tsx";
import GameTabs from "../../components/GameTabs.tsx";

const PLAY_AREA_STYLE = {
    "--play-h": "calc(100dvh - var(--app-shell-header-offset) - var(--app-shell-padding) * 2)",
} as CSSProperties;

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

    const gameRunning = gameStatus !== GameStatus.DONE;

    function renderPlayerBar(color: Color, clock: ReturnType<typeof clockState.get>) {
        const p = players.find(p => p.color === color);
        const isBot = p?.userId === BOT_UUID;
        return <PlayerBar
            username={p?.username}
            color={color}
            isBot={isBot}
            isTurn={gameRunning && turnColor === color}
            materialEval={visibleBoard?.getPieceEval(color, true)}
            clock={clockInfo.usesClock && clock && <Timer
                baseMs={clock.baseMs}
                anchorMs={clock.anchorMs}
                isRunning={gameRunning && clock.running}
            />}
        />
    }

    const spectatingBadge = <span className={"inline-flex items-center gap-1.5 rounded-full bg-danger/15 text-red-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"}>
        <span className={"w-1.5 h-1.5 rounded-full bg-red-400 animate-turn-pulse"}/>
        {gameRunning ? "Live" : "Ended"}
    </span>

    const rulePoolPanel = <GamePanel title={"Rule pool"} icon={<LuLayers size={14}/>}>
        <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={view ?? Color.White} onlyShowEnabled={true} wrapChips={true}/>
    </GamePanel>

    const movesPanel = <GamePanel title={"Moves"} icon={<LuListOrdered size={14}/>} actions={spectatingBadge} bodyClassName={"flex flex-col"}>
        <div className={"flex-1 min-h-0"}>
            <TurnHistory
                turnHistory={turnHistory}
                viewMoveIndex={viewMoveIndex}
                setViewMoveIndex={setViewMoveIndex}
                setView={setView}
                playerColor={Color.White}
            />
        </div>
        {!gameRunning && <div className={"shrink-0 w-full p-2 border-t border-white/5"}>
            <GameActions gameId={gameId}
                         color={view ?? Color.White}
                         drawOfferedColor={null}
                         setDrawOfferedColor={() => {}}
                         gameStatus={gameStatus}
                         gameResult={gameResult}
                         gameResultReason={gameResultReason}
                         isSpectating={true}
            />
        </div>}
    </GamePanel>

    const chatPanel = <GamePanel title={"Chat"} icon={<LuMessageSquare size={14}/>}>
        <Chatroom gameId={gameId} canSend={false}/>
    </GamePanel>

    return (<div style={PLAY_AREA_STYLE} className={"flex flex-col min-h-(--play-h) w-full"}>
        <div className={"flex flex-col xl:flex-row gap-3 xl:gap-4 justify-center items-stretch xl:items-start min-h-(--play-h) xl:h-(--play-h)"}>

            {/* Left Side (desktop only)*/}
            <div className={"hidden xl:flex flex-col gap-3 w-75 shrink-0 h-full"}>
                <div className={"flex flex-row items-center gap-3 rounded-xl bg-bg-2/70 border border-white/5 px-3 py-2.5"}>
                    <LuEye size={18} className={"text-fg-1"}/>
                    <div className={"leading-tight"}>
                        <div className={"text-sm font-semibold text-fg-2"}>Spectating</div>
                        <div className={"text-xs text-fg-3"}>Players' secret rules stay hidden</div>
                    </div>
                </div>
                <div className={"flex-1 min-h-0"}>{rulePoolPanel}</div>
            </div>

            {/* Board Area */}
            <div className={"flex flex-col items-center justify-center flex-1 w-full min-w-0 max-w-full xl:max-w-[min(calc(100dvh-140px),75vw)]"}>
                <div className={"w-full max-w-[min(100%,calc(100dvh-220px))] xl:max-w-[min(calc(100dvh-200px),65vw)] flex flex-col gap-1.5"}>
                    {renderPlayerBar(topColor, topClock)}

                    <div className={"w-full aspect-square ring-1 ring-white/5 rounded-sm"}>
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

                    {renderPlayerBar(bottomColor, bottomClock)}
                </div>
            </div>

            {/* Right Side (desktop only) */}
            <div className={"hidden xl:block w-80 shrink-0 h-full"}>
                <Group orientation={"vertical"}
                       defaultLayout={{
                           "turn-history": 1.3,
                           "chat": 1
                       }}
                >
                    <Panel id={"turn-history"} minSize={"160px"}>
                        {movesPanel}
                    </Panel>
                    <PanelSeparator/>
                    <Panel id={"chat"} minSize={"100px"}>
                        {chatPanel}
                    </Panel>
                </Group>
            </div>

            {/* Mobile secondary content */}
            <div className={"xl:hidden"}>
                <GameTabs
                    defaultTab={"moves"}
                    tabs={[
                        {id: "rules", label: "Rules", content: rulePoolPanel},
                        {id: "moves", label: "Moves", content: movesPanel},
                        {id: "chat", label: "Chat", content: chatPanel},
                    ]}
                />
            </div>
        </div>
    </div>)
}


export default Spectate;