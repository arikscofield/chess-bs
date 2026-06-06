import {Color, PieceType} from "../types";
import Piece from "../piece";
import {Move, Square} from "../schemas/common";
import Board from "../board";
import Rule from "../rule";


// ============================================================
// Material & Position Evaluation
// ============================================================


/** Standard material values, in centipawns (×100). */
export const PIECE_VALUES: Record<PieceType, number> = {
    [PieceType.Pawn]:   100,
    [PieceType.Knight]: 320,
    [PieceType.Bishop]: 330,
    [PieceType.Rook]:   500,
    [PieceType.Queen]:  900,
    [PieceType.King]:   20000,
};

/**
 * Piece-square tables. Indexed as PST[pieceType][row][col].
 * Conventions:
 *   - row 0 = top of board (FEN rank 8) = black's back rank
 *   - row 7 = bottom of board (FEN rank 1) = white's back rank
 *   - Values written from white's perspective: white piece on row 7 = its starting rank.
 *   - For a black piece, mirror vertically with row index 7 - row.
 */
export const PST: Record<PieceType, number[][]> = {
    [PieceType.Pawn]: [
        [  0,   0,   0,   0,   0,   0,   0,   0],
        [ 50,  50,  50,  50,  50,  50,  50,  50],
        [ 10,  10,  20,  30,  30,  20,  10,  10],
        [  5,   5,  10,  25,  25,  10,   5,   5],
        [  0,   0,   0,  20,  20,   0,   0,   0],
        [  5,  -5, -10,   0,   0, -10,  -5,   5],
        [  5,  10,  10, -20, -20,  10,  10,   5],
        [  0,   0,   0,   0,   0,   0,   0,   0],
    ],
    [PieceType.Knight]: [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20,   0,   0,   0,   0, -20, -40],
        [-30,   0,  10,  15,  15,  10,   0, -30],
        [-30,   5,  15,  20,  20,  15,   5, -30],
        [-30,   0,  15,  20,  20,  15,   0, -30],
        [-30,   5,  10,  15,  15,  10,   5, -30],
        [-40, -20,   0,   5,   5,   0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50],
    ],
    [PieceType.Bishop]: [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10,   0,   0,   0,   0,   0,   0, -10],
        [-10,   0,   5,  10,  10,   5,   0, -10],
        [-10,   5,   5,  10,  10,   5,   5, -10],
        [-10,   0,  10,  10,  10,  10,   0, -10],
        [-10,  10,  10,  10,  10,  10,  10, -10],
        [-10,   5,   0,   0,   0,   0,   5, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20],
    ],
    [PieceType.Rook]: [
        [  0,   0,   0,   0,   0,   0,   0,   0],
        [  5,  10,  10,  10,  10,  10,  10,   5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [  0,   0,   0,   5,   5,   0,   0,   0],
    ],
    [PieceType.Queen]: [
        [-20, -10, -10,  -5,  -5, -10, -10, -20],
        [-10,   0,   0,   0,   0,   0,   0, -10],
        [-10,   0,   5,   5,   5,   5,   0, -10],
        [ -5,   0,   5,   5,   5,   5,   0,  -5],
        [  0,   0,   5,   5,   5,   5,   0,  -5],
        [-10,   5,   5,   5,   5,   5,   0, -10],
        [-10,   0,   5,   0,   0,   0,   0, -10],
        [-20, -10, -10,  -5,  -5, -10, -10, -20],
    ],
    // King midgame: hide on back rank, stay away from center
    [PieceType.King]: [
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-20, -30, -30, -40, -40, -30, -30, -20],
        [-10, -20, -20, -20, -20, -20, -20, -10],
        [ 20,  20,   0,   0,   0,   0,  20,  20],
        [ 20,  30,  10,   0,   0,  10,  30,  20],
    ],
};

function getPSTValue(piece: Piece, square: Square): number {
    const table = PST[piece.pieceType];
    if (piece.color === Color.White) {
        return table[square.row]?.[square.col] ?? 0;
    } else {
        return table[7 - square.row]?.[square.col] ?? 0;
    }
}

/**
 * Evaluate the position from the perspective of `color`.
 * Positive = good for `color`, negative = bad.
 * Centipawn units.
 */
