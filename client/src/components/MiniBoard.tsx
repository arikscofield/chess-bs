import type {ReactNode} from "react";
import {useAtomValue} from "jotai";
import {boardColorsAtom} from "../atoms/settings.ts";
import {pieceImages} from "../assets/pieceImages.ts";

const PIECES: Record<string, string> = {
    p: "BlackPawn", n: "BlackKnight", b: "BlackBishop", r: "BlackRook", q: "BlackQueen", k: "BlackKing",
    P: "WhitePawn", N: "WhiteKnight", B: "WhiteBishop", R: "WhiteRook", Q: "WhiteQueen", K: "WhiteKing",
};
const CAPTURE_HIGHLIGHT_SIZE = 25;

type SquareRef = [row: number, col: number];

/*
A small, static, decorative board snippet.
position: one string per row, using FEN piece letters and "." for empty squares
highlights: squares filled with a color (e.g. the last move)
targets: move markers, drawn as a dot on empty squares and as corners on occupied ones
badges: extra content placed in the corner of a square
 */
function MiniBoard({position, highlights = [], targets = [], badges = []}: {
    position: string[],
    highlights?: {square: SquareRef, color: string}[],
    targets?: {square: SquareRef, color: string}[],
    badges?: {square: SquareRef, content: ReactNode}[],
}) {
    const boardColors = useAtomValue(boardColorsAtom);
    const cols = position[0]?.length ?? 0;
    const at = <T extends {square: SquareRef}>(list: T[], row: number, col: number) =>
        list.find(({square}) => square[0] === row && square[1] === col);

    return <div
        className={"grid w-full rounded-lg overflow-hidden ring-1 ring-black/20 select-none"}
        style={{gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`}}
        aria-hidden={true}
    >
        {position.flatMap((rank, row) => rank.split("").map((ch, col) => {
            const highlight = at(highlights, row, col);
            const target = at(targets, row, col);
            const badge = at(badges, row, col);

            return <div
                key={`${row}-${col}`}
                className={"relative aspect-square"}
                style={{backgroundColor: (row + col) % 2 === 0 ? boardColors.light : boardColors.dark}}
            >
                {highlight && <div className={"absolute inset-0"} style={{backgroundColor: highlight.color}}/>}
                {ch !== "." && <img
                    src={pieceImages[PIECES[ch] ?? ""]}
                    alt={""}
                    draggable={false}
                    className={"relative w-full h-full"}
                />}
                {target && <svg viewBox={"0 0 100 100"} fill={target.color} className={"absolute inset-0 w-full h-full"}>
                    {ch === "." ?
                        <circle r={15} cx={50} cy={50}/>
                        :
                        <g>
                            <polygon points={`0,0 0,${CAPTURE_HIGHLIGHT_SIZE} ${CAPTURE_HIGHLIGHT_SIZE},0`}/>
                            <polygon points={`100,0 100,${CAPTURE_HIGHLIGHT_SIZE} ${100-CAPTURE_HIGHLIGHT_SIZE},0`}/>
                            <polygon points={`100,100 100,${100-CAPTURE_HIGHLIGHT_SIZE} ${100-CAPTURE_HIGHLIGHT_SIZE},100`}/>
                            <polygon points={`0,100 0,${100-CAPTURE_HIGHLIGHT_SIZE} ${CAPTURE_HIGHLIGHT_SIZE},100`}/>
                        </g>
                    }
                </svg>}
                {badge && <div className={"absolute top-0.5 right-0.5"}>{badge.content}</div>}
            </div>
        }))}
    </div>
}

export default MiniBoard;
