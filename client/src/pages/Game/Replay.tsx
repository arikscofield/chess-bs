import {BOT_UUID, Color, GameStatus} from "@chess-bs/common";
import Timer from "../../components/Timer.tsx";
import Board from "../../components/Board.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import {useGameViewer} from "../../hooks/GameViewer.ts";
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
import {LuEye, LuListOrdered} from "react-icons/lu";
import PlayerBar from "../../components/PlayerBar.tsx";
import GamePanel from "../../components/GamePanel.tsx";
import OwnRules from "../../components/OwnRules.tsx";
import GameTabs from "../../components/GameTabs.tsx";

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

    const topColor: Color = view === undefined ? (Color.Black) : (view === Color.White ? Color.Black : Color.White)
    const bottomColor: Color = topColor === Color.White ? Color.Black : Color.White;

    function renderPlayerBar(color: Color) {
        const p = players.find(p => p.color === color);
        const clock = clockState.get(color);
        return <PlayerBar
            username={p?.username}
            color={color}
            isBot={p?.userId === BOT_UUID}
            materialEval={visibleBoard?.getPieceEval(color, true)}
            clock={clockInfo.usesClock && clock && <Timer baseMs={clock.baseMs} anchorMs={clock.anchorMs} isRunning={false}/>}
        />
    }

    const rulesPanel = <GamePanel title={"Players' rules"} icon={<LuEye size={14}/>} bodyClassName={"overflow-y-auto"}>
        {[Color.White, Color.Black].map(color => {
            const p = players.find(p => p.color === color);
            return <div key={color} className={"border-b border-white/5 last:border-b-0"}>
                <div className={"px-3 pt-2.5 text-sm font-semibold text-fg-2"}>
                    {p?.username ?? color} <span className={"font-normal text-fg-3"}>· {color}</span>
                </div>
                <OwnRules ruleIds={p?.ruleIds ?? []} color={color}/>
            </div>
        })}
    </GamePanel>

    const movesPanel = <GamePanel
        title={"Moves"}
        icon={<LuListOrdered size={14}/>}
        actions={<span className={"rounded-full bg-white/5 text-fg-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"}>Replay</span>}
    >
        <TurnHistory
            turnHistory={turnHistory}
            viewMoveIndex={viewMoveIndex}
            setViewMoveIndex={setViewMoveIndex}
            playerColor={Color.White}
            setView={setView}
        />
    </GamePanel>

    return (<div style={PLAY_AREA_STYLE} className={"flex flex-col min-h-(--play-h) w-full"}>
        <div className={"flex flex-col xl:flex-row gap-3 xl:gap-4 justify-center items-stretch xl:items-start min-h-(--play-h) xl:h-(--play-h)"}>

            {/* Left Side (desktop only) */}
            <div className={"hidden xl:block w-75 shrink-0 h-full"}>
                {rulesPanel}
            </div>

            {/* Board Area */}
            <div className={"flex flex-col items-center justify-center flex-1 w-full min-w-0 max-w-full xl:max-w-[min(calc(100dvh-140px),75vw)]"}>
                <div className={"w-full max-w-[min(100%,calc(100dvh-220px))] xl:max-w-[min(calc(100dvh-200px),65vw)] flex flex-col gap-1.5"}>
                    {renderPlayerBar(topColor)}

                    <div className={"w-full aspect-square ring-1 ring-white/5 rounded-sm"}>
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

                    {renderPlayerBar(bottomColor)}
                </div>
            </div>

            {/* Right Side (desktop only) */}
            <div className={"hidden xl:block w-80 shrink-0 h-full"}>
                {movesPanel}
            </div>

            {/* Mobile secondary content */}
            <div className={"xl:hidden"}>
                <GameTabs
                    defaultTab={"moves"}
                    tabs={[
                        {id: "moves", label: "Moves", content: movesPanel},
                        {id: "rules", label: "Revealed rules", content: rulesPanel},
                    ]}
                />
            </div>
        </div>
    </div>)
}


export default Replay;