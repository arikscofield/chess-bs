import {type RefObject, useEffect, useRef, useState} from "react";
import Square from "./Square.tsx";
import {
    BoardColorType,
    Color,
    GameStatus, IndexToFile,
    type Move,
    type Piece,
    PieceType,
    type Player,
    type Square as SquareType,
    type Board as BoardType,
} from "@chess-bs/common";
import {useElementSize, useMergedRef, useMounted} from "@mantine/hooks";
import {pieceImages} from "../assets/pieceImages.ts";
import {Portal} from "@mantine/core";



function Board(
    {board, gameStatus, player, view=Color.White, turn, canMove, isBluffing, handleMove, highlightedMove, animateMove, } :
    { board: RefObject<BoardType | null>, gameStatus: GameStatus, player: Player | null, view: Color, turn: Color, canMove: boolean, isBluffing: boolean, handleMove: (move: Move) => void, highlightedMove: Move | null, animateMove: boolean }
) {
    const mounted = useMounted();

    type mouseState = {x: number; y: number, row: number | null, col: number | null, piece: Piece | null};
    const [mouse, setMouse] = useState<mouseState>({ x: 0, y: 0, row: 0, col: 0, piece: null });
    const { ref: sizeRef, width, height } = useElementSize();
    const boardRef = useRef<HTMLElement | null>(null);

    const mergedBoardRef = useMergedRef(sizeRef, boardRef);

    const [boardType, setBoardType] = useState<[string, string, string, string]>(BoardColorType.Brown);

    const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
    const [legalMoves, setLegalMoves] = useState<Move[]>([]);
    const [legalRuleMoves, setLegalRuleMoves] = useState<Move[]>([]);
    const [draggedSquare, setDraggedSquare] = useState<SquareType | null>(null);
    const [dragReleaseSquare, setDragReleaseSquare] = useState<SquareType | null>(null);
    const [promotionMove, setPromotionMove] = useState<Move | null>(null);

    const draggedPiece = draggedSquare ? board.current?.getPiece(draggedSquare) : null;
    const draggedPieceString: string = "" + draggedPiece?.color + draggedPiece?.pieceType;

    const highlightedMovePieceString: string = "" + highlightedMove?.piece.color + highlightedMove?.piece.type;

    const numRows: number = board.current?.grid.length || 0;
    const numCols: number = board.current?.grid[0].length || 0;
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
    }, [turn, canMove]);

    // handle the "queue" for the square that had a drag-release on it
    // Needed since we can't just call handleSquareAction inside the onPointerUp handler due to state closure
    useEffect(() => {
        if (dragReleaseSquare === null) return;

        endDrag(dragReleaseSquare);

        setDraggedSquare(null);
        setDragReleaseSquare(null);
    }, [dragReleaseSquare])

    function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (!canMove || turn !== player?.color || (gameStatus != GameStatus.RUNNING && gameStatus != GameStatus.WAITING_FOR_FIRST_MOVE)) return;

        const boardX = event.nativeEvent.offsetX;
        const boardY = event.nativeEvent.offsetY;

        let row = Math.floor(boardY / (height / numRows));
        if (player?.color === Color.Black) row = numRows - 1 - row;
        let col = Math.floor(boardX / (width / numCols));
        if (player?.color === Color.Black) col = numCols - 1 - col;

        // console.log(`Pointer Down at relative: x: ${event.pageX} y: ${event.pageY} row: ${row}, col: ${col}`);

        const square = {row, col};
        const piece = board.current?.getPiece(square)

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

        const width = boardRef.current?.offsetWidth || 0;
        const height = boardRef.current?.offsetHeight || 0;

        let row = Math.floor(boardY / (height / numRows));
        if (player?.color === Color.Black) row = numRows - 1 - row;
        let col = Math.floor(boardX / (width / numCols));
        if (player?.color === Color.Black) col = numCols - 1 - col;



        const piece = board.current?.getPiece({row, col}) || null;

        // console.log("Over board:", isOverBoard, " boardXY:", boardX, boardY, " xy:", x, y, " row:", row, " col:", col, " piece:", piece?.pieceType);

        if (isOverBoard) {
            if (piece && boardRef.current && boardRef.current.style.cursor !== "grabbing") {
                boardRef.current.style.cursor = "grab";
            } else if (!piece && boardRef.current && boardRef.current.style.cursor !== "grabbing") {
                boardRef.current.style.cursor = "pointer";
            }
            setMouse({x, y, row, col, piece});
        } else {
            setMouse({x, y, row: null, col: null, piece: null});
            if (boardRef.current) boardRef.current.style.cursor = "default";
        }

        // console.log(`Pointer Move ${isOverBoard ? "over board" : ""} at x: ${x} y: ${y} row: ${row}, col: ${col}`);
    }

    function handlePointerUp(event: PointerEvent) {
        if (!canMove) return; // TODO: Change when adding right-click arrow annotating

        const isOverBoard = event.target === boardRef.current;
        const boardX = event.offsetX;
        const boardY = event.offsetY;

        const width = boardRef.current?.offsetWidth || 0;
        const height = boardRef.current?.offsetHeight || 0;

        let row = Math.floor(boardY / (height / numRows));
        if (player?.color === Color.Black) row = numRows - 1 - row;
        let col = Math.floor(boardX / (width / numCols));
        if (player?.color === Color.Black) col = numCols - 1 - col;

        if (isOverBoard) {
            setDragReleaseSquare({row, col});
        }

        // console.log(`Pointer Up ${isOverBoard ? "over board" : ""} at x: ${event.pageX} y: ${event.pageY} row: ${row}, col: ${col}`);
        // console.log(event);
    }

    // Select a given square. If its own piece, set the legalMoves
    function select(square: SquareType) {
        // console.log("Selected square:", square);
        if (!board.current) return;
        setSelectedSquare(square);
        setLegalMoves(board.current.getLegalMoves(square, true));
        setPromotionMove(null);
        let newLegalRuleMoves: Move[] = [];
        for (const rule of player?.rules || []) {
            newLegalRuleMoves = newLegalRuleMoves.concat(rule.getLegalMoves(board.current, square));
        }
        setLegalRuleMoves(newLegalRuleMoves);
    }

    // Deselect a square
    function deselect() {
        // console.log("Deselect square:", square);
        setSelectedSquare(null);
        setLegalMoves([]);
        setLegalRuleMoves([]);
        setPromotionMove(null);
        setDraggedSquare(null);
    }

    // Move the currently selected square/piece to the given square
    function move(square: SquareType) {
        if (!selectedSquare) return;

        const movingPiece = board.current?.getPiece(selectedSquare)
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
            const piece = board.current?.getPiece(square) || null;
            if (piece) boardRef.current.style.cursor = "grab";
            else boardRef.current.style.cursor = "pointer";
        }

        if (promotionMove) {
            return;
        }

        const piece = board.current?.getPiece(square);

        if (piece === undefined) { // Outside the board
            // console.log("Deselect due to end drag outside the board")
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


    if (board.current === null) return;

    return (
        <div
            className={"relative aspect-square w-full h-full "}
        >
            {/* Rank and File labels */}
            <div className={"absolute w-full h-full grid grid-rows-8 grid-cols-8 aspect-square pointer-events-none"}>
                {rows.map((row, i) => (
                    cols.map((col, j) => {
                        return <div key={col} className={"w-full h-full relative"}>
                            {i == numRows-1 && (
                                <span className={`absolute z-20 bottom-0 right-0.5  ${(i+j)%2 ? boardType[2] : boardType[3]}`}>
                                    {IndexToFile[col]}
                                </span>
                            )}
                            {j == 0 && (
                                <span className={`absolute z-20 top-0 left-0.5  ${(i+j)%2 ? boardType[2] : boardType[3]}`}>
                                    {numRows-row}
                                </span>
                            )}
                        </div>
                    })
                ))}
            </div>


            <div
                ref={mergedBoardRef}
                className="grid grid-rows-8 grid-cols-8 relative aspect-square w-full h-full "
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
                            movable = !(movable || ruleMovable) && board.current?.grid[row][col]?.color !== player?.color;
                            ruleMovable = false;

                            // Don't allow bluffing into check (Except if capturing opponents king
                            if (movable) {
                                const piece = board.current?.getPiece(selectedSquare);
                                if (piece && board.current?.getPiece({row: row, col: col})?.pieceType !== PieceType.King) {
                                    const move: Move = {from: selectedSquare, to: {row: row, col: col}, piece: {type: piece.pieceType, color: piece.color}}
                                    const movedBoard = board.current?.clone();
                                    if (!movedBoard) return
                                    movedBoard.applyMove(move);
                                    const kingSquare = movedBoard.findKing(piece.color);
                                    if (kingSquare && movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White).length > 0) {
                                        movable = false;
                                    }
                                }
                            }
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
                                    piece={(draggedSquare?.row === row && draggedSquare?.col === col) || (animateMove && highlightedMove?.to.row === row && highlightedMove?.to.col === col) ? null : board.current?.grid?.[row]?.[col] || null}
                                    hovered={mouse.row === row && mouse.col === col}
                                    selected={selectedSquare?.row === row && selectedSquare?.col === col}
                                    highlighted={(highlightedMove?.to.row === row && highlightedMove?.to.col === col) || (highlightedMove?.from.row === row && highlightedMove?.from.col === col)}
                                    movable={movable}
                                    ruleMovable={ruleMovable}
                                    isBluffing={isBluffing}
                                    promotionOptionPieceType={promotionOptionPieceType}
                                    handleSelectPromotion={selectPromotionPiece}
                                    boardType={boardType}
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


                {highlightedMove &&
                    <div
                        className={`absolute pointer-events-none z-10 ${animateMove ? "transition-transform duration-300 ease-in-out" : "opacity-0"}`}
                        style={{
                            width: squareSize,
                            height: squareSize,
                            top: ((player?.color === Color.Black ? numRows - 1 - highlightedMove?.from.row : highlightedMove?.from.row) || 0) * squareSize,
                            left: ((player?.color === Color.Black ? numCols - 1 - highlightedMove?.from.col : highlightedMove?.from.col) || 0) * squareSize,
                            transform: animateMove ? `translate(
                            ${( (highlightedMove?.to.col || 0) - (highlightedMove?.from.col || 0) ) * squareSize * (player?.color === Color.Black ? -1 : 1)}px,
                            ${( (highlightedMove?.to.row || 0) - (highlightedMove?.from.row || 0) ) * squareSize * (player?.color === Color.Black ? -1 : 1)}px
                            )`
                            : "translate(0, 0)",

                        }}
                    >
                        <img src={pieceImages[highlightedMovePieceString]} alt={highlightedMovePieceString} width={squareSize} height={squareSize} draggable={false} className={"z-10 select-none pointer-events-none "} />
                </div>
                }
            </div>
        </div>
    )
}



export default Board;