export function evaluate(board: Board, color: Color): number {
    let score = 0;

    // If the bot's king is gone, that's catastrophic.
    // If the opponent's king is gone, that's a win.
    let ourKing = false;
    let theirKing = false;

    for (let r = 0; r < 8; r++) {
        const row = board.grid[r];
        if (!row) continue;
        for (let c = 0; c < 8; c++) {
            const piece = row[c];
            if (!piece) continue;

            const sign = piece.color === color ? 1 : -1;
            const material = PIECE_VALUES[piece.pieceType] ?? 0;
            const positional = getPSTValue(piece, { row: r, col: c });
            score += sign * (material + positional);

            if (piece.pieceType === PieceType.King) {
                if (piece.color === color) ourKing = true;
                else theirKing = true;
            }
        }
    }

    if (!ourKing) return -1_000_000;
    if (!theirKing) return  1_000_000;

    return score;
}


// ============================================================
// Move Generation
// ============================================================

/** Iterate every (row, col) pair on the board with its piece (or null). */
function* iteratePieces(board: Board): Generator<{ square: Square, piece: Piece }> {
    for (let r = 0; r < 8; r++) {
        const row = board.grid[r];
        if (!row) continue;
        for (let c = 0; c < 8; c++) {
            const piece = row[c];
            if (piece) yield { square: { row: r, col: c }, piece };
        }
    }
}

/** All standard chess moves available to `color`. */
export function getAllChessMoves(board: Board, color: Color): Move[] {
    const moves: Move[] = [];
    for (const { square, piece } of iteratePieces(board)) {
        if (piece.color !== color) continue;
        moves.push(...board.getLegalMoves(square, true, true));
    }
    return moves;
}

/** All rule-based moves from the supplied rules for `color`. */
export function getAllRuleMoves(board: Board, color: Color, rules: Rule[]): Move[] {
    const moves: Move[] = [];
    for (const rule of rules) {
        const squares = board.findPieces(rule.pieceType, color);
        for (const square of squares) {
            moves.push(...rule.getLegalMoves(board, square));
        }
    }
    return moves;
}

/** Loose equality check for moves: same from/to/piece-type/promotion. */
export function movesEqual(a: Move, b: Move): boolean {
    return a.from.row === b.from.row &&
        a.from.col === b.from.col &&
        a.to.row   === b.to.row &&
        a.to.col   === b.to.col &&
        a.piece.type === b.piece.type &&
        a.piece.color === b.piece.color &&
        (a.promotion ?? null) === (b.promotion ?? null);
}

/** All legal own moves (chess + own rules), deduplicated. */
export function getAllOwnLegalMoves(board: Board, color: Color, rules: Rule[]): Move[] {
    const chess = getAllChessMoves(board, color);
    const ruleM = getAllRuleMoves(board, color, rules);
    const all: Move[] = [...chess];
    for (const m of ruleM) {
        if (!all.some(x => movesEqual(x, m))) all.push(m);
    }
    return all;
}

/**
 * Plausible bluff candidates: moves that a rule in the pool COULD have produced,
 * but which are not currently legal for us (no own rule + not standard chess).
 * These look believable because they match a known rule pattern.
 *
 * Optionally, `includeWildBluffs` adds a small set of random-looking moves
 * that don't match any rule (very risky — only good bots use these sparingly).
 */
export function getPlausibleBluffs(
    board: Board,
    color: Color,
    rulePool: Rule[],
    ownLegalMoves: Move[],
    includeWildBluffs = false,
): Move[] {
    const bluffs: Move[] = [];

    // For each rule in the pool, generate moves AS IF we had that rule.
    // Then filter out moves we can already make legally.
    for (const rule of rulePool) {
        const squares = board.findPieces(rule.pieceType, color);
        for (const square of squares) {
            const ruleMoves = rule.getLegalMoves(board, square);
            for (const m of ruleMoves) {
                if (ownLegalMoves.some(x => movesEqual(x, m))) continue;
                if (bluffs.some(x => movesEqual(x, m))) continue;
                bluffs.push({ ...m, bluff: true });
            }
        }
    }

    if (includeWildBluffs) {
        // A few "wild" bluffs: pick a piece and a random reachable-looking square.
        // Limited to moves that capture an enemy piece (otherwise pointless).
        for (const { square, piece } of iteratePieces(board)) {
            if (piece.color !== color) continue;
            for (let dr = -3; dr <= 3; dr++) {
                for (let dc = -3; dc <= 3; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    if (Math.abs(dr) + Math.abs(dc) > 4) continue;
                    const to: Square = { row: square.row + dr, col: square.col + dc };
                    if (to.row < 0 || to.row > 7 || to.col < 0 || to.col > 7) continue;
                    const target = board.getPiece(to);
                    if (!target || target.color === color) continue; // must capture

                    const candidate: Move = {
                        from: square,
                        to,
                        piece: { type: piece.pieceType, color: piece.color },
                        bluff: true,
                    };
                    if (ownLegalMoves.some(x => movesEqual(x, candidate))) continue;
                    if (bluffs.some(x => movesEqual(x, candidate))) continue;
                    bluffs.push(candidate);
                }
            }
        }
    }

    return bluffs;
}


