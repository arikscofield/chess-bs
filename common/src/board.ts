import {Color, Move, Piece, PieceType, Square} from "./types";
import PieceClass from "./piece"
import {defaultFEN, parseFen} from "./helper";

/*

      row

      ...
      2(3)
      1(2)
      0(1)
 col     0(a) 1(b) 2(c) ...

 */
export default class Board {
    grid: (Piece | null)[][];
    enPassant: Square | null;


    constructor(grid?: (Piece | null)[][], enPassant?: Square | null) {
        if (grid) {
            this.grid = grid;
        } else {
            this.grid = [];
        }

        if (enPassant) {
            this.enPassant = enPassant;
        } else {
            this.enPassant = null;
        }
    }


    public static defaultBoard() {
        const {grid, turn, enPassant, halfMove, fullMove} = parseFen(defaultFEN);

        const newBoard = new Board();
        newBoard.grid = grid;
        newBoard.enPassant = enPassant;

        return newBoard;
    }

    /*
    Get the list of squares that can attack the given square.
    Only gets the pieces of the given color
     */
    public attackers(square: Square, color: Color): Square[] {
        const squares: Square[] = [];

        for (const [rowIndex, row] of this.grid.entries()) {
            for (const [colIndex, piece] of row.entries()) {
                const piece = this.getPiece({row: rowIndex, col: colIndex});
                if (!piece || piece.color !== color) continue;
                const legalMoves = this.getLegalMoves({row: rowIndex, col: colIndex}, false, false);
                if (legalMoves.some(move => move.to.row === square.row && move.to.col === square.col)) {
                    squares.push({row: rowIndex, col: colIndex});
                }
            }
        }

        return squares;

    }


    /*
    Return the piece on the given square
    If the square has no piece, returns null
    If the square isn't a valid square, returns undefined
     */
    public getPiece(square: Square): Piece | null | undefined {
        const {row, col} = square;

        return this.grid[row]?.[col];
    }

    public setPiece(square: Square, piece: Piece | null): boolean {
        const {row, col} = square;

        if (this.grid[row]?.[col] === undefined) {
            return false;
        } else {
            this.grid[row][col] = piece;
            return true;
        }
    }

    /**
     * Applies a move to the board.
     * Does not do any check for legality
     * @param move
     */
    public applyMove(move: Move): boolean {
        const {from, to} = move;
        const movingPiece = this.getPiece(from);
        if (!movingPiece) return false;

        const isCastle = movingPiece.pieceType === PieceType.King && !movingPiece.hasMoved && Math.abs(from.col - to.col) == 2;
        const isDoublePawn = movingPiece.pieceType === PieceType.Pawn && Math.abs(from.row - to.row) > 1;
        const isEnPassant = movingPiece.pieceType === PieceType.Pawn && to.row === this.enPassant?.row && to.col === this.enPassant?.col;
        const isPromotion = movingPiece.pieceType === PieceType.Pawn &&
                ((movingPiece.color === Color.White && to.row === 0) ||
                (movingPiece.color === Color.Black && to.row === 7));

        if (isPromotion && move.promotion === undefined) return false; // Must promote

        if (!this.setPiece(to, movingPiece)) {
            return false;
        }
        movingPiece.hasMoved = true;

        // Castling
        if (isCastle && from.col > to.col) {
            const rook = this.getPiece({row: from.row, col: 0});
            if (rook && rook.pieceType === PieceType.Rook && !rook.hasMoved) {
                rook.hasMoved = true;
                this.setPiece({row: from.row, col: to.col+1}, rook);
                this.setPiece({row: from.row, col: 0}, null);
            }
        } else if (isCastle && from.col < to.col) {
            const rook = this.getPiece({row: from.row, col: 7});
            if (rook && rook.pieceType === PieceType.Rook && !rook.hasMoved) {
                rook.hasMoved = true;
                this.setPiece({row: from.row, col: to.col-1}, rook);
                this.setPiece({row: from.row, col: 7}, null);
            }

        }

        // En Passant
        const direction = movingPiece.color === Color.White ? -1 : 1;
        if (isDoublePawn) {
            this.enPassant = {row: from.row + direction, col: from.col};
        } else {
            this.enPassant = null;
        }

        if (isEnPassant) {
            this.setPiece({row: to.row-direction, col: to.col}, null);
        }


        // Pawn Promotion
        if (isPromotion && move.promotion) {
            movingPiece.pieceType = move.promotion;
        }


        return this.setPiece(from, null);
    }

