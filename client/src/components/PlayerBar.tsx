import type {ReactNode} from "react";
import {Tooltip} from "@mantine/core";
import {Color} from "@chess-bs/common";
import {FaRobot} from "react-icons/fa";
import {LuVenetianMask} from "react-icons/lu";
import {pieceImages} from "../assets/pieceImages.ts";


/**
 * One player's row above/below the board: avatar, name, connection status,
 * material advantage, whose-turn indicator, and (optionally) a clock.
 */
function PlayerBar({username, color, isTurn = false, isSelf = false, isBot = false, isBluffing = false, connected, materialEval, clock, children}: {
    username: string | undefined,
    color: Color,
    isTurn?: boolean,
    isSelf?: boolean,
    isBot?: boolean,
    isBluffing?: boolean,
    /** undefined hides the connection indicator */
    connected?: boolean,
    materialEval?: string | number,
    clock?: ReactNode,
    children?: ReactNode,
}) {
    return (<div className={`flex flex-row items-center gap-2.5 w-full rounded-lg px-2 py-1.5 transition-colors duration-300 border
        ${isTurn ? "bg-fg-1/10 border-fg-1/40" : "bg-transparent border-transparent"}`}
    >
        {/* Avatar */}
        <div className={`relative shrink-0 flex items-center justify-center w-9 h-9 rounded-md
            ${color === Color.White ? "bg-[#f0f0f0]" : "bg-[#2a2a2a] ring-1 ring-white/15"}`}
        >
            {isBot
                ? <FaRobot size={18} className={color === Color.White ? "text-neutral-700" : "text-neutral-200"}/>
                : <img src={pieceImages[color + "King"]} alt={color} width={28} height={28} draggable={false}/>}
            {connected !== undefined && <Tooltip label={connected ? "Connected" : "Disconnected"}>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-1 transition-colors duration-500
                    ${connected ? "bg-success" : "bg-fg-3/60"}`}
                />
            </Tooltip>}
        </div>

        {/* Name + eval */}
        <div className={"flex flex-col min-w-0 flex-1 leading-tight"}>
            <div className={"flex flex-row items-center gap-1.5 min-w-0"}>
                <span className={"font-semibold text-fg-2 truncate"}>{username ?? color}</span>
                {isSelf && <span className={"text-[10px] font-semibold uppercase tracking-wide text-fg-3 bg-white/5 rounded px-1.5 py-0.5"}>You</span>}
                {isBot && <span className={"text-[10px] font-semibold uppercase tracking-wide text-fg-3 bg-white/5 rounded px-1.5 py-0.5"}>Bot</span>}
            </div>
            <div className={"flex flex-row items-center gap-2 h-4 text-xs text-fg-3"}>
                {isBluffing
                    ? <span className={"inline-flex items-center gap-1 font-semibold text-orange-400"}>
                        <LuVenetianMask size={13}/>
                        Bluffing: any move goes
                    </span>
                    : isTurn
                        ? <span className={"inline-flex items-center gap-1.5 font-medium text-fg-1"}>
                        <span className={"w-1.5 h-1.5 rounded-full bg-fg-1 animate-turn-pulse"}/>
                            {isSelf ? "Your move" : "To move"}
                    </span>
                        : <span className={"capitalize"}>{color.toLowerCase()}</span>}
                {materialEval ? <span className={"tabular text-fg-3/90"}>{materialEval}</span> : null}
            </div>
        </div>

        {children}

        {clock}
    </div>)
}

export default PlayerBar;
