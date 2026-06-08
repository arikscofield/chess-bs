// hooks/ClockState.ts
import {useMemo} from "react";
import {Color, type ClockInfo, nextTurnColor, type Turn} from "@chess-bs/common";

export interface ClockState {
    /** Clock value (ms) frozen at the last anchor — excludes live countdown. */
    baseMs: number;
    /** True if this color's clock is the one currently counting down. */
    running: boolean;
    /** Epoch ms to subtract elapsed time from while running. */
    anchorMs: number;
}

export function useClockState(
    turnHistory: Turn[],
    clockInfo: ClockInfo,
    viewMoveIndex: number = -1,
): Map<Color, ClockState> {
    return useMemo(() => {
        const result = new Map<Color, ClockState>();
        const base = new Map<Color, number>();
        for (const color of Object.values(Color)) {
            base.set(color, clockInfo.startMs ?? 0);
        }

        // Clock disabled → static values, nothing running.
        if (!clockInfo.usesClock || clockInfo.incrementMs === undefined || clockInfo.startMs === undefined) {
            for (const color of Object.values(Color)) {
                result.set(color, { baseMs: base.get(color) ?? 0, running: false, anchorMs: 0 });
            }
            return result;
        }

        const viewed = turnHistory.slice(0, viewMoveIndex >= 0 ? viewMoveIndex : turnHistory.length);

        let turnColor = Color.White;
        let prevTimestamp = clockInfo.startTimestamp ?? Date.now();

        for (const turn of viewed) {
            base.set(turnColor, Math.max(0, (base.get(turnColor) ?? 0) + clockInfo.incrementMs)); // increment
            if (!turn.timestamp) {
                if ("from" in turn || !turn.successful) turnColor = nextTurnColor(turnColor);
                continue;
            }
            if (clockInfo.startTimestamp && turn.timestamp > clockInfo.startTimestamp) {
                base.set(turnColor, Math.max(0, (base.get(turnColor) ?? 0) - (turn.timestamp - prevTimestamp)));
            }
            if ("from" in turn || !turn.successful) turnColor = nextTurnColor(turnColor);
            prevTimestamp = turn.timestamp;
        }

        const clockStarted = clockInfo.startTimestamp !== undefined;
        for (const color of Object.values(Color)) {
            result.set(color, {
                baseMs: base.get(color) ?? 0,
                running: clockStarted && color === turnColor,
                anchorMs: prevTimestamp,
            });
        }
        return result;
    }, [turnHistory, clockInfo, viewMoveIndex]);
}