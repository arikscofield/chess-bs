import {useEffect, useRef, useState} from "react";
import type {Color, PieceType, Square, Turn} from "@chess-bs/common";
import {getAnimations} from "../utils/animation.ts";


export interface AnimationPiece {
    id: string;
    from: Square;
    to: Square;
    piece: {type: PieceType, color: Color};
    captured?: boolean;
    transformedInto?: PieceType;
    duration: number;
}

export function usePieceAnimations(turnHistory: Turn[], viewMoveIndex: number, isDragMove: boolean = false) {
    const [activeAnimations, setActiveAnimations] = useState<AnimationPiece[]>([]);
    const directionRef = useRef(1);
    const prevHistoryLenRef = useRef(turnHistory.length);
    const prevIndexRef = useRef(viewMoveIndex);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    function clearAnimations() {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setActiveAnimations([]);
    }

    function playAnimations(animations: AnimationPiece[]) {
        clearAnimations();
        if (animations.length === 0) return;

        setActiveAnimations(animations);
        const maxDuration = Math.max(...animations.map(a => a.duration));
        timerRef.current = setTimeout(() => {
            setActiveAnimations([]);
        }, maxDuration);
    }

    function playSingleMove(from: Square, to: Square, piece: {type: PieceType, color: Color}, options = { duration: 200 }) {
        playAnimations([{
            id: `${from.row}-${from.col}-${to.row}-${to.col}-${Date.now()}`,
            from,
            to,
            piece,
            ...options,
        }]);
    }

    // Detect viewMoveIndex changes and trigger animations
    useEffect(() => {
        const prevLen = prevHistoryLenRef.current;
        const prevIdx = prevIndexRef.current;
        const nextLen = turnHistory.length;
        const nextIdx = viewMoveIndex;
        let animations: AnimationPiece[] = [];
        directionRef.current = prevIdx < nextIdx ? 1 : -1;

        // Live move: turnHistory grew
        if (nextLen > prevLen) {
            if (!isDragMove) {
                const newTurn = turnHistory[nextLen - 1];
                if ("from" in newTurn) {
                    animations.push({
                        id: `${newTurn.from.row}-${newTurn.from.col}-${newTurn.to.row}-${newTurn.to.col}-${Date.now()}`,
                        from: newTurn.from,
                        to: newTurn.to,
                        piece: newTurn.piece,
                        duration: 200,
                    });
                }
            } else {
                console.log("Not animating drag move");
            }
            prevHistoryLenRef.current = nextLen;
        }

        // History stepping: viewMoveIndex changed
        if (nextIdx !== prevIdx) {
            animations = getAnimations(turnHistory, prevIdx, nextIdx);
            prevIndexRef.current = nextIdx;
        }
        if (animations.length > 0) {
            playAnimations(animations);
        }
    }, [viewMoveIndex, turnHistory, isDragMove]);

    useEffect(() => {
        return () => clearAnimations();
    }, []);


    const hiddenSquares = directionRef.current === 1 ?
        new Set(
            activeAnimations.flatMap(a => [
                // `${a.from.row}-${a.from.col}`,
                `${a.to.row}-${a.to.col}`,
            ]))
        :
        new Set(
        activeAnimations.flatMap(a => [
            `${a.from.row}-${a.from.col}`,
            `${a.to.row}-${a.to.col}`,
        ])
    );

    return { activeAnimations, playAnimations, playSingleMove, clearAnimations, hiddenSquares };
}