    /*
    Gets the legal moves of this piece, assuming it is at the square given.
    filterOutChecks prunes the legal moves of any that result in own king being in check
     */
    public getLegalMoves(square: Square, filterOutChecks=true, castle=true): Move[] {

        let moves: Move[] = [];
        const {row, col} = square;
        const piece = this.getPiece(square);
        if (!piece) return [];
        let moveOptions: [number, number][] = [];

        switch (piece.pieceType) {
            case PieceType.Pawn:
                const direction = piece.color === Color.White ? -1 : 1;

                // Single forward move
                if (this.getPiece({row: row+direction, col}) === null) {
                    moves.push({from: {row, col}, to: {row: row+direction, col}, piece: {type: piece.pieceType, color: piece.color} });
                }

                // Double forward move
                if (!piece.hasMoved && this.getPiece({row: row+direction, col}) === null && this.getPiece({row: row+(2*direction), col}) === null) {
                    moves.push({from: {row, col}, to: {row: row+(2*direction), col}, piece: {type: piece.pieceType, color: piece.color}});
                }

                // Diagonal Capture
                let destPiece = this.getPiece({row: row+direction, col: col+1});
                if (destPiece && destPiece.color !== piece.color) {
                    moves.push({from: {row, col}, to: {row: row+direction, col: col+1}, piece: {type: piece.pieceType, color: piece.color}});
                }
                destPiece = this.getPiece({row: row+direction, col: col-1});
                if (destPiece && destPiece.color !== piece.color) {
                    moves.push({from: {row, col}, to: {row: row+direction, col: col-1}, piece: {type: piece.pieceType, color: piece.color}});
                }

                // En Passant
                if (this.enPassant?.row === row+direction && this.enPassant?.col === col+1) {
                    moves.push({from: {row, col}, to: {row: row+direction, col: col+1}, piece: {type: piece.pieceType, color: piece.color}});
                }
                if (this.enPassant?.row === row+direction && this.enPassant?.col === col-1) {
                    moves.push({from: {row, col}, to: {row: row+direction, col: col-1}, piece: {type: piece.pieceType, color: piece.color}});
                }

                break;
            case PieceType.Knight:
                moveOptions = [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]];
                for (const [dr, dc] of moveOptions) {
                    const destPiece = this.getPiece({row: row+dr, col: col+dc});
                    if (destPiece !== undefined && (destPiece == null || destPiece.color !== piece.color)) {
                        moves.push({from: {row, col}, to: {row: row+dr, col: col+dc}, piece: {type: piece.pieceType, color: piece.color}});
                    }
                }
                break;
            case PieceType.Rook:
                moveOptions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
                for (const [dr, dc] of moveOptions) {
                    let destRow = row+dr;
                    let destCol = col+dc;
                    let destPiece = this.getPiece({row: destRow, col: destCol});
                    while (destPiece !== undefined && destPiece?.color !== piece.color) {
                        moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                        if (destPiece !== null) break; // Ended on an enemy piece; stop here
                        destRow += dr;
                        destCol += dc;
                        destPiece = this.getPiece({row: destRow, col: destCol});
                    }
                }
                break;
            case PieceType.Bishop:
                for (const dr of [-1, 1]) {
                    for (const dc of [-1, 1]) {
                        let destRow = row+dr;
                        let destCol = col+dc;
                        let destPiece = this.getPiece({row: destRow, col: destCol});
                        while (destPiece !== undefined && destPiece?.color !== piece.color) {
                            moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                            if (destPiece !== null) break; // Ended on an enemy piece; stop here
                            destRow += dr;
                            destCol += dc;
                            destPiece = this.getPiece({row: destRow, col: destCol});
                        }
                    }
                }
                break;
            case PieceType.Queen:
                for (const dr of [-1, 0, 1]) {
                    for (const dc of [-1, 0, 1]) {
                        let destRow = row+dr;
                        let destCol = col+dc;
                        let destPiece = this.getPiece({row: destRow, col: destCol});
                        while (destPiece !== undefined && destPiece?.color !== piece.color) {
                            moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                            if (destPiece !== null) break; // Ended on an enemy piece; stop here
                            destRow += dr;
                            destCol += dc;
                            destPiece = this.getPiece({row: destRow, col: destCol});
                        }
                    }
                }
                break;
            case PieceType.King:
                moveOptions = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [0, -1], [1, -1], [1, 0], [1, 1]];
                for (const [dr, dc] of moveOptions) {
                    const destPiece = this.getPiece({row: row+dr, col: col+dc});
                    if (destPiece !== undefined && (destPiece == null || destPiece.color !== piece.color)) {
                        moves.push({from: {row, col}, to: {row: row+dr, col: col+dc}, piece: {type: piece.pieceType, color: piece.color}});
                    }
                }

