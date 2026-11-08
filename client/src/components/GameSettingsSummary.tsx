import type {ReactNode} from "react";
import {useAtomValue} from "jotai";
import {LuClock, LuKeyRound, LuShieldAlert} from "react-icons/lu";
import {BluffPunishment, Color} from "@chess-bs/common";
import {
    bluffPunishmentAtom,
    clockIncrementMsAtom,
    clockStartMsAtom,
    ruleCountAtom,
    usesClockAtom,
} from "../pages/Game/atoms.ts";
import {pieceImages} from "../assets/pieceImages.ts";
import {BLUFF_PUNISHMENT_LABELS, formatTimeControlLong} from "../utils/const.ts";


function Tile({icon, label, value}: { icon: ReactNode, label: string, value: ReactNode }) {
    return <div className={"flex flex-row items-center gap-3 rounded-lg bg-bg-1/50 border border-white/5 px-3 py-2.5 min-w-0"}>
        <div className={"shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-fg-1/15 text-fg-1"}>{icon}</div>
        <div className={"min-w-0 leading-tight"}>
            <div className={"text-xs text-fg-3"}>{label}</div>
            <div className={"text-sm font-semibold text-fg-2 truncate"}>{value}</div>
        </div>
    </div>
}

/** Grid of the current game's settings, read from the game atoms. */
function GameSettingsSummary({yourColor}: { yourColor?: Color }) {
    const usesClock = useAtomValue(usesClockAtom);
    const clockStartMs = useAtomValue(clockStartMsAtom);
    const clockIncrementMs = useAtomValue(clockIncrementMsAtom);
    const ruleCount = useAtomValue(ruleCountAtom);
    const bluffPunishment = useAtomValue(bluffPunishmentAtom);

    return <div className={"grid grid-cols-1 sm:grid-cols-2 gap-2"}>
        <Tile icon={<LuClock size={16}/>} label={"Time control"} value={formatTimeControlLong(usesClock, clockStartMs, clockIncrementMs)}/>
        <Tile icon={<LuKeyRound size={16}/>} label={"Secret rules per player"} value={ruleCount}/>
        <Tile icon={<LuShieldAlert size={16}/>} label={"Bluff punishment"} value={BLUFF_PUNISHMENT_LABELS[bluffPunishment ?? BluffPunishment.Turn]}/>
        <Tile
            icon={yourColor
                ? <img src={pieceImages[yourColor + "King"]} alt={""} width={22} height={22}/>
                : <img src={pieceImages["RandomKing"]} alt={""} width={20} height={20}/>}
            label={"You play"}
            value={yourColor ?? "…"}
        />
    </div>
}

export default GameSettingsSummary;
