import {useEffect, useMemo, useState} from "react";
import {type ClockInfo, type Turn} from "@chess-bs/common";
import {Color, nextTurnColor} from "@chess-bs/common";


export function useLiveClock(turnHistory: Turn[], clockInfo: ClockInfo): Map<Color, number> {
    const [now, setNow] = useState(() => Date.now());


    useEffect(() => {
        const id = setInterval(() => {
            setNow(Date.now())
        }, 100);
        return () => clearInterval(id);
    }, []);


    return useMemo(() => {
        const clocks = new Map<Color, number>();
        for (const color of Object.values(Color)) {
            clocks.set(color, clockInfo.startMs ?? 0);
        }

        let turnColor = Color.White;
        let prevTimestamp = clockInfo.startTimestamp;

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
        if (clockInfo.startTimestamp && now > clockInfo.startTimestamp) {
            clocks.set(turnColor, Math.max(0, (clocks.get(turnColor) ?? 0) - (now - prevTimestamp)));
        }
        return clocks;
    }, [clockInfo, turnHistory, now]);

}