                // Castling
                // King can't have been moved before, and cannot be in check
                if (castle && !piece.hasMoved && this.attackers({row, col}, piece.color === Color.White ? Color.Black : Color.White).length === 0) {

                    // Rook cannot have been moved
                    const queenSidePiece = this.getPiece({row: row, col: 0});
                    if (queenSidePiece && queenSidePiece.pieceType === PieceType.Rook && !queenSidePiece.hasMoved) {
                        let canCastle = true;
                        for (let dc=-1; dc >= -3; dc--) {
                            // Cannot have pieces in the way, and cannot castle "through" check. aka, the squares in between can't have any attackers
                            if (this.getPiece({row: row, col: col+dc}) || this.attackers({row: row, col: col+dc}, piece.color === Color.White ? Color.Black : Color.White).length > 0) {
                                canCastle = false;
                                break;
                            }
                        }
                        if (canCastle) {
                            moves.push({from: {row, col}, to: {row: row, col: col-2}, piece: {type: piece.pieceType, color: piece.color}});
                        }
                    }

                    // Same thing on king side
                    const kingSidePiece = this.getPiece({row: row, col: 7});
                    if (kingSidePiece && kingSidePiece.pieceType === PieceType.Rook && !kingSidePiece.hasMoved) {
                        let canCastle = true;
                        for (let dc=1; dc <= 2; dc++) {
                            if (this.getPiece({row: row, col: col+dc}) || this.attackers({row: row, col: col+dc}, piece.color === Color.White ? Color.Black : Color.White).length > 0) {
                                canCastle = false;
                                break;
                            }
                        }
                        if (canCastle) {
                            moves.push({from: {row, col}, to: {row: row, col: col+2}, piece: {type: piece.pieceType, color: piece.color}});
                        }
                    }
                }

                break;
            default:
                break;
        }

        if (filterOutChecks) {
            moves = moves.filter((move) => {
                const movedBoard = this.clone();
                movedBoard.applyMove(move);
                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })
        }

        return moves;
    }

    /*
    Find the king of the specified color. Returns null if no king is found
     */
    public findKing(color: Color): Square | null {
        for (const [rowIndex, row] of this.grid.entries()) {
            for (const [colIndex, piece] of row.entries()) {
                if (!piece) continue;
                if (piece.pieceType === PieceType.King && piece.color === color) {
                    return {row: rowIndex, col: colIndex};
                }
            }
        }
        return null;
    }


    /**
     * Get the location/squares of all of the pieces of a specific color and piece type
     * @param type
     * @param color
     */
    public findPieces(type: PieceType, color: Color): Square[] {
        const squares: Square[] = [];

        for (let [r, row] of this.grid.entries()) {
            for (let [c, piece] of row.entries()) {
                if (piece && piece.color === color && piece.pieceType == type) {
                    squares.push({row: r, col: c})
                }
            }
        }


        return squares;
    }


    public clone(): Board {
        const newGrid: (Piece | null)[][] = this.grid.map(row => row.map(piece => {
            if (!piece) return null;
            const newPiece = new PieceClass(piece.pieceType, piece.color);
            newPiece.hasMoved = piece.hasMoved;
            return newPiece;
        }))
        const newEnPassant: Square | null = this.enPassant ? { row: this.enPassant.row, col: this.enPassant.col } : null;
        return new Board(newGrid, newEnPassant);
    }
}