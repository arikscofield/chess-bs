import type {Board, Move, Turn} from "@chess-bs/common";
import {useEffect, useMemo, useState} from "react";

export function useGameViewer(startBoard: Board | null, turnHistory: Turn[]) {
    // The current move index to show in the visible board. -1 means the latest move
    const [viewMoveIndex, setViewMoveIndex] = useState<number>(-1);
    const [highlightedMove, setHighlightedMove] = useState<Move | null>(null);

    useEffect(() => {
        setViewMoveIndex(-1);
    }, [turnHistory.length]);


    const visibleBoard = useMemo(() => {
        // console.log("Recomputing visible board for index: ", viewMoveIndex);
        if (!startBoard) {return null}

        let newBoard = startBoard.clone();

        const eventsToApply = turnHistory.slice(0, viewMoveIndex >= 0 ? viewMoveIndex : turnHistory.length);
        // console.log("EventsToApply", eventsToApply);

        const boardStack: Board[] = [];

        setHighlightedMove(null);
        for (const event of eventsToApply) {
            // If it's a Move event
            if ('from' in event && 'to' in event) {
                boardStack.push(newBoard.clone());
                newBoard.applyMove(event);
                setHighlightedMove(event);
            }
            // If it's a CallBluff event
            else if ('successful' in event) {
                if (event.successful) {
                    const previousBoard = boardStack.pop();
                    if (previousBoard) {
                        newBoard = previousBoard;
                    }
                }
            }
        }

        return newBoard
    }, [startBoard, turnHistory, viewMoveIndex])



    return {
        visibleBoard,
        viewMoveIndex,
        setViewMoveIndex,
        highlightedMove,
    }
}