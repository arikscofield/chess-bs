import {useAtomValue} from "jotai";
import {boardColorsAtom, moveColorsAtom} from "../atoms/settings.ts";
import {pieceImages} from "../assets/pieceImages.ts";

// A static, decorative position for the landing page. White has just played
// Ra1-a3, hopping over its own pawn: is it the "Hopping Rook" rule, or a bluff?
const POSITION = [
    "r.bqkb.r",
    "pppp.ppp",
    "..n..n..",
    "....p...",
    "..B.P...",
    "R....N..",
    "PPPP.PPP",
    ".NBQK..R",
];
const PIECES: Record<string, string> = {
    p: "BlackPawn", n: "BlackKnight", b: "BlackBishop", r: "BlackRook", q: "BlackQueen", k: "BlackKing",
    P: "WhitePawn", N: "WhiteKnight", B: "WhiteBishop", R: "WhiteRook", Q: "WhiteQueen", K: "WhiteKing",
};
const FROM = [7, 0];
const TO = [5, 0];

function HeroBoard() {
    const boardColors = useAtomValue(boardColorsAtom);
    const moveColors = useAtomValue(moveColorsAtom);

    return (<div className={"relative w-full"}>
        <div
            className={"grid grid-cols-8 grid-rows-8 aspect-square w-full rounded-xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10 select-none"}
            aria-hidden={true}
        >
            {POSITION.flatMap((rank, row) => rank.split("").map((ch, col) => {
                const isLight = (row + col) % 2 === 0;
                const highlighted = (row === FROM[0] && col === FROM[1]) || (row === TO[0] && col === TO[1]);
                return <div
                    key={`${row}-${col}`}
                    className={"relative"}
                    style={{backgroundColor: isLight ? boardColors.light : boardColors.dark}}
                >
                    {highlighted && <div className={"absolute inset-0"} style={{backgroundColor: moveColors.bluff}}/>}
                    {ch !== "." && <img
                        src={pieceImages[PIECES[ch]]}
                        alt={""}
                        draggable={false}
                        className={"relative w-full h-full"}
                    />}
                </div>
            }))}
        </div>

        {/* Callout */}
        {/* Callout: sits on the empty b3-e3 squares, pointing at the rook */}
        <div className={"absolute top-[68.75%] left-[14%] -translate-y-1/2"}>
            <div className={"relative rounded-lg bg-bg-1/95 backdrop-blur border border-white/10 shadow-xl px-3 py-1.5 sm:py-2 leading-tight"}>
                <div className={"absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rotate-45 bg-bg-1 border-l border-b border-white/10"}/>
                <div className={"text-[11px] sm:text-sm font-semibold text-fg-2 whitespace-nowrap"}>Over its own pawn?</div>
                <div className={"text-[10px] sm:text-xs text-fg-3 whitespace-nowrap"}><span className={"text-fg-1 font-medium"}>Hopping Rook</span>… or a bluff</div>
            </div>
        </div>
    </div>)
}

export default HeroBoard;
