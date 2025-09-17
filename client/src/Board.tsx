import {useState} from "react";
import Square from "./Square.tsx";
import {Color, type Square as SquareType, type Move} from "@chess-bs/common";
import BoardClass from "@chess-bs/common/dist/board";


function Board({ board, view=Color.White, turn, handleMove } : { board: BoardClass, view: Color, turn: Color, handleMove: (move: Move) => void }) {


    const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
    const [legalMoves, setLegalMoves] = useState<Move[]>([]);
    // const [draggingPiece, setDraggingPiece] = useState<PieceType | null>(null);

    const rows = view === Color.White ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const cols = view === Color.White ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];


    function handleSelectedSquare (square: SquareType) {
        if (turn !== view) return;

        const piece = board.getPiece(square);

        if (piece === undefined) return; // Shouldn't be possible

        const isLegalMove = legalMoves.some((move) => move.to.row === square.row && move.to.col === square.col);

        if ((piece === null && !isLegalMove) || (piece && piece.color !== view && !isLegalMove)) {
            // Empty square: Deselect
            setSelectedSquare(null);
            setLegalMoves([]);
        } else if (piece && piece.color === view) {
            // Selecting a piece
            setSelectedSquare(square);
            setLegalMoves(board.getLegalMoves(square, true));
        } else if (selectedSquare && isLegalMove) {
            // Moving a piece
            const movingPiece = board.getPiece(selectedSquare)
            if (!movingPiece) return;
            handleMove({from: selectedSquare, to: square, piece: {type: movingPiece.pieceType, color: movingPiece.color}});
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    }





    if (!board) return;

    return (
        <div className="grid grid-rows-8 grid-cols-8">
            {rows.map((row) => (
                cols.map((col) => (
                    <div key={col} onMouseDown={() => {handleSelectedSquare({row, col})}}>
                        <Square row={row} col={col}
                                piece={board?.grid?.[row]?.[col] || null}
                                selected={selectedSquare?.row === row && selectedSquare?.col === col}
                                movable={legalMoves.some((move) => move.to.row === row && move.to.col === col)}
                        />
                    </div>
                ))
            ))}
        </div>
    )
}



export default Board;