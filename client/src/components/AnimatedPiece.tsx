import {useEffect, useState} from "react";
import type {AnimationPiece} from "../hooks/PieceAnimation.ts";
import {Color, type Square} from "@chess-bs/common";
import {pieceImages} from "../assets/pieceImages.ts";


function getVisualPosition(square: Square, view: Color, squareSize: number, rowCount: number = 8, colCount: number = 8) {
    const row = view === Color.Black ? rowCount - 1 - square.row : square.row;
    const col = view === Color.Black ? colCount - 1 - square.col : square.col;
    return {
        x: col * squareSize + squareSize / 2,
        y: row * squareSize + squareSize / 2,
    };
}

export default function AnimatedPiece({ anim, view, squareSize, rowCount, colCount }: {
    anim: AnimationPiece, view: Color, squareSize: number, rowCount: number, colCount: number
}) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Trigger the animation for this specific piece on its own next frame
        const id = requestAnimationFrame(() => setIsAnimating(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const fromPos = getVisualPosition(anim.from, view, squareSize, rowCount, colCount);
    const toPos = getVisualPosition(anim.to, view, squareSize, rowCount, colCount);

    // Starts at 0, then transitions to target
    const dx = isAnimating ? toPos.x - fromPos.x : 0;
    const dy = isAnimating ? toPos.y - fromPos.y : 0;

    const pieceString = "" + anim.piece.color + anim.piece.type;
    const src = pieceImages[pieceString];
    if (!src) return null;

    return (
        <img
            src={src}
            alt={pieceString}
            width={squareSize}
            height={squareSize}
            draggable={false}
            className="absolute pointer-events-none select-none z-20"
            style={{
                left: fromPos.x - squareSize / 2,
                top: fromPos.y - squareSize / 2,
                width: squareSize,
                height: squareSize,
                transform: `translate(${dx}px, ${dy}px)`,
                transition: `transform ${anim.duration}ms ease-in-out`,
            }}
        />
    );
};
