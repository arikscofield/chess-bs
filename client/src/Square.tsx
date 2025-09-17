import {type Piece} from "@chess-bs/common"
import {pieceImages} from "./assets/pieceImages.ts";


const BoardType: Record<string, [string, string]> = {
    Brown: ["bg-board-brown-light", "bg-board-brown-dark"],
    Green: ["bg-board-green-light", "bg-board-green-dark"],
}


function Square({ row, col, piece, selected, movable, boardType = BoardType.Brown }: {row: number, col: number, piece: Piece | null, selected: boolean, movable: boolean, boardType?: [string, string] }) {


    const pieceString: string = "" + piece?.color + piece?.pieceType;

    return (
        <div className={`relative flex w-full h-full items-center justify-center group ${(row+col) % 2 === 0 ? boardType[0] : boardType[1]} ${piece !== null ? "cursor-grab" : ""}`}>
            {selected && <div className={`absolute w-full h-full top-0 left-0 bg-green-700/40 `}/>}
            {movable && <div className={`absolute w-full h-full top-0 left-0 bg-green-700/40 group-hover:hidden ${piece !== null ? "bg-transparent border-8 border-green-700/40 rounded-full" : "scale-[30%] rounded-full"}`}/> }
            {movable && <div className={`absolute w-full h-full top-0 left-0 bg-green-600/40 hidden group-hover:block`}/>}

            {piece !== null
            ? <img src={pieceImages[pieceString]} alt={pieceString} width={90} height={90} className={"z-10"} />
            : <div className={"w-[90px] h-[90px]"}/>
            }

        </div>
    )

}


export default Square;