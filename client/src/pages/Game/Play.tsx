import {Group, Panel} from "react-resizable-panels";
import RuleList from "../../components/RuleList.tsx";
import {
    BOT_UUID,
    Color,
    type GameMoveSendRequest, GameStatus,
    getMoveNotation,
    type Move,
    type PlayerDTO
} from "@chess-bs/common";
import OwnRules from "../../components/OwnRules.tsx";
import Board from "../../components/Board.tsx";
import Timer from "../../components/Timer.tsx";
import {CallBluffButtonOnline} from "../../components/CallBluffButton.tsx";
import BluffButton from "../../components/BluffButton.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import {useAtom, useAtomValue, useSetAtom} from "jotai";
import {
    addTurnAtom, addTurnTimestampAtom,
    clockInfoAtom, drawOfferedColorAtom,
    gameIdAtom,
    gameResultAtom,
    gameResultReasonAtom,
    gameStatusAtom,
    isBluffingAtom, isDragMoveAtom,
    playerAtom,
    playersAtom, playersConnectedAtom,
    removeTurnAtom,
    rulePoolIdsAtom,
    startBoardAtom,
    turnColorAtom,
    turnHistoryAtom,
    viewAtom
} from "./atoms.ts";
import {useGameViewer} from "../../hooks/GameViewer.ts";
import {useSocket} from "../../components/context/SocketContext.ts";
import {type CSSProperties, type ReactNode, useEffect, useState} from "react";
import GameActions from "../../components/GameActions.tsx";
import {useClockState} from "../../hooks/LiveClock.ts";
import {usePieceAnimations} from "../../hooks/PieceAnimation.ts";
import {useBluffHotkey} from "../../hooks/BluffHotkey.ts";
import PlayerBar from "../../components/PlayerBar.tsx";
import {LuKeyRound, LuLayers, LuListOrdered, LuMessageSquare} from "react-icons/lu";
import GamePanel from "../../components/GamePanel.tsx";
import PanelSeparator from "../../components/PanelSeparator.tsx";
import GameTabs from "../../components/GameTabs.tsx";

// Usable height inside AppShell.Main, derived from Mantine's own CSS vars
// (header height + top/bottom padding). Stays correct if you change either.
// dvh keeps the bottom row from being cut off by the mobile browser toolbar.
const PLAY_AREA_STYLE = {
    "--play-h": "calc(100dvh - var(--app-shell-header-offset) - var(--app-shell-padding) * 2)",
} as CSSProperties;

