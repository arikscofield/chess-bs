import {type Move, type Turn} from "@chess-bs/common";
import {type Dispatch, type SetStateAction, useEffect, useState} from "react";
import Board from "@chess-bs/common/src/board"

export function useGameViewer(
    startBoard: Board | null,
    turnHistory: Turn[]):
    {
        visibleBoard: Board | null,
        viewMoveIndex: number,
        setViewMoveIndex: Dispatch<SetStateAction<number>>,
        highlightedMove: Move | null,
    }
{
    // The current move index to show in the visible board. -1 means the latest move
    const [viewMoveIndex, setViewMoveIndex] = useState<number>(-1);
    const [highlightedMove, setHighlightedMove] = useState<Move | null>(null);
    const [visibleBoard, setVisibleBoard] = useState<Board | null>(null);


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

        setHighlightedMove(null);
        for (const event of eventsToApply) {
            // console.log(event);
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
                } else {
                    setHighlightedMove(null);
                }
            }
            // console.log(newClock);
        }


        setVisibleBoard(newBoard);
    }, [startBoard, turnHistory, viewMoveIndex]);

    return {
        visibleBoard,
        viewMoveIndex,
        setViewMoveIndex,
        highlightedMove,
    }
}