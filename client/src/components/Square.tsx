import {BoardColorType, Color, type Piece, type PieceType} from "@chess-bs/common"
import {pieceImages} from "../assets/pieceImages.ts";


const CAPTURE_HIGHLIGHT_SIZE = 25;

function Square(
    { row, col, color, piece, hovered, selected, highlighted, movable, ruleMovable, isBluffing, promotionOptionPieceType, handleSelectPromotion, boardType = BoardColorType.Brown }:
    {
        row: number,
        col: number,
        color: Color,
        piece: Piece | null,
        hovered: boolean,
        selected: boolean,
        highlighted: boolean,
        movable: boolean,
        ruleMovable: boolean,
        isBluffing: boolean,
        promotionOptionPieceType: PieceType | null,
        handleSelectPromotion: (pieceType: PieceType) => void,
        boardType?: [string, string, string, string],
    }
) {

    const pieceString: string = "" + piece?.color + piece?.pieceType;
    const promotionPieceString: string = "" + color + promotionOptionPieceType;

    if (promotionOptionPieceType !== null) {
        return (
            <div className={"relative w-full h-full"}>
                <div className={`relative flex w-full h-full items-center justify-center group cursor-pointer z-30 ${hovered ? "bg-gray-200" : "bg-white"}`}
                     onClick={() => {
                         handleSelectPromotion(promotionOptionPieceType);
                     }}
                >

                    <img src={pieceImages[promotionPieceString]} alt={promotionPieceString} width={90} height={90} className={"z-10 pointer-events-none"} />
                </div>
                <span className={"absolute z-20 w-[10px] h-full bottom-0 right-[-10px] bg-linear-to-r from-black/50 from-40% to-black/0 pointer-events-none"}/>
                <span className={"absolute z-20 w-full h-[10px] bottom-[-10px] right-0 bg-linear-to-b from-black/50 from-40% to-black/0 pointer-events-none"}/>
            </div>

        )
    }

    const anyMovable = movable || ruleMovable;

    return (
        <div className={`relative flex w-full h-full items-center justify-center z-10 pointer-events-none ${(row+col) % 2 === 0 ? boardType[0] : boardType[1]} `}
             style={{ touchAction: "none" }}

        >
            {/* Selected Piece highlight */}
            {selected && <div className={`absolute w-full h-full top-0 left-0 bg-green-700/40 `}/>}

            {/* Last Move highlight */}
            {highlighted && !anyMovable && <div className={`absolute w-full h-full top-0 left-0 bg-lime-400/40`}/>}

            {/* Showing legal moves: both regular chess (green), and rule-specific (blue) */}
            {anyMovable && !hovered &&
                <svg
                    viewBox={"0 0 100 100"}
                    fill={isBluffing ? "var(--color-red-700)" : ruleMovable ? "var(--color-blue-700)" :"var(--color-green-700"}
                    stroke={"none"}
                    opacity={0.5}
                    className={`absolute w-full h-full pointer-events-none`}
                >
                    {piece === null ?
                        <g>
                            <circle r={15} cx={50} cy={50}/>
                        </g>
                        :
                        <g>
                        <polygon points={`0, 0 0, ${CAPTURE_HIGHLIGHT_SIZE}, ${CAPTURE_HIGHLIGHT_SIZE}, 0`}/>
                        <polygon points={`100, 0 100, ${CAPTURE_HIGHLIGHT_SIZE}, ${100-CAPTURE_HIGHLIGHT_SIZE}, 0`}/>
                        <polygon points={`100, 100 100, ${100-CAPTURE_HIGHLIGHT_SIZE}, ${100-CAPTURE_HIGHLIGHT_SIZE}, 100`}/>
                        <polygon points={`0, 100 0, ${100-CAPTURE_HIGHLIGHT_SIZE}, ${CAPTURE_HIGHLIGHT_SIZE}, 100`}/>
                        </g>
                    }
                </svg>
            }

            {/* Legal move on-hover-highlight */}
            {hovered && anyMovable && !selected && <div className={`absolute w-full h-full top-0 left-0 ${isBluffing ? "bg-red-600/40" : (ruleMovable ? "bg-blue-600/40" : (movable ? "bg-green-600/40" : ""))}`}/>}

            {piece && <img src={pieceImages[pieceString]} alt={pieceString} width={90} height={90} draggable={false} className={"w-full h-full z-20 pointer-events-none "} style={{ touchAction: "none" }}/>}

        </div>
    )

}


export default Square;