import type {AnimationPiece} from "../hooks/PieceAnimation.ts";
import {Color} from "@chess-bs/common";
import AnimatedPiece from "./AnimatedPiece.tsx";


export default function PieceAnimationOverlay({animations, view, squareSize, rowCount = 8, colCount = 8}:
{
    animations: AnimationPiece[],
    view: Color,
    squareSize: number,
    rowCount?: number,
    colCount?: number,
}) {

    if (animations.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-[25]">
            {animations.map(anim => (
                <AnimatedPiece
                    key={anim.id}
                    anim={anim}
                    view={view}
                    squareSize={squareSize}
                    rowCount={rowCount}
                    colCount={colCount}
                />
            ))}
        </div>
    );

}