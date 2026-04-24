import {Color, type Move, type Turn} from "@chess-bs/common";
import {type Dispatch, type SetStateAction, useEffect, useState} from "react";
import Board from "@chess-bs/common/src/board"


type ClockInfo = {
    usesClock: boolean,
    startMs: number,
    incrementMs: number,
    gameStartTimestamp: number,
}

export function useGameViewer(startBoard: Board | null, turnHistory: Turn[], clockInfo: ClockInfo):
    {visibleBoard: Board | null, viewMoveIndex: number, setViewMoveIndex: Dispatch<SetStateAction<number>>, highlightedMove: Move | null, clock: Map<Color, number>}
{
    // The current move index to show in the visible board. -1 means the latest move
    const [viewMoveIndex, setViewMoveIndex] = useState<number>(-1);
    const [highlightedMove, setHighlightedMove] = useState<Move | null>(null);
    const [visibleBoard, setVisibleBoard] = useState<Board | null>(null);
    const [clock, setClock] = useState<Map<Color, number>>(new Map())


    useEffect(() => {
        setViewMoveIndex(-1);
    }, [turnHistory.length]);


    useEffect(() => {
        // console.log("GameViewer.tsx: Main useEffect");

        if (!startBoard) {return;}

        let newBoard = startBoard.clone();

        const eventsToApply = turnHistory.slice(0, viewMoveIndex >= 0 ? viewMoveIndex : turnHistory.length);
        // console.log("EventsToApply", eventsToApply);

        const boardStack: Board[] = [];

        const newClock: Map<Color, number> = new Map();
        for (const color of Object.values(Color)) {
            newClock.set(color, clockInfo.startMs ?? 0);
        }
        let prevTurnTimestamp: number = 0;

        setHighlightedMove(null);
        for (const event of eventsToApply) {
            // console.log(event);
            let turnColor: Color = Color.White;
            // If it's a Move event
            if ('from' in event && 'to' in event) {
                boardStack.push(newBoard.clone());
                newBoard.applyMove(event);
                setHighlightedMove(event);
                turnColor = event.piece.color;
            }
            // If it's a CallBluff event
            else if ('successful' in event) {
                if (event.successful) {
                    const previousBoard = boardStack.pop();
                    if (previousBoard) {
                        newBoard = previousBoard;
                    }
                } else {
                    setHighlightedMove(null);
                }
                turnColor = event.callerColor;
            }
            
            // Tick down time between moves
            if (clockInfo.usesClock && event.timestamp && event.timestamp > clockInfo.gameStartTimestamp) {
                newClock.set(turnColor, (newClock.get(turnColor) ?? 0) - (event.timestamp - prevTurnTimestamp))
            }
            
            // Add Increment
            if (clockInfo.usesClock) {
                newClock.set(turnColor, (newClock.get(turnColor) ?? 0) + clockInfo.incrementMs)
            }

            prevTurnTimestamp = event.timestamp || 0;

            // console.log(newClock);
        }


        setVisibleBoard(newBoard);
        setClock(newClock);
    }, [clockInfo, startBoard, turnHistory, viewMoveIndex]);

    return {
        visibleBoard,
        viewMoveIndex,
        setViewMoveIndex,
        highlightedMove,
        clock: clock
    }
}