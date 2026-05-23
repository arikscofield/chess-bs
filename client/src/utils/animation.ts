import {Color, type Move, PieceType, type Square, type Turn} from "@chess-bs/common";
import type {AnimationPiece} from "../hooks/PieceAnimation.ts";


export function getAnimations(turnHistory: Turn[], startIndex: number, endIndex: number): AnimationPiece[] {
    if (startIndex < 0) startIndex = turnHistory.length + startIndex + 1;
    if (endIndex < 0) endIndex = turnHistory.length + endIndex + 1;

    if (startIndex === endIndex || startIndex > turnHistory.length || endIndex > turnHistory.length) {
        console.warn(`getAnimations: Got invalid indices: startIndex: ${startIndex}, endIndex: ${endIndex}`);
        return [];
    }

    const forward = endIndex > startIndex;
    const step = forward ? 1 : -1;
    const start = forward ? startIndex : startIndex - 1;
    const stop = forward ? endIndex : endIndex - 1;
    const now = Date.now();

    const animations: AnimationPiece[] = [];

    function addAnimation (from: Square, to: Square, piece: {type: PieceType, color: Color}) {
        const prior = animations.findLastIndex(a => a.to.row === from.row && a.to.col === from.col);
        if (prior !== -1) {
            const [existing] = animations.splice(prior, 1);
            existing.to = to;
            animations.push(existing);
        } else {
            animations.push({
                id: `${from.row}-${from.col}-${to.row}-${to.col}-${now}`,
                from,
                to,
                piece,
                duration: 200,
            });
        }
    }

    for (let i = start; i !== stop; i += step) {
        const turn = turnHistory[i];

        // Resolve the turn to the underlying move and whether we're applying or undoing it.
        let move: Move;
        let applying: boolean;

        if ("from" in turn) {
            move = turn;
            applying = forward;
        } else if (turn.successful) {
            const lastMove = turnHistory[i - 1];
            if (!("from" in lastMove)) continue;
            move = lastMove;
            applying = !forward;
        } else {
            continue;
        }

        // A turn animates the main move plus any side effects
        // (e.g. the rook during castling). Direction flips from/to for each.
        const movements = [
            { from: move.from, to: move.to, piece: move.piece },
            ...(move.sideEffectMoves ?? []),
        ];

        for (const m of movements) {
            const from = applying ? m.from : m.to;
            const to = applying ? m.to : m.from;
            addAnimation(from, to, m.piece);
        }
    }

    return animations;
}