// ============================================================
// Bluff Detection (opponent's move analysis)
// ============================================================

/**
 * Could the opponent's move have been a standard chess move on the pre-move board?
 */
export function isChessLegalOnBoard(preMoveBoard: Board, move: Move): boolean {
    const piece = preMoveBoard.getPiece(move.from);
    if (!piece || piece.color !== move.piece.color) return false;
    const chessMoves = preMoveBoard.getLegalMoves(move.from, true, true);
    return chessMoves.some(m => movesEqual(m, move));
}

/**
 * Which rules in the pool could have produced this move?
 * Returns the subset of rulePool that explain the move.
 */
export function getExplainingRules(preMoveBoard: Board, move: Move, rulePool: Rule[]): Rule[] {
    const piece = preMoveBoard.getPiece(move.from);
    if (!piece || piece.color !== move.piece.color) return [];

    const explaining: Rule[] = [];
    for (const rule of rulePool) {
        if (rule.pieceType !== piece.pieceType) continue;
        const ruleMoves = rule.getLegalMoves(preMoveBoard, move.from);
        if (ruleMoves.some(m => movesEqual(m, move))) explaining.push(rule);
    }
    return explaining;
}

/**
 * Bluff suspicion score for an opponent move, in [0, 1].
 *   0 = definitely legitimate (standard chess move)
 *   1 = definitely a bluff (impossible under any rule in pool)
 *
 * If the move is standard-chess-legal → 0.
 * If it's explainable by some rules in the pool → mid-range based on how many.
 * If it's explainable by nothing → 1.
 */
export function bluffSuspicion(
    preMoveBoard: Board,
    move: Move,
    rulePool: Rule[],
    opponentRuleCount: number,
): number {
    if (isChessLegalOnBoard(preMoveBoard, move)) return 0;

    const explaining = getExplainingRules(preMoveBoard, move, rulePool);
    if (explaining.length === 0) return 1;

    // Opponent has `opponentRuleCount` rules from the pool. Probability they have
    // at least one of the explaining rules is roughly:
    //     1 - C(pool - explaining, opponentRuleCount) / C(pool, opponentRuleCount)
    // We use this as the legitimacy probability; suspicion is 1 - legit.
    const N = rulePool.length;
    const K = explaining.length;
    const R = Math.min(opponentRuleCount, N);

    // P(no explaining rule in their hand) = C(N-K, R) / C(N, R)
    const pNoExplain = hypergeometricMiss(N, K, R);
    const pLegit = 1 - pNoExplain;
    return 1 - pLegit;
}

/**
 * Hypergeometric "no hit" probability: probability of zero successes when drawing
 * R items from N, of which K are successes.
 *   = C(N-K, R) / C(N, R)
 */
function hypergeometricMiss(N: number, K: number, R: number): number {
    if (R > N || K > N) return 0;
    if (N - K < R) return 0;
    let p = 1;
    for (let i = 0; i < R; i++) {
        p *= (N - K - i) / (N - i);
    }
    return p;
}


// ============================================================
// Move Ordering (for alpha-beta)
// ============================================================

/**
 * Order moves to improve alpha-beta pruning: captures first (MVV-LVA),
 * then promotions, then quiet moves.
 */
export function orderMoves(board: Board, moves: Move[]): Move[] {
    return [...moves].sort((a, b) => moveScore(board, b) - moveScore(board, a));
}

function moveScore(board: Board, move: Move): number {
    let score = 0;
    const target = board.getPiece(move.to);
    if (target) {
        // MVV-LVA: prioritize capturing high-value pieces with low-value attackers.
        score += 10 * (PIECE_VALUES[target.pieceType] ?? 0) - (PIECE_VALUES[move.piece.type] ?? 0);
    }
    if (move.promotion) score += PIECE_VALUES[move.promotion] ?? 0;
    return score;
}


