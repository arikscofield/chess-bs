import {useState} from "react";
import Square from "./Square.tsx";
import {Color, type Square as SquareType, type Move, PieceType, type Player} from "@chess-bs/common";
import BoardClass from "@chess-bs/common/dist/board";


function Board(
    {board, player, view=Color.White, turn, promotionMove, handleMove, setPromotionMove, handleSelectPromotion } :
    { board: BoardClass, player: Player | null, view: Color, turn: Color, promotionMove: Move | null, handleMove: (move: Move) => void, setPromotionMove: (move: Move | null) => void, handleSelectPromotion: (pieceType: PieceType) => void }
) {


    const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
    const [legalMoves, setLegalMoves] = useState<Move[]>([]);
    const [legalRuleMoves, setLegalRuleMoves] = useState<Move[]>([]);
    // const [draggingPiece, setDraggingPiece] = useState<PieceType | null>(null);

    const rows = view === Color.White ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const cols = view === Color.White ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    const promotionOptions = [PieceType.Queen, PieceType.Knight, PieceType.Rook, PieceType.Bishop];


    function handleSelectedSquare(square: SquareType) {
        if (turn !== view) return;

        const piece = board.getPiece(square);

        if (piece === undefined) return; // Shouldn't be possible

        const isLegalMove = legalMoves.concat(legalRuleMoves).some((move) => move.to.row === square.row && move.to.col === square.col);

        if ((piece === null && !isLegalMove) || (piece && piece.color !== view && !isLegalMove)) {
            // Empty square: Deselect
            setSelectedSquare(null);
            setLegalMoves([]);
            setLegalRuleMoves([]);
            setPromotionMove(null);
        } else if (piece && piece.color === view) {
            // Selecting a piece
            setSelectedSquare(square);
            setLegalMoves(board.getLegalMoves(square, true));
            setPromotionMove(null);
            let newLegalRuleMoves: Move[] = [];
            for (const rule of player?.rules || []) {
                newLegalRuleMoves = newLegalRuleMoves.concat(rule.getLegalMoves(board, square));
            }
            setLegalRuleMoves(newLegalRuleMoves);
        } else if (selectedSquare && isLegalMove) {
            // Moving a piece
            const movingPiece = board.getPiece(selectedSquare)
            if (!movingPiece) return;

            const isPromotion = movingPiece.pieceType === PieceType.Pawn &&
                ((movingPiece.color === Color.White && square.row === 0) ||
                    (movingPiece.color === Color.Black && square.row === 7));

            if (isPromotion) {
                setPromotionMove({from: selectedSquare, to: square, piece: {type: movingPiece.pieceType, color: movingPiece.color}});
                setLegalMoves([]);
                setLegalRuleMoves([]);
                return;
            }

            handleMove({from: selectedSquare, to: square, piece: {type: movingPiece.pieceType, color: movingPiece.color}});
            setSelectedSquare(null);
            setLegalMoves([]);
            setLegalRuleMoves([]);
        }
    }


    function handleSelectPromotionBoard(pieceType: PieceType) {
        setSelectedSquare(null);
        setLegalMoves([]);
        setLegalRuleMoves([]);
        handleSelectPromotion(pieceType);
    }



    if (!board) return;

    return (
        <div className="grid grid-rows-8 grid-cols-8">
            {rows.map((row) => (
                cols.map((col) => {
                    let promotionOptionPieceType = null;
                    if (promotionMove && col === promotionMove.to.col) {
                        const rowDiff = Math.abs(row - promotionMove.to.row);
                        if (rowDiff < promotionOptions.length) {
                            promotionOptionPieceType = promotionOptions[rowDiff];
                        }
                    }
                    return <div key={col}>
                        <Square row={row} col={col} view={view}
                                piece={board?.grid?.[row]?.[col] || null}
                                selected={selectedSquare?.row === row && selectedSquare?.col === col}
                                movable={legalMoves.some((move) => move.to.row === row && move.to.col === col)}
                                ruleMovable={legalRuleMoves.some((move) => move.to.row === row && move.to.col === col)}
                                handleSelectedSquare={handleSelectedSquare}
                                promotionOptionPieceType={promotionOptionPieceType}
                                handleSelectPromotion={handleSelectPromotionBoard}
                        />
                    </div>
                })
            ))}
        </div>
    )
}



export default Board;