import {
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";
import Square from "./Square.tsx";
import {
    BoardColorType,
    Color,
    GameStatus, IndexToFile,
    type Move,
    PieceType, type PlayerDTO,
    type Square as SquareType,
} from "@chess-bs/common";
import {useElementSize, useMergedRef} from "@mantine/hooks";
import {pieceImages} from "../assets/pieceImages.ts";
import {Portal} from "@mantine/core";
import BoardClass from "@chess-bs/common/src/board"
import Rule from "@chess-bs/common/src/rule.js";



function Board({board, gameStatus, player, view=Color.White, turn, canMove, isBluffing, handleMove, highlightedMove}: {
    board: BoardClass | null,
    gameStatus: GameStatus,
    player: PlayerDTO | null,
    view: Color,
    turn: Color,
    canMove: boolean,
    isBluffing: boolean,
    handleMove: (move: Move) => void,
    highlightedMove: Move | null
}) {


    // State
    const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
    const [legalMoves, setLegalMoves] = useState<Move[]>([]);
    const [legalRuleMoves, setLegalRuleMoves] = useState<Move[]>([]);
    const [draggedSquare, setDraggedSquare] = useState<SquareType | null>(null);
    const [promotionMove, setPromotionMove] = useState<Move | null>(null);
    const [hovered, setHovered] = useState<{row: number | null; col: number | null}>({row: null, col: null});

    const [boardType, ] = useState<[string, string, string, string]>(BoardColorType.Brown);

    const { ref: sizeRef, width, height } = useElementSize();
    const boardElementRef = useRef<HTMLElement | null>(null);
    const mergedBoardRef = useMergedRef(sizeRef, boardElementRef);


    const draggedPiecePortalRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef<boolean>(false);
    const lastPointerPosRef = useRef({x: 0, y: 0});

    const playerRules = Rule.getRulesFromIds(player?.ruleIds ?? []);

    const draggedPiece = draggedSquare ? board?.getPiece(draggedSquare) : null;
    const draggedPieceString: string = "" + draggedPiece?.color + draggedPiece?.pieceType;

    const numRows: number = board?.grid.length || 0;
    const numCols: number = board?.grid[0].length || 0;
    const rows = view === Color.White
        ? Array.from({length: numRows}, (_, i) => i)
        : Array.from({length: numRows}, (_, i) => i).toReversed();
    const cols = view === Color.White
        ? Array.from({length: numCols}, (_, i) => i)
        : Array.from({length: numCols}, (_, i) => i).toReversed();
    const promotionOptions = [PieceType.Queen, PieceType.Knight, PieceType.Rook, PieceType.Bishop];
    const squareSize = width / 8;


    // Helper to calculate row/col from pointer event
    const getRowColFromEvent = (e: PointerEvent) => {
        if (!boardElementRef.current) return {row: -1, col: -1};
        const w = boardElementRef.current.offsetWidth;
        const h = boardElementRef.current.offsetHeight;
        const r = Math.floor(e.offsetY / (h / numRows));
        const c = Math.floor(e.offsetX / (w / numCols));
        return view === Color.Black ? {row: numRows - 1 - r, col: numCols - 1 - c} : {row: r, col: c};
    };

    function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
        lastPointerPosRef.current = {x: e.pageX, y: e.pageY};

        if (!boardElementRef.current) return;

        const {row, col} = getRowColFromEvent(e.nativeEvent as unknown as PointerEvent);

        if (draggedPiecePortalRef.current) {
            const squareSize = boardElementRef.current.offsetWidth / 8;
            draggedPiecePortalRef.current.style.left = `${e.pageX - squareSize / 2}px`;
            draggedPiecePortalRef.current.style.top = `${e.pageY - squareSize / 2}px`;
        }

        if (hovered.row !== row || hovered.col !== col) {
            setHovered({row, col});
        }

        if (isDraggingRef.current) {
            boardElementRef.current.style.cursor = "grabbing";
        } else {
            const piece = board?.getPiece({row, col}) || null;
            boardElementRef.current.style.cursor = piece ? "grab" : "pointer";
        }
    }

    function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        if (!canMove || turn !== player?.color || (gameStatus !== GameStatus.RUNNING && gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE)) return;

        const {row, col} = getRowColFromEvent(event.nativeEvent as unknown as PointerEvent);

        // console.log(`Pointer Down at relative: x: ${event.pageX} y: ${event.pageY} row: ${row}, col: ${col}`);

        const square = {row, col};
        const piece = board?.getPiece(square);

        if (piece === undefined) { // Outside the board
            deselect();
            return;
        }

        lastPointerPosRef.current = {x: event.pageX, y: event.pageY};

        // window.addEventListener("contextmenu", () => {
        //     deselect();
        //     setDraggedSquare(null);
        // });

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
        } else if (piece && piece.color === player?.color) {
            startDrag(square);
        } else {
            deselect();
        }

    }

    function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
        isDraggingRef.current = false;
        if (!canMove) return; // TODO: Change when adding right-click arrow annotating
        const isOverBoard = e.target === boardElementRef.current;
        const {row, col} = getRowColFromEvent(e.nativeEvent as unknown as PointerEvent);

        if (isOverBoard) {
            endDrag({row, col});

            setDraggedSquare(null);
        }
        // console.log(`Pointer Up ${isOverBoard ? "over board" : ""} at x: ${event.pageX} y: ${event.pageY} row: ${row}, col: ${col}`);
    }

    // Reset selected squares on move
    useEffect(() => {
        setSelectedSquare(null);
        setLegalMoves([]);
        setLegalRuleMoves([]);
    }, [turn, canMove]);


    // Select a given square. If its own piece, set the legalMoves
    function select(square: SquareType) {
        // console.log("Selected square:", square);
        if (!board)
            return;
        setSelectedSquare(square);
        setLegalMoves(board.getLegalMoves(square, true));
        setPromotionMove(null);
        let newLegalRuleMoves: Move[] = [];
        for (const rule of playerRules || []) {
            newLegalRuleMoves = newLegalRuleMoves.concat(rule.getLegalMoves(board, square));
        }
        setLegalRuleMoves(playerRules?.flatMap(rule => rule.getLegalMoves(board, square)) || []);
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

        const movingPiece = board?.getPiece(selectedSquare)
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
        isDraggingRef.current = true;
        if (boardElementRef.current) boardElementRef.current.style.cursor = "grabbing";
        requestAnimationFrame(() => {
            if (draggedPiecePortalRef.current && boardElementRef.current) {
                const squareSize = boardElementRef.current.offsetWidth / 8;
                const {x, y} = lastPointerPosRef.current;
                draggedPiecePortalRef.current.style.left = `${x - squareSize / 2}px`;
                draggedPiecePortalRef.current.style.top = `${y - squareSize / 2}px`;
            }
        });
    }

    function endDrag(square: SquareType) {
        const piece = board?.getPiece(square);

        if (boardElementRef.current) {
            boardElementRef.current.style.cursor = piece ? "grab" : "pointer";
        }

        if (promotionMove) return;

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


    if (board === null) return;

    return (
        <div
            className={"relative aspect-square w-full max-w-full "}
        >
            {/* Rank and File labels */}
            <div className={"absolute w-full h-full grid grid-rows-8 grid-cols-8 aspect-square pointer-events-none"}>
                {rows.map((row, i) => (
                    cols.map((col, j) => {
                        return <div key={col} className={"w-full h-full relative"}>
                            {i === numRows-1 && (
                                <span className={`absolute z-20 bottom-0 right-0.5  ${(i+j)%2 ? boardType[2] : boardType[3]}`}>
                                    {IndexToFile[col]}
                                </span>
                            )}
                            {j === 0 && (
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
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
                onContextMenu={(e) => {
                    e.preventDefault();
                }}
            >
                {rows.map((row) => (
                    cols.map((col) => {
                        let movable = legalMoves.some((move) => move.to.row === row && move.to.col === col);
                        let ruleMovable = legalRuleMoves.some((move) => move.to.row === row && move.to.col === col);

                        if (isBluffing && selectedSquare !== null) {
                            movable = !(movable || ruleMovable) && board?.grid[row][col]?.color !== player?.color;
                            ruleMovable = false;

                            // Don't allow bluffing into check (Except if capturing opponents king
                            if (movable) {
                                const piece = board?.getPiece(selectedSquare);
                                if (piece && board?.getPiece({row: row, col: col})?.pieceType !== PieceType.King) {
                                    const move: Move = {from: selectedSquare, to: {row: row, col: col}, piece: {type: piece.pieceType, color: piece.color}}
                                    const movedBoard = board?.clone();
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
                                    piece={draggedSquare?.row === row && draggedSquare?.col === col ? null : board?.grid?.[row]?.[col] || null}
                                    hovered={hovered.row === row && hovered.col === col}
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
                        <div
                            ref={draggedPiecePortalRef}
                            className={"absolute z-30 pointer-events-none cursor-grabbing"}
                             style={{
                                 // top: `calc(${mouse.current.y}px - ${squareSize/2}px)`,
                                 // left: `calc(${mouse.current.x}px - ${squareSize/2}px)`,
                                 // top: `calc(${mouse.y}px - ${squareSize/2}px)`,
                                 // left: `calc(${mouse.x}px - ${squareSize/2}px)`,
                                 width: squareSize,
                                 height: squareSize,
                             }}
                        >
                            <img src={pieceImages[draggedPieceString]} alt={draggedPieceString} width={squareSize} height={squareSize} draggable={false} className={"z-20 select-none pointer-events-none "} />

                        </div>
                    </Portal>

                }
            </div>
        </div>
    )
}



export default Board;