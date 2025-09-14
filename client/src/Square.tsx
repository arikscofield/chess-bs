import {Color, type Piece} from "@chess-bs/common"
import {pieceImages} from "./assets/pieceImages.ts";


function Square({ row, col, piece, view }: {row: number, col: number, piece: Piece, view: Color }) {


    const pieceString: string = piece.color + piece.pieceType;

    return (
        <div className={`${row+col % 2 === 0 ? "bg-gray-200" : "bg-amber-800"}`}>
            <img src={pieceImages[pieceString]} alt={pieceString}/>
        </div>
    )

}


export default Square;