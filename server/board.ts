import type {Color, Move, Piece, Square} from "@chess-bs/common";

/*

      rank

      ...
      2(3)
      1(2)
      0(1)
 file     0(a) 1(b) 2(c) ...

 */
export default class Board {
    grid: (Piece | null)[][];


    constructor() {
        this.grid = [];
    }


    /*
    Get the list of squares that can attack the given square.
    Only gets the pieces of the given color
     */
    public attackers(square: Square, color: Color): Square[] {
        const squares: Square[] = [];



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

    public applyMove(move: Move): boolean {
        const {from, to} = move;

        if (!this.setPiece(to, this.getPiece(from) || null)) {
            return false;
        }
        return this.setPiece(from, null);
    }
}