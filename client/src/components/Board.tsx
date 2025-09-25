import {useEffect, useRef, useState} from "react";
import Square from "./Square.tsx";
import {Color, type Move, type Piece, PieceType, type Player, type Square as SquareType} from "@chess-bs/common";
import BoardClass from "@chess-bs/common/dist/board.js";
import {useElementSize, useMergedRef, useMounted} from "@mantine/hooks";
import {pieceImages} from "../assets/pieceImages.ts";
import {Portal} from "@mantine/core";


function Board(
    {board, player, view=Color.White, turn, isBluffing, handleMove } :
    { board: BoardClass, player: Player | null, view: Color, turn: Color, isBluffing: boolean, handleMove: (move: Move) => void }
) {
    const mounted = useMounted();

    type mouseState = {x: number; y: number, row: number | null, col: number | null, piece: Piece | null};
    const [mouse, setMouse] = useState<mouseState>({ x: 0, y: 0, row: 0, col: 0, piece: null });
    const { ref: sizeRef, width, height } = useElementSize();
    const boardRef = useRef<HTMLElement | null>(null);

    const mergedBoardRef = useMergedRef(sizeRef, boardRef);

    const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
    const [legalMoves, setLegalMoves] = useState<Move[]>([]);
    const [legalRuleMoves, setLegalRuleMoves] = useState<Move[]>([]);
    const [draggedSquare, setDraggedSquare] = useState<SquareType | null>(null);
    const [dragReleaseSquare, setDragReleaseSquare] = useState<SquareType | null>(null);
    const [promotionMove, setPromotionMove] = useState<Move | null>(null);

    const draggedPiece = draggedSquare ? board.getPiece(draggedSquare) : null;
    const draggedPieceString: string = "" + draggedPiece?.color + draggedPiece?.pieceType;

    const numRows: number = board.grid.length;
    const numCols: number = board.grid[0].length;
    const rows = view === Color.White
        ? Array.from({length: numRows}, (_, i) => i)
        : Array.from({length: numRows}, (_, i) => i).toReversed();
    const cols = view === Color.White
        ? Array.from({length: numCols}, (_, i) => i)
        : Array.from({length: numCols}, (_, i) => i).toReversed();

    const promotionOptions = [PieceType.Queen, PieceType.Knight, PieceType.Rook, PieceType.Bishop];

    const squareSize = width / 8;

    useEffect(() => {
        if (mounted) {
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
        }

    }, [mounted]);

    useEffect(() => {
        setSelectedSquare(null);
        setLegalMoves([]);
        setLegalRuleMoves([]);
    }, [turn])

    // handle the "queue" for the square that had a drag-release on it
    // Needed since we can't just call handleSquareAction inside the onPointerUp handler due to state closure
    useEffect(() => {
        if (dragReleaseSquare === null) return;

        endDrag(dragReleaseSquare);

        setDraggedSquare(null);
        setDragReleaseSquare(null);
    }, [dragReleaseSquare])

    function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (turn !== player?.color) return;

        const boardX = event.nativeEvent.offsetX;
        const boardY = event.nativeEvent.offsetY;

        let row = Math.floor(boardY / (height / numRows));
        if (player?.color === Color.Black) row = numRows - 1 - row;
        let col = Math.floor(boardX / (width / numCols));
        if (player?.color === Color.Black) col = numCols - 1 - col;

        // console.log(`Pointer Down at relative: x: ${event.pageX} y: ${event.pageY} row: ${row}, col: ${col}`);

        const square = {row, col};
        const piece = board.getPiece(square)

        if (piece === undefined) { // Outside the board
            deselect();
            return;
        }

        window.addEventListener("contextmenu", () => {
            deselect();
            setDraggedSquare(null);
        });

        if (promotionMove && col === promotionMove.to.col) {
            const rowDiff = Math.abs(row - promotionMove.to.row);
            if (rowDiff < promotionOptions.length) {
                selectPromotionPiece(promotionOptions[rowDiff]);
                return;
            }
        }

        const isLegalMove = isBluffing
            ? (piece === null || piece.color !== player?.color) && !legalMoves.concat(legalRuleMoves).some((move) => move.to.row === square.row && move.to.col === square.col)
            : legalMoves.concat(legalRuleMoves).some((move) => move.to.row === square.row && move.to.col === square.col);

        if (isLegalMove) {
            move(square);
        } else {
            if (piece && piece.color === player?.color) {
                startDrag(square);
            } else {
                deselect();
            }
        }

    }

    function handlePointerMove(event: PointerEvent) {
        const isOverBoard = event.target === boardRef.current;
        const boardX = event.offsetX;
        const boardY = event.offsetY;
        const x = event.pageX;
        const y = event.pageY;

        let row = Math.floor(boardY / ((boardRef.current?.scrollHeight || 0) / numRows));
        if (player?.color === Color.Black) row = numRows - 1 - row;
        let col = Math.floor(boardX / ((boardRef.current?.scrollWidth || 0) / numCols));
        if (player?.color === Color.Black) col = numCols - 1 - col;

        const piece = board.getPiece({row, col}) || null;

        if (isOverBoard) {
            setMouse(prevMouse => {
                if (piece && !prevMouse.piece && boardRef.current && boardRef.current.style.cursor !== "grabbing") {
                    boardRef.current.style.cursor = "grab";
                } else if (!piece && prevMouse.piece && boardRef.current && boardRef.current.style.cursor !== "grabbing") {
                    boardRef.current.style.cursor = "pointer";
                }
                return {x, y, row, col, piece}
            });
        } else {
            setMouse({x, y, row: null, col: null, piece: null});
            if (boardRef.current) boardRef.current.style.cursor = "pointer";
        }

        // console.log(`Pointer Move ${isOverBoard ? "over board" : ""} at x: ${x} y: ${y} row: ${row}, col: ${col}`);
    }

    function handlePointerUp(event: PointerEvent) {
        const isOverBoard = event.target === boardRef.current;
        const boardX = event.offsetX;
        const boardY = event.offsetY;

        let row = Math.floor(boardY / ((boardRef.current?.scrollHeight || 0) / numRows));
        if (player?.color === Color.Black) row = numRows - 1 - row;
        let col = Math.floor(boardX / ((boardRef.current?.scrollWidth || 0) / numCols));
        if (player?.color === Color.Black) col = numCols - 1 - col;

        if (isOverBoard) {
            setDragReleaseSquare({row, col});
        } else {
            deselect();
        }

        // console.log(`Pointer Up ${isOverBoard ? "over board" : ""} at x: ${event.pageX} y: ${event.pageY} row: ${row}, col: ${col}`);
        // console.log(event);
    }

    // Select a given square. If its own piece, set the legalMoves
    function select(square: SquareType) {
        setSelectedSquare(square);
        setLegalMoves(board.getLegalMoves(square, true));
        setPromotionMove(null);
        let newLegalRuleMoves: Move[] = [];
        for (const rule of player?.rules || []) {
            newLegalRuleMoves = newLegalRuleMoves.concat(rule.getLegalMoves(board, square));
        }
        setLegalRuleMoves(newLegalRuleMoves);
    }

    // Deselect a square
    function deselect() {
        setSelectedSquare(null);
        setLegalMoves([]);
        setLegalRuleMoves([]);
        setPromotionMove(null);
        setDraggedSquare(null);
    }

    // Move the currently selected square/piece to the given square
    function move(square: SquareType) {
        if (!selectedSquare) return;

        const movingPiece = board.getPiece(selectedSquare)
        if (!movingPiece) return;

        const isPromotion = movingPiece.pieceType === PieceType.Pawn &&
            ((movingPiece.color === Color.White && square.row === 0) ||
                (movingPiece.color === Color.Black && square.row === 7));

        if (isPromotion) {
            setPromotionMove({from: selectedSquare, to: square, piece: {type: movingPiece.pieceType, color: movingPiece.color}, bluff: isBluffing});
            setLegalMoves([]);
            setLegalRuleMoves([]);
            return;
        }

        handleMove({from: selectedSquare, to: square, piece: {type: movingPiece.pieceType, color: movingPiece.color}, bluff: isBluffing});
        setSelectedSquare(null);
        setLegalMoves([]);
        setLegalRuleMoves([]);
    }

    function startDrag(square: SquareType) {
        select(square);
        setDraggedSquare(square);
        if (boardRef.current) boardRef.current.style.cursor = "grabbing";
    }

    function endDrag(square: SquareType) {
        if (boardRef.current) {
            const piece = board.getPiece(square) || null;
            if (piece) boardRef.current.style.cursor = "grab";
            else boardRef.current.style.cursor = "pointer";
        }

        if (promotionMove) {
            return;
        }

        const piece = board.getPiece(square)

        if (piece === undefined) { // Outside the board
            deselect();
            return;
        }

        const isLegalMove = isBluffing
            ? (piece === null || piece.color !== player?.color) && !legalMoves.concat(legalRuleMoves).some((move) => move.to.row === square.row && move.to.col === square.col)
            : legalMoves.concat(legalRuleMoves).some((move) => move.to.row === square.row && move.to.col === square.col);

        if (isLegalMove) {
            move(square)
            return;
        }

        // Ensure that just clicking a piece maintains selection
        if (piece && piece.color === player?.color && square.row === selectedSquare?.row && square.col === selectedSquare.col) {
            return;
        }

        deselect();
    }

    function selectPromotionPiece(pieceType: PieceType) {
        setSelectedSquare(null);
        setLegalMoves([]);
        setLegalRuleMoves([]);

        if (!promotionMove) return;

        const move = promotionMove;
        move.promotion = pieceType;
        handleMove(move);
        setPromotionMove(null);
    }


    if (!board) return;

    return (
        <div
            ref={mergedBoardRef}
            className="grid grid-rows-8 grid-cols-8 relative max-w-[750px] aspect-square "
            style={{ touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onContextMenu={(e) => {
                e.preventDefault();
            }}
        >
            {rows.map((row) => (
                cols.map((col) => {
                    let movable = legalMoves.some((move) => move.to.row === row && move.to.col === col);
                    let ruleMovable = legalRuleMoves.some((move) => move.to.row === row && move.to.col === col);

                    if (isBluffing && selectedSquare !== null) {
                        movable = !(movable || ruleMovable) && board.grid[row][col]?.color !== player?.color;
                        ruleMovable = false;
                    }

                    let promotionOptionPieceType = null;
                    if (promotionMove && col === promotionMove.to.col) {
                        const rowDiff = Math.abs(row - promotionMove.to.row);
                        if (rowDiff < promotionOptions.length) {
                            promotionOptionPieceType = promotionOptions[rowDiff];
                        }
                    }
                    return <div key={col} className={"pointer-events-none select-none"} style={{ touchAction: "none" }}>
                        <Square row={row} col={col} color={player?.color || Color.White}
                                piece={draggedSquare?.row === row && draggedSquare?.col === col ? null : board?.grid?.[row]?.[col] || null}
                                hovered={mouse.row === row && mouse.col === col}
                                selected={selectedSquare?.row === row && selectedSquare?.col === col}
                                movable={movable}
                                ruleMovable={ruleMovable}
                                isBluffing={isBluffing}
                                promotionOptionPieceType={promotionOptionPieceType}
                                handleSelectPromotion={selectPromotionPiece}
                        />
                    </div>
                })
            ))}

            {draggedSquare && draggedPiece &&
                <Portal>
                    <div className={"absolute z-30 pointer-events-none cursor-grabbing"}
                         style={{
                             top: `calc(${mouse.y}px - ${squareSize/2}px)`,
                             left: `calc(${mouse.x}px - ${squareSize/2}px)`,
                             width: squareSize,
                             height: squareSize,
                         }}
                    >
                        <img src={pieceImages[draggedPieceString]} alt={draggedPieceString} width={squareSize} height={squareSize} draggable={false} className={"z-20 select-none pointer-events-none "} />

                    </div>
                </Portal>

            }
        </div>
    )
}



export default Board;