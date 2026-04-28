import {useEffect, useMemo, useState} from "react";
import {type ClockInfo, type Turn} from "@chess-bs/common";
import {Color, nextTurnColor} from "@chess-bs/common";


export function useLiveClock(turnHistory: Turn[], clockInfo: ClockInfo, liveTick: boolean = true): Map<Color, number> {
    const [now, setNow] = useState(() => Date.now());


    useEffect(() => {
        if (!liveTick) return;
        const id = setInterval(() => {
            setNow(Date.now())
        }, 100);
        return () => clearInterval(id);
    }, [liveTick]);


    return useMemo(() => {
        const clocks = new Map<Color, number>();
        for (const color of Object.values(Color)) {
            clocks.set(color, clockInfo.startMs ?? 0);
        }
        if (!clockInfo.usesClock || clockInfo.incrementMs === undefined || clockInfo.startMs === undefined) return clocks;

        let turnColor = Color.White;
        let prevTimestamp = clockInfo.startTimestamp ?? Date.now();

        for (const turn of turnHistory) {
            clocks.set(turnColor, Math.max(0, (clocks.get(turnColor) ?? 0) + clockInfo.incrementMs)); // Add increment
            if (!turn.timestamp) {
                if ("from" in turn || !turn.successful) turnColor = nextTurnColor(turnColor);
                continue;
            }
            if (clockInfo.startTimestamp && turn.timestamp > clockInfo.startTimestamp) { // Clock only starts when both players have moved
                clocks.set(turnColor, Math.max(0, (clocks.get(turnColor) ?? 0) - (turn.timestamp - prevTimestamp)));
            }
            if ("from" in turn || !turn.successful) turnColor = nextTurnColor(turnColor);
            prevTimestamp = turn.timestamp;
        }

        // Live tick for the player whose turn it is
        if (liveTick && clockInfo.startTimestamp && now > clockInfo.startTimestamp) {
            clocks.set(turnColor, Math.max(0, (clocks.get(turnColor) ?? 0) - (now - prevTimestamp)));
        }
        return clocks;
    }, [clockInfo, turnHistory, now, liveTick]);

}

