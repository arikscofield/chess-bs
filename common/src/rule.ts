import {Color, PieceType} from "./types.js";
import type {Move, Rule as RuleType, Square} from "./schemas/common.js";
import Board from "./board.js"


class Rule implements RuleType {
    id: number;
    name: string;
    description: string;
    pieceType: PieceType;
    getLegalMoves: (board: Board, square: Square) => Move[];

    constructor(id: number, name: string, description: string, pieceType: PieceType, getLegalMoves: (board: Board, square: Square) => Move[]) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.pieceType = pieceType;
        this.getLegalMoves = getLegalMoves;
    }


    public static getRandomRules(count: number, rulePool: Rule[] = allRules): Rule[] {
        let result = new Array(count),
            len = rulePool.length,
            taken = new Array(len);
        if (count > len)
            throw new RangeError("getRandom: more elements taken than available");
        while (count--) {
            let x = Math.floor(Math.random() * len);
            result[count] = rulePool[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }

    public static from(rule: Rule): Rule | undefined {
        return Rule.getRuleFromId(rule.id);
    }

    public static getRuleFromId(ruleId: number): Rule | undefined {
        const foundRule = allRules.find((rule) => rule.id === ruleId);
        if (!foundRule) return undefined;
        return new Rule(foundRule.id, foundRule.name, foundRule.description, foundRule.pieceType, foundRule.getLegalMoves);
    }

    public static getRulesFromIds(ruleIds: number[]): Rule[] {
        return ruleIds.map(id => this.getRuleFromId(id)).filter(rule => rule !== undefined);
    }
}

type StepMode = "move" | "capture" | "both";

/*
Get the moves for moving the piece on `square` one step to each `square + offset`
 */
function stepMoves(board: Board, square: Square, offsets: number[][], mode: StepMode): Move[] {
    const moves: Move[] = [];
    const piece = board.getPiece(square);
    if (!piece) return moves;

    for (const [dr = 0, dc = 0] of offsets) {
        const to = {row: square.row + dr, col: square.col + dc};
        const destPiece = board.getPiece(to);
        if (destPiece === undefined) continue; // Off the board

        const isEmpty = destPiece === null;
        const isEnemy = destPiece !== null && destPiece.color !== piece.color;
        if ((mode === "move" && isEmpty) || (mode === "capture" && isEnemy) || (mode === "both" && (isEmpty || isEnemy))) {
            moves.push({from: {row: square.row, col: square.col}, to, piece: {type: piece.pieceType, color: piece.color}});
        }
    }

    return moves;
}

/*
Removes moves that leave your own king in check (unless you are capturing opponents king)
 */
function filterOutChecks(board: Board, color: Color, moves: Move[]): Move[] {
    const opponentColor = color === Color.White ? Color.Black : Color.White;

    return moves.filter((move) => {
        const movedBoard = board.clone();
        movedBoard.applyMove({...move, promotion: move.promotion ?? PieceType.Queen});

        // Allow a move that puts yourself in check if you are capturing opponents king
        const opponentKingSquare = movedBoard.findKing(opponentColor);
        if (!opponentKingSquare) return true;

        const kingSquare = movedBoard.findKing(color);
        if (!kingSquare) return false;

        return movedBoard.attackers(kingSquare, opponentColor).length === 0;
    })
}

/*
Slides the piece on `square` along each direction, hopping over exactly one piece of its own color.
It can land on any empty square past the hopped piece, or capture the first enemy piece past it.
Lines are blocked by an enemy piece before the hop and by a second friendly piece.
 */
function hopMoves(board: Board, square: Square, directions: number[][]): Move[] {
    const moves: Move[] = [];
    const {row, col} = square;
    const piece = board.getPiece(square);
    if (!piece) return moves;

    for (const [dr = 0, dc = 0] of directions) {
        let destRow = row+dr;
        let destCol = col+dc;
        let hopped = false;
        let destPiece = board.getPiece({row: destRow, col: destCol});
        while (destPiece !== undefined) {
            if (destPiece && destPiece.color !== piece.color) {
                // An enemy piece blocks the line; it can only be captured after a hop
                if (hopped) moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                break;
            }
            if (destPiece) {
                if (hopped) break; // Second friendly piece
                hopped = true;
            } else if (hopped) {
                moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
            }
            destRow += dr;
            destCol += dc;
            destPiece = board.getPiece({row: destRow, col: destCol});
        }
    }

    return moves;
}


const ORTHOGONAL =[[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KNIGHT = [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]];

export const allRules: Rule[] = [
    new Rule(
        1,
        "Knighted Queen",
        "The queen can also move like a knight.",
        PieceType.Queen,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Queen) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, KNIGHT, "both"));
        }
    ),
    new Rule(
        2,
        "Backward Pawns",
        "Pawns can move backwards one space, but cannot attack backwards.",
        PieceType.Pawn,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Pawn) return [];

            const backwards = piece.color === Color.White ? 1 : -1;
            return filterOutChecks(board, piece.color, stepMoves(board, square, [[backwards, 0]], "move"));
        }
    ),
    new Rule(
        3,
        "Hopping Rook",
        "Rooks can hop over one piece of the same color.",
        PieceType.Rook,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Rook) return [];

            return filterOutChecks(board, piece.color, hopMoves(board, square, ORTHOGONAL));
        }
    ),
    new Rule(
        4,
        "Pawned Rook",
        "The rook can capture one space diagonally in any direction.",
        PieceType.Rook,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Rook) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, DIAGONAL, "capture"));
        }
    ),
    new Rule(
        5,
        "Square Knight",
        "The knight can move 2x2 in any direction.",
        PieceType.Knight,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Knight) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, [[2, 2], [2, -2], [-2, 2], [-2, -2]], "both"));
        }
    ),
    new Rule(
        6,
        "Hopping Bishop",
        "Bishops can hop over one piece of the same color.",
        PieceType.Bishop,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Bishop) return [];

            return filterOutChecks(board, piece.color, hopMoves(board, square, DIAGONAL));
        }
    ),
    new Rule(
        7,
        "Pawned Bishop",
        "The bishop can capture one space in any orthogonal direction.",
        PieceType.Bishop,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Bishop) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, ORTHOGONAL, "capture"));
        }
    ),
    new Rule(
        8,
        "Aggressive King",
        "The king can capture two spaces in any orthogonal direction.",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.King) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, [[2, 0], [-2, 0], [0, 2], [0, -2]], "capture"));
        }
    ),
    new Rule(
        9,
        "Sidestepping Pawns",
        "Pawns can move on space sideways, but cannot capture sideways.",
        PieceType.Pawn,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Pawn) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, [[0, 1], [0, -1]], "move"));
        }
    ),
    new Rule(
        10,
        "Charging Pawns",
        "Pawns can always move two spaces forward, not only on their first move.",
        PieceType.Pawn,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Pawn) return [];

            const direction = piece.color === Color.White ? -1 : 1;
            const {row, col} = square;
            if (board.getPiece({row: row+direction, col}) !== null) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, [[2*direction, 0]], "move"));
        }
    ),
    new Rule(
        11,
        "Camel Knight",
        "The knight can also jump 3x1 in any direction.",
        PieceType.Knight,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Knight) return [];

            const moveOptions = [[1, 3], [-1, 3], [1, -3], [-1, -3], [3, 1], [-3, 1], [3, -1], [-3, -1]];
            return filterOutChecks(board, piece.color, stepMoves(board, square, moveOptions, "both"));
        }
    ),
    new Rule(
        12,
        "Stepping Knight",
        "The knight can move one space in any orthogonal direction, but cannot capture that way.",
        PieceType.Knight,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Knight) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, ORTHOGONAL, "move"));
        }
    ),
    new Rule(
        13,
        "Stepping Bishop",
        "The bishop can move one space in any orthogonal direction, but cannot capture that way.",
        PieceType.Bishop,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Bishop) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, ORTHOGONAL, "move"));
        }
    ),
    new Rule(
        14,
        "Knighted King",
        "The king can also move like a knight.",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.King) return [];

            return filterOutChecks(board, piece.color, stepMoves(board, square, KNIGHT, "both"));
        }
    ),

]


export default Rule;