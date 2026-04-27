import {useEffect, useMemo, useRef, useState} from "react";
import {type ClockInfo, GameStatus, type Turn} from "@chess-bs/common";
import {Color, nextTurnColor} from "@chess-bs/common";


export function useLiveClock(turnHistory: Turn[], clockInfo: ClockInfo, gameStatus: GameStatus): Map<Color, number> {
    const freeMoveCount = 2; // Number of moves before clock starts

    const [now, setNow] = useState(() => Date.now());

    const isTicking = useRef(gameStatus === GameStatus.RUNNING && turnHistory.length >= freeMoveCount);

    useEffect(() => {
        const newIsTicking = gameStatus === GameStatus.RUNNING && turnHistory.length >= freeMoveCount;
        if (isTicking.current !== newIsTicking) {
            isTicking.current = newIsTicking;
        }
    }, [gameStatus, turnHistory]);

    useEffect(() => {
        if (!isTicking.current) return;
        const id = setInterval(() => {
            setNow(Date.now())
        }, 100);
        return () => clearInterval(id);
    }, [isTicking.current]);


    return useMemo(() => {
        const clocks = new Map<Color, number>();
        for (const color of Object.values(Color)) {
            clocks.set(color, clockInfo.startMs ?? 0);
        }

        let turnColor = Color.White;
        let prevTimestamp = clockInfo.startTimestamp;

        for (let i = 0; i < turnHistory.length; i++) {
            const turn = turnHistory[i];
            clocks.set(turnColor, Math.max(0, (clocks.get(turnColor) ?? 0) + clockInfo.incrementMs)); // Add increment
            if (!turn.timestamp) {
                turnColor = nextTurnColor(turnColor);
                continue;
            }
            if (i >= freeMoveCount) { // Clock only starts when both players have moved
                clocks.set(turnColor, Math.max(0, (clocks.get(turnColor) ?? 0) - (turn.timestamp - prevTimestamp)));
            }
            turnColor = nextTurnColor(turnColor);
            prevTimestamp = turn.timestamp;
        }

        // Live tick for the player whose turn it is
        if (turnHistory.length >= freeMoveCount) {
            clocks.set(turnColor, Math.max(0, (clocks.get(turnColor) ?? 0) - (now - prevTimestamp)));
        }
        return clocks;
    }, [clockInfo, turnHistory, now]);

}

