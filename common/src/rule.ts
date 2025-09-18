import {Board, Color, Move, PieceType, Rule as RuleType, Square} from "./types";


class Rule implements RuleType {
    name: string;
    description: string;
    pieceType: PieceType;
    getLegalMoves: (board: Board, square: Square) => Move[];

    constructor(name: string, description: string, pieceType: PieceType, getLegalMoves: (board: Board, square: Square) => Move[]) {
        this.name = name;
        this.description = description;
        this.pieceType = pieceType;
        this.getLegalMoves = getLegalMoves;
    }


    public static getRandomRules(count: number): Rule[] {
        const shuffledRules: Rule[] = [...allRules].sort(() => Math.random());
        return shuffledRules.slice(0, count);
    }
}


export const allRules: RuleType[] = [
    new Rule(
        "Knighted Queen",
        "The queen can also move like a knight",
        PieceType.Queen,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Queen) return moves;

            const moveOptions = [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]];
            for (const [dr, dc] of moveOptions) {
                const destPiece = board.getPiece({row: row+dr, col: col+dc});
                if (destPiece !== undefined && (destPiece == null || destPiece.color !== piece.color)) {
                    moves.push({from: {row, col}, to: {row: row+dr, col: col+dc}, piece: {type: piece.pieceType, color: piece.color}});
                }
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);
                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        "Backward Pawns",
        "Pawns can move backwards one space, but cannot attack backwards.",
        PieceType.Pawn,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Pawn) return moves;

            const direction = piece.color === Color.White ? 1 : -1;
            const destPiece = board.getPiece({row: row+direction, col: col});

            if (destPiece === null) {
                moves.push({from: {row, col}, to: {row: row+direction, col: col}, piece: {type: piece.pieceType, color: piece.color}});
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);
                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),

]


export default Rule;