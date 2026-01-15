import {type Board, Color, type Move, type ReplayTimerInfo, type Turn} from "@chess-bs/common";
import {type Dispatch, type SetStateAction, useEffect, useState} from "react";

export function useGameViewer(startBoard: Board | null, turnHistory: Turn[], replayTimerInfo?: ReplayTimerInfo):
    {visibleBoard: Board | null, viewMoveIndex: number, setViewMoveIndex: Dispatch<SetStateAction<number>>, highlightedMove: Move | null, timersMs?: Record<Color, number>}
{
    // The current move index to show in the visible board. -1 means the latest move
    const [viewMoveIndex, setViewMoveIndex] = useState<number>(-1);
    const [highlightedMove, setHighlightedMove] = useState<Move | null>(null);
    const [visibleBoard, setVisibleBoard] = useState<Board | null>(null);
    const [timersMs, setTimersMs] = useState<Record<Color, number>>({[Color.White]: 0, [Color.Black]: 0}) // FIXME don't hardcode

    useEffect(() => {
        setViewMoveIndex(-1);
    }, [turnHistory.length]);


    useEffect(() => {
        // console.log("Recomputing visible board for index: ", viewMoveIndex);
        // console.log(replayTimerInfo, startBoard, turnHistory, viewMoveIndex)
        if (!startBoard) {return;}

        let newBoard = startBoard.clone();

        const eventsToApply = turnHistory.slice(0, viewMoveIndex >= 0 ? viewMoveIndex : turnHistory.length);
        // console.log("EventsToApply", eventsToApply);

        const boardStack: Board[] = [];

        const newTimersMs = {[Color.White]: 0, [Color.Black]: 0} // FIXME don't hardcode
        if (replayTimerInfo){
            newTimersMs[Color.White] = replayTimerInfo.startMs;
            newTimersMs[Color.Black] = replayTimerInfo.startMs;

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
                }
                turnColor = event.callerColor;
            }
            
            // Tick down time between moves
            if (replayTimerInfo && event.timestamp && event.timestamp > replayTimerInfo.gameStartTimestamp.getTime()) {
                newTimersMs[turnColor] -= event.timestamp - prevTurnTimestamp;
            }
            
            // Add Increment
            if (replayTimerInfo) {
                newTimersMs[turnColor] += replayTimerInfo.incrementMs;
            }

            prevTurnTimestamp = event.timestamp || 0;

            // console.log(newTimersMs);
        }


        setVisibleBoard(newBoard);
        setTimersMs(newTimersMs);
    }, [replayTimerInfo, startBoard, turnHistory, viewMoveIndex]);



    return replayTimerInfo
    ? {
        visibleBoard,
        viewMoveIndex,
        setViewMoveIndex,
        highlightedMove,
        timersMs,
    }
    : {
        visibleBoard,
        viewMoveIndex,
        setViewMoveIndex,
        highlightedMove,
    }
}