import {Board, Color, Move, PieceType, Rule as RuleType, Square} from "./types";


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
}


export const allRules: RuleType[] = [
    new Rule(
        1,
        "Knighted Queen",
        "The queen can also move like a knight.",
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

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        2,
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

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        3,
        "Hopping Rook",
        "Rooks can hop over one piece of the same color.",
        PieceType.Rook,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Rook) return moves;

            const moveOptions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (const [dr, dc] of moveOptions) {
                let destRow = row+dr;
                let destCol = col+dc;
                let piecesHopped = 0;
                let destPiece = board.getPiece({row: destRow, col: destCol});
                while (destPiece !== undefined ) {
                    if (piecesHopped > 0 && destPiece && destPiece.color !== piece.color) {
                        moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                        break
                    }

                    if (piecesHopped > 0 && destPiece?.color !== piece.color) {
                        moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                    }

                    if (destPiece && destPiece.color === piece.color) {
                        if (piecesHopped >= 1) {
                            break;
                        }
                        piecesHopped++;
                    }

                    destRow += dr;
                    destCol += dc;
                    destPiece = board.getPiece({row: destRow, col: destCol});
                }
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        4,
        "Pawned Rook",
        "The rook can capture one space diagonally in any direction.",
        PieceType.Rook,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Rook) return moves;

            const moveOptions = [[1, -1], [1, 1], [-1, -1], [-1, 1]];
            for (const [dr, dc] of moveOptions) {
                const destRow = row + dr;
                const destCol = col + dc;
                const destPiece = board.getPiece({row: destRow, col: destCol});

                if (destPiece && destPiece.color !== piece.color) {
                    moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                }
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        5,
        "Square Knight",
        "The knight can move 2x2 in any direction.",
        PieceType.Knight,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Knight) return moves;

            const moveOptions = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
            for (const [dr, dc] of moveOptions) {
                const destRow = row + dr;
                const destCol = col + dc;
                const destPiece = board.getPiece({row: destRow, col: destCol});

                if (destPiece === null || (destPiece && destPiece.color !== piece.color)) {
                    moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                }
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        6,
        "Hopping Bishop",
        "Bishops can hop over one piece of the same color.",
        PieceType.Bishop,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Bishop) return moves;

            const moveOptions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
            for (const [dr, dc] of moveOptions) {
                let destRow = row+dr;
                let destCol = col+dc;
                let piecesHopped = 0;
                let destPiece = board.getPiece({row: destRow, col: destCol});
                while (destPiece !== undefined ) {
                    if (piecesHopped > 0 && destPiece && destPiece.color !== piece.color) {
                        moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                        break
                    }

                    if (piecesHopped > 0 && destPiece?.color !== piece.color) {
                        moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                    }

                    if (destPiece && destPiece.color === piece.color) {
                        if (piecesHopped >= 1) {
                            break;
                        }
                        piecesHopped++;
                    }

                    destRow += dr;
                    destCol += dc;
                    destPiece = board.getPiece({row: destRow, col: destCol});
                }
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        7,
        "Pawned Bishop",
        "The bishop can capture one space in any orthogonal direction.",
        PieceType.Bishop,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.Bishop) return moves;

            const moveOptions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (const [dr, dc] of moveOptions) {
                const destRow = row + dr;
                const destCol = col + dc;
                const destPiece = board.getPiece({row: destRow, col: destCol});

                if (destPiece && destPiece.color !== piece.color) {
                    moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                }
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        8,
        "Aggressive King",
        "The king can capture two spaces in any orthogonal direction.",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            let moves: Move[] = [];
            const {row, col} = square;

            const piece = board.getPiece(square);
            if (piece?.pieceType !== PieceType.King) return moves;

            const moveOptions = [[2, 0], [-2, 0], [0, 2], [0, -2]];
            for (const [dr, dc] of moveOptions) {
                const destRow = row + dr;
                const destCol = col + dc;
                const destPiece = board.getPiece({row: destRow, col: destCol});

                if (destPiece && destPiece.color !== piece.color) {
                    moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece: {type: piece.pieceType, color: piece.color}});
                }
            }

            // Filter out Checks
            moves = moves.filter((move) => {
                const movedBoard = board.clone();
                movedBoard.applyMove(move);

                // Allow a move that puts yourself in check if you are capturing opponents king
                const opponentKingSquare = movedBoard.findKing(piece.color === Color.White ? Color.Black : Color.White);
                if (!opponentKingSquare) return true;

                const kingSquare = movedBoard.findKing(piece.color);
                if (!kingSquare) return false;

                const attackers = movedBoard.attackers(kingSquare, piece.color === Color.White ? Color.Black : Color.White);
                return attackers.length === 0;
            })

            return moves;
        }
    ),
    new Rule(
        9,
        "Dummy rule 1",
        "asdf asd f dasf asdf asf rtrt dagd gdffgsdg sdf gfds gsdf g",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            return []
        }
    ),
    new Rule(
        10,
        "Dummy rule 2",
        "asdf asd f dasf asdf asf rtrt dagd gdffgsdg sdf gfds gsdf g",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            return []
        }
    ),
    new Rule(
        11,
        "Dummy rule 3",
        "asdf asd f dasf asdf asf rtrt dagd gdffgsdg sdf gfds gsdf g",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            return []
        }
    ),
    new Rule(
        12,
        "Dummy rule 4",
        "asdf asd f dasf asdf asf rtrt dagd gdffgsdg sdf gfds gsdf g",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            return []
        }
    ),
    new Rule(
        13,
        "Dummy rule 5",
        "asdf asd f dasf asdf asf rtrt dagd gdffgsdg sdf gfds gsdf g",
        PieceType.King,
        (board: Board, square: Square): Move[] => {
            return []
        }
    ),

]


export default Rule;