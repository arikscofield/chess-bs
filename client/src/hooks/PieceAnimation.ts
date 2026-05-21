import {useEffect, useRef, useState} from "react";
import type {Piece, PieceType, Square, Turn} from "@chess-bs/common";
import {getAnimations} from "../utils/animation.ts";


export interface AnimationPiece {
    id: string;
    from: Square;
    to: Square;
    piece: Piece;
    captured?: boolean;
    transformedInto?: PieceType;
    duration: number;
}

export function usePieceAnimations(turnHistory: Turn[], viewMoveIndex: number) {
    const [activeAnimations, setActiveAnimations] = useState<AnimationPiece[]>([]);
    const prevIndexRef = useRef(viewMoveIndex === -1 ? turnHistory.length : viewMoveIndex);
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

    function playSingleMove(from: Square, to: Square, piece: Piece, options = { duration: 200 }) {
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
        let prev = prevIndexRef.current;
        let next = viewMoveIndex;
        if (prev === -1) prev = turnHistory.length;
        if (next === -1) next = turnHistory.length;
        if (prev === next) return;

        let fromIdx = prev;
        let toIdx = next;
        fromIdx = Math.max(0, Math.min(fromIdx, turnHistory.length));
        toIdx = Math.max(0, Math.min(toIdx, turnHistory.length));
        const animations = getAnimations(turnHistory, fromIdx, toIdx);

        console.log(prev, next);
        console.log("animations", animations);

        if (animations.length > 0) {
            playAnimations(animations);
        }
        prevIndexRef.current = next;
    }, [viewMoveIndex, turnHistory]);

    useEffect(() => {
        return () => clearAnimations();
    }, []);


    const hiddenSquares = new Set(
        activeAnimations.flatMap(a => [
            `${a.from.row}-${a.from.col}`,
            `${a.to.row}-${a.to.col}`,
        ])
    );

    return { activeAnimations, playAnimations, playSingleMove, clearAnimations, hiddenSquares };
}