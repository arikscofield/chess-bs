import type {Piece, Turn} from "@chess-bs/common";
import type {AnimationPiece} from "../hooks/PieceAnimation.ts";


export function getAnimations(turnHistory: Turn[], startIndex: number, endIndex: number): AnimationPiece[] {
    if (startIndex === endIndex) return [];

    const animations: AnimationPiece[] = [];
    const direction = endIndex > startIndex ? 1 : -1;
    const now = Date.now();

    if (direction === 1) {
        // Forward: collect moves from startIndex to endIndex-1
        for (let i = startIndex; i < endIndex; i++) {
            const turn = turnHistory[i];
            if ("from" in turn) {

                // "Collapse" multiple moves of the same piece to a single animation
                let added = false;
                for (let j = animations.length - 1; j >= 0; j--) {
                    const anim = animations[j];
                    if (anim.to.row === turn.from.row && anim.to.col === turn.from.col) {
                        const newAnim = animations.splice(j, 1)[0];
                        newAnim.to = turn.to;
                        animations.push(newAnim);
                        added = true;
                        break;
                    }
                }


                if (!added) {
                    animations.push({
                        id: `${turn.from.row}-${turn.from.col}-${turn.to.row}-${turn.to.col}-${now}`,
                        from: turn.from,
                        to: turn.to,
                        piece: ({pieceType: turn.piece.type, color: turn.piece.color, hasMoved: true}) as Piece,
                        duration: 200,
                    });
                }
            }
            // TODO: Handle calling bluffs
        }
    } else {
        // Backward: collect moves from endIndex to startIndex-1, in reverse
        for (let i = startIndex - 1; i >= endIndex; i--) {
            const turn = turnHistory[i];
            if ("from" in turn) {
                let added = false;
                for (let j = animations.length - 1; j >= 0; j--) {
                    const anim = animations[j];
                    if (anim.to.row === turn.to.row && anim.to.col === turn.to.col) {
                        const newAnim = animations.splice(j, 1)[0];
                        newAnim.to = turn.from;
                        animations.push(newAnim);
                        added = true;
                        break;
                    }
                }
                if (!added) {
                    animations.push({
                        id: `${turn.to.row}-${turn.to.col}-${turn.from.row}-${turn.from.col}-${now}`,
                        from: turn.to,
                        to: turn.from,
                        piece: ({pieceType: turn.piece.type, color: turn.piece.color, hasMoved: true}) as Piece,
                        duration: 200,
                    });
                }
            }
        }
    }
    return animations;
}