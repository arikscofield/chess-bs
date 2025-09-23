import {Color, type Piece, type PieceType} from "@chess-bs/common"
import {pieceImages} from "../assets/pieceImages.ts";
import type {Square as SquareType} from "@chess-bs/common/dist/types.js";


const BoardType: Record<string, [string, string]> = {
    Brown: ["bg-board-brown-light", "bg-board-brown-dark"],
    Green: ["bg-board-green-light", "bg-board-green-dark"],
}


function Square(
    { row, col, color, piece, selected, movable, ruleMovable, isBluffing, handleSelectedSquare, promotionOptionPieceType, boardType = BoardType.Brown, handleSelectPromotion } :
    {row: number, col: number, color: Color, piece: Piece | null, selected: boolean, movable: boolean, ruleMovable: boolean, isBluffing: boolean, handleSelectedSquare: (square: SquareType) => void, promotionOptionPieceType: PieceType | null, boardType?: [string, string], handleSelectPromotion: (pieceType: PieceType) => void }
) {


    const pieceString: string = "" + piece?.color + piece?.pieceType;
    const promotionPieceString: string = "" + color + promotionOptionPieceType;

    // before:absolute before:w-[10px] before:h-full before:left-[-10px] before:bg-linear-to-l before:from-black/40 before:to-black/0 before:opacity-50 before:z-10
    // after:absolute after:w-full after:h-full after:right-[-10px] after:bottom-[-10px] after:bg-linear-to-r after:from-black after:to-black/0 after:opacity-50 after:z-10

    if (promotionOptionPieceType !== null) {
        return (
            <div className={"relative w-full h-full"}>
                <div className={`relative flex w-full h-full items-center justify-center group bg-white hover:bg-gray-100 cursor-pointer z-30
            
            `}
                     onClick={() => {
                         handleSelectPromotion(promotionOptionPieceType);
                     }}
                >

                    <img src={pieceImages[promotionPieceString]} alt={promotionPieceString} width={90} height={90} className={"z-10"} />
                </div>
                <span className={"absolute z-20 w-[10px] h-full bottom-0 right-[-10px] bg-linear-to-r from-black/50 from-40% to-black/0"}/>
                <span className={"absolute z-20 w-full h-[10px] bottom-[-10px] right-0 bg-linear-to-b from-black/50 from-40% to-black/0"}/>
            </div>

        )
    }

    return (
        <div className={`relative flex w-full h-full items-center justify-center z-10 group ${(row+col) % 2 === 0 ? boardType[0] : boardType[1]} ${piece !== null ? "cursor-grab" : ""}`}
             onMouseDown={() => {handleSelectedSquare({row, col});}}
        >
            {/* Selected Piece highlight */}
            {selected && <div className={`absolute w-full h-full top-0 left-0 bg-green-700/40 `}/>}

            {/* Showing legal moves: both regular chess (green), and rule-specific (blue) */}
            {(movable || ruleMovable) && !selected && <div className={`absolute w-full h-full top-0 left-0 group-hover:hidden 
                ${isBluffing ? "bg-red-700/40" : (ruleMovable ? "bg-blue-700/40" : (movable ? "bg-green-700/40" : ""))}
                ${piece === null ? `scale-[30%] rounded-full` : `bg-transparent border-8 rounded-full ${isBluffing ? "border-red-700/40" : (ruleMovable ? "border-blue-700/40" : (movable ? "border-green-700/40" : ""))}`}`
            }/> }

            {/* Legal move on-hover-highlight */}
            {(movable || ruleMovable) && !selected && <div className={`absolute w-full h-full top-0 left-0 hidden group-hover:block ${isBluffing ? "bg-red-600/40" : (ruleMovable ? "bg-blue-600/40" : (movable ? "bg-green-600/40" : ""))}`}/>}

            {piece !== null
            ? <img src={pieceImages[pieceString]} alt={pieceString} width={90} height={90} draggable={false} className={"z-20 select-none "} />
            : <div className={"w-[90px] h-[90px]"}/>
            }

        </div>
    )

}


export default Square;