function Play() {
    const socket = useSocket();

    const gameId = useAtomValue(gameIdAtom);
    const startBoard = useAtomValue(startBoardAtom);
    const gameStatus = useAtomValue(gameStatusAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);
    const players = useAtomValue(playersAtom);
    const player = useAtomValue(playerAtom);
    const playersConnected = useAtomValue(playersConnectedAtom);
    const turnHistory = useAtomValue(turnHistoryAtom);
    const clockInfo = useAtomValue(clockInfoAtom);
    const gameResult = useAtomValue(gameResultAtom);
    const gameResultReason = useAtomValue(gameResultReasonAtom);

    const [view, setView] = useAtom(viewAtom);
    const [turnColor, setTurnColor] = useAtom(turnColorAtom);
    const [isBluffing, setIsBluffing] = useAtom(isBluffingAtom);
    const [drawOfferedColor, setDrawOfferedColor] = useAtom(drawOfferedColorAtom);
    const [isDragMove, setIsDragMove] = useAtom(isDragMoveAtom);

    const addTurn = useSetAtom(addTurnAtom);
    const removeTurn = useSetAtom(removeTurnAtom);
    const addTurnTimestamp = useSetAtom(addTurnTimestampAtom);

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory);
    const clockState = useClockState(turnHistory, clockInfo, -1);
    const { activeAnimations, clearAnimations, hiddenSquares } = usePieceAnimations(turnHistory, viewMoveIndex, isDragMove);

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

        socket.emit("game:move:send", payload, (ok, message, appliedAt) => {
            if (!ok) {
                removeTurn(-1);
                setTurnColor(oldTurnColor);
                clearAnimations();
                console.error(message);
            }

            setIsBluffing(false);
            if (appliedAt) addTurnTimestamp(appliedAt, -1);
        })
    }

    function isConnected(p: PlayerDTO | null) {
        if (!p) return false;
        if (p.userId === BOT_UUID) return true;
        return p.color === player?.color ? !!socket : playersConnected.has(p.userId);
    }

    const topPlayer: PlayerDTO | null = (view === undefined || view === player?.color) ? opponent : player;
    const bottomPlayer: PlayerDTO | null = topPlayer?.color === opponent?.color ? player : opponent;
    const topColor: Color = topPlayer?.color ?? Color.Black;
    const bottomColor: Color = bottomPlayer?.color ?? Color.White;
    const topClock = clockState.get(topColor);
    const bottomClock = clockState.get(bottomColor);

    const bluffCallDisabled =
        turnColor !== player?.color ||
        turnHistory.length === 0 ||
        !("from" in (turnHistory.at(-1) ?? {}));

    const gameRunning = gameStatus !== GameStatus.DONE;
    const isMyTurn = gameRunning && turnColor === player?.color;

    useBluffHotkey(setIsBluffing, gameRunning);

    // Tab title cue when it's your move
    useEffect(() => {
        const baseTitle = document.title.replace(/^Your turn · /, "");
        document.title = isMyTurn ? `Your turn · ${baseTitle}` : baseTitle;
        return () => { document.title = baseTitle; };
    }, [isMyTurn]);

    function renderPlayerBar(p: PlayerDTO | null, color: Color, clock: ReturnType<typeof clockState.get>, extra?: ReactNode) {
        const isSelf = p?.color === player?.color;
        return <PlayerBar
            username={p?.username}
            color={color}
            isSelf={isSelf}
            isBot={p?.userId === BOT_UUID}
            isTurn={gameRunning && turnColor === color}
            isBluffing={isSelf && isBluffing}
            connected={p?.userId === BOT_UUID ? undefined : isConnected(p)}
            materialEval={visibleBoard?.getPieceEval(color, true)}
            clock={clockInfo.usesClock && clock && <Timer
                baseMs={clock.baseMs}
                anchorMs={clock.anchorMs}
                isRunning={gameRunning && clock.running}
            />}
        >
            {extra}
        </PlayerBar>
    }

    const bluffControls = <>
        <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing} disabled={!gameRunning}/>
        <CallBluffButtonOnline
            gameId={gameId}
            disabled={bluffCallDisabled || !gameRunning}
        />
    </>

    const ownRulesPanel = <GamePanel title={"Your secret rules"} icon={<LuKeyRound size={14}/>}>
        <OwnRules ruleIds={player?.ruleIds ?? []} color={player?.color || Color.White}/>
    </GamePanel>

    const rulePoolPanel = <GamePanel title={"Rule pool"} icon={<LuLayers size={14}/>}>
        <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={player?.color || Color.White} onlyShowEnabled={true} wrapChips={true}/>
    </GamePanel>

    const movesPanel = <GamePanel title={"Moves"} icon={<LuListOrdered size={14}/>} bodyClassName={"flex flex-col"}>
        <div className={"flex-1 min-h-0"}>
            <TurnHistory
                turnHistory={turnHistory}
                viewMoveIndex={viewMoveIndex}
                setViewMoveIndex={setViewMoveIndex}
                setView={setView}
                playerColor={player?.color ?? Color.White}
            />
        </div>
        <div className={"shrink-0 w-full p-2 border-t border-white/5"}>
            <GameActions gameId={gameId}
                         color={player?.color ?? Color.White}
                         drawOfferedColor={drawOfferedColor}
                         setDrawOfferedColor={setDrawOfferedColor}
                         gameStatus={gameStatus}
                         gameResult={gameResult}
                         gameResultReason={gameResultReason}
            />
        </div>
    </GamePanel>

    const chatPanel = <GamePanel title={"Chat"} icon={<LuMessageSquare size={14}/>}>
        <Chatroom gameId={gameId}/>
    </GamePanel>

    return (<div style={PLAY_AREA_STYLE} className={"flex flex-col min-h-(--play-h) w-full"}>

        <div className={"flex flex-col xl:flex-row gap-3 xl:gap-4 justify-center items-stretch xl:items-start min-h-(--play-h) xl:h-(--play-h)"}>

            {/* Left Side (desktop only) */}
            <div className={"hidden xl:block w-75 shrink-0 h-full"}>
                <Group orientation={"vertical"}
                       defaultLayout={{
                           "own-rules": 1,
                           "rule-pool": 1.2,
                       }}
                >
                    <Panel id={"own-rules"} minSize={"100px"}>
                        {ownRulesPanel}
                    </Panel>
                    <PanelSeparator/>
                    <Panel id={"rule-pool"} minSize={"100px"}>
                        {rulePoolPanel}
                    </Panel>
                </Group>
            </div>

            {/* Board Area */}
            <div className={"flex flex-col items-center justify-center gap-1.5 flex-1 w-full min-w-0 max-w-full xl:max-w-[min(calc(100dvh-140px),75vw)]"}>
                <div className={"w-full max-w-[min(100%,calc(100dvh-260px))] xl:max-w-[min(calc(100dvh-200px),65vw)] flex flex-col gap-1.5"}>

                    {/* Top Player */}
                    {renderPlayerBar(topPlayer, topColor, topClock)}

                    {/* Board */}
                    <div className={`w-full aspect-square rounded-sm transition-shadow duration-300
                        ${isBluffing ? "ring-4 ring-orange-500/70 shadow-[0_0_40px_-8px] shadow-orange-500/50" : "ring-1 ring-white/5"}`}
                    >
                        {visibleBoard !== null && player && <Board
                            board={visibleBoard}
                            gameStatus={gameStatus}
                            player={player}
                            view={view ?? player.color}
                            turn={turnColor}
                            canMove={viewMoveIndex == -1 || viewMoveIndex == turnHistory.length}
                            isBluffing={isBluffing}
                            handleMove={handleMove}
                            highlightedMove={highlightedMove}
                            animations={activeAnimations}
                            hiddenSquares={hiddenSquares}
                            setIsDragMove={setIsDragMove}
                        />}
                    </div>

                    {/* Bottom Player */}
                    {renderPlayerBar(bottomPlayer, bottomColor, bottomClock,
                        <div className={"hidden xl:flex flex-row gap-2"}>{bluffControls}</div>
                    )}

                    {/* Mobile bluff controls */}
                    <div className={"xl:hidden grid grid-cols-2 gap-2 w-full *:min-h-11"}>
                        {bluffControls}
                    </div>
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
                    <Panel id={"turn-history"} minSize={"100px"}>
                        {movesPanel}
                    </Panel>
                    <PanelSeparator/>
                    <Panel id={"chat"} minSize={"100px"}>
                        {chatPanel}
                    </Panel>
                </Group>
            </div>

            {/* Mobile secondary content: tabbed Rules / History / Chat */}
            <div className={"xl:hidden"}>
                <GameTabs
                    defaultTab={"moves"}
                    tabs={[
                        {id: "rules", label: "Rules", content: <div className={"flex flex-col gap-2 h-full"}>
                                <div className={"flex-[1.2] min-h-0"}>{ownRulesPanel}</div>
                                <div className={"flex-1 min-h-0"}>{rulePoolPanel}</div>
                            </div>},
                        {id: "moves", label: "Moves", content: movesPanel},
                        {id: "chat", label: "Chat", content: chatPanel},
                    ]}
                />
            </div>
        </div>
    </div>)
}


export default Play;