// ============================================================
// Alpha-Beta Minimax
// ============================================================

interface SearchOptions {
    rules: Rule[];      // Bot's own rules (used on bot's nodes)
    rulePool: Rule[];   // Rules opponent might have (used on opponent nodes for "Hard" mode)
    botColor: Color;
    /** If true, opponent nodes also generate rule moves from rulePool (more cautious). */
    paranoidOpponent: boolean;
}

/**
 * Alpha-beta minimax. Returns the best score for the bot from this position.
 *
 * `toMove` is whose turn it is. When toMove === botColor we maximize; else minimize.
 */
export function alphaBeta(
    board: Board,
    toMove: Color,
    depth: number,
    alpha: number,
    beta: number,
    opts: SearchOptions,
): number {
    if (depth <= 0) return evaluate(board, opts.botColor);

    // Terminal-ish: if a king is missing, evaluate immediately.
    const ourKing = board.findKing(opts.botColor);
    const theirKing = board.findKing(opts.botColor === Color.White ? Color.Black : Color.White);
    if (!ourKing || !theirKing) return evaluate(board, opts.botColor);

    const isBotTurn = toMove === opts.botColor;
    const opponentColor = opts.botColor === Color.White ? Color.Black : Color.White;

    // Generate moves for whoever's turn it is.
    let moves: Move[];
    if (isBotTurn) {
        moves = getAllOwnLegalMoves(board, toMove, opts.rules);
    } else {
        // For the opponent, we don't know their actual rules. Either assume chess
        // moves only (optimistic) or include rule-pool moves (paranoid).
        moves = opts.paranoidOpponent
            ? getAllOwnLegalMoves(board, toMove, opts.rulePool)
            : getAllChessMoves(board, toMove);
    }

    if (moves.length === 0) {
        // No legal moves. Treat as stalemate/checkmate.
        if (board.isInCheck(toMove)) {
            return isBotTurn ? -500_000 : 500_000;
        }
        return 0;
    }

    const ordered = orderMoves(board, moves);

    if (isBotTurn) {
        let best = -Infinity;
        for (const move of ordered) {
            const next = board.clone();
            if (!next.applyMove(move)) continue;
            // Pawn promotion default to queen when not set
            if (!move.promotion && needsPromotion(move)) {
                // The bot should always promote to queen if it didn't specify.
                // applyMove already returns false without promotion for pawns reaching back rank,
                // so handle it here.
                continue;
            }
            const score = alphaBeta(next, opponentColor, depth - 1, alpha, beta, opts);
            if (score > best) best = score;
            if (best > alpha) alpha = best;
            if (alpha >= beta) break;
        }
        return best;
    } else {
        let worst = Infinity;
        for (const move of ordered) {
            const next = board.clone();
            if (!next.applyMove(move)) continue;
            if (!move.promotion && needsPromotion(move)) continue;
            const score = alphaBeta(next, opts.botColor, depth - 1, alpha, beta, opts);
            if (score < worst) worst = score;
            if (worst < beta) beta = worst;
            if (alpha >= beta) break;
        }
        return worst;
    }
}

/** Check if a move would require promotion (pawn reaching back rank). */
export function needsPromotion(move: Move): boolean {
    if (move.piece.type !== PieceType.Pawn) return false;
    if (move.piece.color === Color.White) return move.to.row === 0;
    return move.to.row === 7;
}

/** Add a default queen promotion to any pawn move reaching the back rank. */
export function withDefaultPromotion(move: Move): Move {
    if (needsPromotion(move) && !move.promotion) {
        return { ...move, promotion: PieceType.Queen };
    }
    return move;
}

/**
 * Search wrapper: find the best move at the given depth using alpha-beta.
 * Returns { move, score } or null if no legal moves.
 */
export function searchBestMove(
    board: Board,
    color: Color,
    depth: number,
    moves: Move[],
    opts: SearchOptions,
): { move: Move, score: number } | null {
    if (moves.length === 0) return null;

    const opponent = color === Color.White ? Color.Black : Color.White;
    const ordered = orderMoves(board, moves);

    let bestMove: Move | null = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const rawMove of ordered) {
        const move = withDefaultPromotion(rawMove);
        const next = board.clone();
        if (!next.applyMove(move)) continue;
        const score = alphaBeta(next, opponent, depth - 1, alpha, beta, opts);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (score > alpha) alpha = score;
    }

    if (!bestMove) return null;
    return { move: bestMove, score: bestScore };
}