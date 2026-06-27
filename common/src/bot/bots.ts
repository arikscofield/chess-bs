import Board from "../board"
import { Move } from "../schemas/common";
import {Color, PieceType} from "../types";
import Rule, {allRules} from "../rule";
import {
    bluffSuspicion, evaluate, getAllBluffsInCheck,
    getAllOwnLegalMoves, getExplainingRules,
    getPlausibleBluffs,
    PIECE_VALUES,
    searchBestMove,
    withDefaultPromotion
} from "./botUtils";


// ============================================================
// Public Types
// ============================================================

export enum BotDifficulty {
    Random = "random",
    Easy   = "easy",
    Medium = "medium",
    Hard   = "hard",
}

export type BotDecision =
    | { type: "move"; move: Move }
    | { type: "callBluff" };

export interface BotInput {
    /** The current board state — the position the bot must respond to. */
    board: Board;
    /** Pre-move board, before the opponent's last move (omit for the very first move). */
    preMoveBoard?: Board | undefined;
    /** The opponent's last move. Omit if there is no previous move (bot moves first). */
    opponentLastMove?: Move | undefined;
}

export const BOT_UUID = "00000000-0000-4000-0000-000000000000";


// ============================================================
// Abstract Base Bot
// ============================================================

export abstract class Bot {
    /** Bot's color. */
    public readonly color: Color;
    /** Bot's hidden rules. */
    public readonly rules: Rule[];
    /** All rules that could be in play this game (the rule pool). */
    public readonly rulePool: Rule[];
    /** Number of rules the opponent has (defaults to same as bot). */
    public readonly opponentRuleCount: number;

    constructor(
        color: Color,
        rules: Rule[],
        rulePool: Rule[] = allRules,
        opponentRuleCount?: number,
    ) {
        this.color = color;
        this.rules = rules;
        this.rulePool = rulePool;
        this.opponentRuleCount = opponentRuleCount ?? rules.length;
    }

    /** Decide the next action: either play a move or call the opponent's bluff. */
    public abstract decide(input: BotInput): BotDecision;

    /** Convenience: get all the bot's own legal moves (chess + own rules). */
    protected ownLegalMoves(board: Board): Move[] {
        return getAllOwnLegalMoves(board, this.color, this.rules);
    }

    /** Convenience: opponent color. */
    protected get oppColor(): Color {
        return this.color === Color.White ? Color.Black : Color.White;
    }
}


// ============================================================
// Random Bot — picks a random legal move, rarely bluffs
// ============================================================

export class RandomBot extends Bot {
    public decide(input: BotInput): BotDecision {
        // 1% chance to call bluff at random (for chaos).
        if (input.opponentLastMove && input.preMoveBoard && Math.random() < 0.01) {
            return { type: "callBluff" };
        }

        const legal = this.ownLegalMoves(input.board);
        if (legal.length === 0) {
            // Stuck: must make some move; if there's truly nothing, attempt a wild bluff.
            const bluffs = getPlausibleBluffs(input.board, this.color, this.rulePool, [], true);
            if (bluffs.length > 0) {
                return { type: "move", move: pickRandom(bluffs) };
            }

            const impossibleBluffs: Move[] = getAllBluffsInCheck(input.board, this.color);
            if (impossibleBluffs.length === 0)
                throw new Error("RandomBot: no moves and no bluffs available");
            return {type: "move", move: pickRandom(impossibleBluffs)};
        }

        const move = withDefaultPromotion(pickRandom(legal));
        return { type: "move", move };
    }
}


// ============================================================
// Easy Bot — greedy 1-ply with material bias; small bluff usage
// ============================================================

export class EasyBot extends Bot {
    public decide(input: BotInput): BotDecision {
        // Bluff calling: only call if it's literally impossible by any pool rule.
        if (input.opponentLastMove && input.preMoveBoard) {
            const suspicion = bluffSuspicion(
                input.preMoveBoard, input.opponentLastMove, this.rulePool, this.opponentRuleCount,
            );
            if (suspicion >= 0.99) {
                return { type: "callBluff" };
            }
        }

        const legal = this.ownLegalMoves(input.board);
        const scored = legal.map(m => ({ move: m, score: scoreMoveGreedy(input.board, m, this.color) }));

        // Easy bot occasionally tries a bluff if it captures a piece worth >= 3 (knight+).
        if (Math.random() < 0.15) {
            const bluffs = getPlausibleBluffs(input.board, this.color, this.rulePool, legal);
            const captureBluffs = bluffs.filter(b => {
                const target = input.board.getPiece(b.to);
                return target && (PIECE_VALUES[target.pieceType] ?? 0) >= 300;
            });
            if (captureBluffs.length > 0) {
                return { type: "move", move: withDefaultPromotion(pickRandom(captureBluffs)) };
            }
        }

        if (scored.length === 0) {
            // No legal moves — try a bluff or resign-equivalent.
            const bluffs = getPlausibleBluffs(input.board, this.color, this.rulePool, [], true);
            if (bluffs.length > 0) return { type: "move", move: withDefaultPromotion(pickRandom(bluffs)) };

            const impossibleBluffs: Move[] = getAllBluffsInCheck(input.board, this.color);
            if (impossibleBluffs.length === 0)
                throw new Error("EasyBot: no moves and no bluffs available");
            return {type: "move", move: pickRandom(impossibleBluffs)};
        }

        scored.sort((a, b) => b.score - a.score);
        // Slight randomness: pick one of the top-3 to avoid being predictable.
        const top = scored.slice(0, Math.min(3, scored.length));
        return { type: "move", move: withDefaultPromotion(pickRandom(top).move) };
    }
}


// ============================================================
// Medium Bot — depth-2 alpha-beta, smarter bluff handling
// ============================================================

export class MediumBot extends Bot {
    private readonly searchDepth = 2;

    public decide(input: BotInput): BotDecision {
        // Bluff calling logic
        if (input.opponentLastMove && input.preMoveBoard) {
            const suspicion = bluffSuspicion(
                input.preMoveBoard, input.opponentLastMove, this.rulePool, this.opponentRuleCount,
            );
            // Always call if very obviously a bluff
            if (suspicion >= 0.95) return { type: "callBluff" };
            // Otherwise, weigh the value of the suspicious move vs the risk
            if (suspicion >= 0.45) {
                const gain = moveValue(input.preMoveBoard, input.opponentLastMove, this.color);
                // Bigger gain by opponent → more important to call
                // Call if suspicion * gain exceeds typical-punishment value (~3 pawns = 300)
                if (suspicion * gain >= 300) return { type: "callBluff" };
            }
        }

        const legalMoves = this.ownLegalMoves(input.board);
        if (legalMoves.length === 0) {
            return this.fallbackBluff(input.board);
        }

        const opts = {
            rules: this.rules,
            rulePool: this.rulePool,
            botColor: this.color,
            paranoidOpponent: false,
        };

        const legalResult = searchBestMove(input.board, this.color, this.searchDepth, legalMoves, opts);
        const legalBest = legalResult ?? { move: legalMoves[0]!, score: -Infinity };

        // Sometimes consider bluffs (only ones matching a pool rule, no wild bluffs)
        const bluffs = getPlausibleBluffs(input.board, this.color, this.rulePool, legalMoves);
        if (bluffs.length > 0) {
            const bluffResult = searchBestMove(input.board, this.color, this.searchDepth, bluffs, opts);
            if (bluffResult) {
                // Estimate call probability against this bluff: if the bluff matches many
                // pool rules, opponent is less suspicious and less likely to call.
                const callProb = estimateBluffCallProbability(
                    input.board, bluffResult.move, this.rulePool, this.opponentRuleCount,
                );
                // EV reasoning:
                //   gain if not called: bluffResult.score - legalBest.score
                //   loss if called:     ~penalty (lose a piece or your turn)
                const gain = bluffResult.score - legalBest.score;
                const penalty = Math.max(300, gain) + 200;
                const evGain = (1 - callProb) * gain - callProb * penalty;
                if (evGain > 0) {
                    return { type: "move", move: withDefaultPromotion(bluffResult.move) };
                }
            }
        }

        return { type: "move", move: withDefaultPromotion(legalBest.move) };
    }

    private fallbackBluff(board: Board): BotDecision {
        const bluffs = getPlausibleBluffs(board, this.color, this.rulePool, [], true);
        if (bluffs.length > 0) {
            return { type: "move", move: withDefaultPromotion(pickRandom(bluffs)) };
        }
        const impossibleBluffs: Move[] = getAllBluffsInCheck(board, this.color);
        if (impossibleBluffs.length === 0)
            throw new Error("MediumBot: no moves and no bluffs available");
        return {type: "move", move: pickRandom(impossibleBluffs)};
    }
}


// ============================================================
// Hard Bot — depth-3 alpha-beta with paranoid opponent modeling
// ============================================================

export class HardBot extends Bot {
    private readonly searchDepth = 3;

    public decide(input: BotInput): BotDecision {
        // Smarter bluff-call: weigh suspicion, opponent's gain, and punishment cost
        if (input.opponentLastMove && input.preMoveBoard) {
            const suspicion = bluffSuspicion(
                input.preMoveBoard, input.opponentLastMove, this.rulePool, this.opponentRuleCount,
            );
            const gain = moveValue(input.preMoveBoard, input.opponentLastMove, this.color);
            // Expected value of calling:
            //   suspicion * (reverse the gain + punish them: gain + 300)
            //   - (1 - suspicion) * (punish us: ~400)
            const callEV = suspicion * (gain + 300) - (1 - suspicion) * 400;
            if (callEV > 100) {
                return { type: "callBluff" };
            }
        }

        const legalMoves = this.ownLegalMoves(input.board);
        if (legalMoves.length === 0) {
            return this.fallbackBluff(input.board);
        }

        const opts = {
            rules: this.rules,
            rulePool: this.rulePool,
            botColor: this.color,
            // Paranoid: assume opponent might use any pool rule against us
            paranoidOpponent: true,
        };

        const legalResult = searchBestMove(input.board, this.color, this.searchDepth, legalMoves, opts);
        const legalBest = legalResult ?? { move: legalMoves[0]!, score: -Infinity };

        // Bluff exploration: only consider plausible bluffs (rule-pool moves), no wild ones
        const bluffs = getPlausibleBluffs(input.board, this.color, this.rulePool, legalMoves);
        let bestBluff: { move: Move, ev: number } | null = null;

        if (bluffs.length > 0) {
            // Limit to top 8 most promising bluffs by immediate evaluation
            const ranked = bluffs
                .map(m => ({ m, q: scoreMoveGreedy(input.board, m, this.color) }))
                .sort((a, b) => b.q - a.q)
                .slice(0, 8)
                .map(x => x.m);

            for (const bluff of ranked) {
                const result = searchBestMove(input.board, this.color, this.searchDepth, [bluff], opts);
                if (!result) continue;

                const callProb = estimateBluffCallProbability(
                    input.board, result.move, this.rulePool, this.opponentRuleCount,
                );

                const gain = result.score - legalBest.score;
                // Punishment for getting called: lose ~queen-equivalent of value
                const punishment = 700 + Math.max(0, gain * 0.5);
                const ev = (1 - callProb) * gain - callProb * punishment;

                if (!bestBluff || ev > bestBluff.ev) {
                    bestBluff = { move: result.move, ev };
                }
            }
        }

        if (bestBluff && bestBluff.ev > 50) {
            return { type: "move", move: withDefaultPromotion(bestBluff.move) };
        }

        return { type: "move", move: withDefaultPromotion(legalBest.move) };
    }

    private fallbackBluff(board: Board): BotDecision {
        const bluffs = getPlausibleBluffs(board, this.color, this.rulePool, [], true);
        if (bluffs.length > 0) {
            return { type: "move", move: withDefaultPromotion(pickRandom(bluffs)) };
        }
        const impossibleBluffs: Move[] = getAllBluffsInCheck(board, this.color);
        if (impossibleBluffs.length === 0)
            throw new Error("HardBot: no moves and no bluffs available");
        return {type: "move", move: pickRandom(impossibleBluffs)};
    }
}


// ============================================================
// Factory
// ============================================================

export function createBot(
    difficulty: BotDifficulty,
    color: Color,
    rules: Rule[],
    rulePool: Rule[] = allRules,
    opponentRuleCount?: number,
): Bot {
    switch (difficulty) {
        case BotDifficulty.Random: return new RandomBot(color, rules, rulePool, opponentRuleCount);
        case BotDifficulty.Easy:   return new EasyBot(color, rules, rulePool, opponentRuleCount);
        case BotDifficulty.Medium: return new MediumBot(color, rules, rulePool, opponentRuleCount);
        case BotDifficulty.Hard:   return new HardBot(color, rules, rulePool, opponentRuleCount);
        default:                   return new MediumBot(color, rules, rulePool, opponentRuleCount);
    }
}


// ============================================================
// Internal helpers
// ============================================================

function pickRandom<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error("pickRandom: empty array");
    return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Greedy 1-ply score for a candidate move: material gained minus material risked. */
function scoreMoveGreedy(board: Board, move: Move, color: Color): number {
    const target = board.getPiece(move.to);
    let score = 0;
    if (target) score += PIECE_VALUES[target.pieceType] ?? 0;
    if (move.promotion) score += (PIECE_VALUES[move.promotion] ?? 0) - (PIECE_VALUES[PieceType.Pawn] ?? 0);

    // Check if the destination is attacked after our move; if so, subtract our piece value
    const next = board.clone();
    next.applyMove(withDefaultPromotion(move));
    const opp = color === Color.White ? Color.Black : Color.White;
    const attackers = next.attackers(move.to, opp);
    if (attackers.length > 0) {
        // We could be recaptured. Approximate net by subtracting our piece value.
        score -= PIECE_VALUES[move.piece.type] ?? 0;
    }

    // Small position term
    score += (evaluate(next, color) - evaluate(board, color)) * 0.01;

    return score;
}

/** Material value gained by `color` from `move` made on `preBoard` (positive if good for `color`). */
function moveValue(preBoard: Board, move: Move, fromPerspectiveOf: Color): number {
    const target = preBoard.getPiece(move.to);
    let val = target ? (PIECE_VALUES[target.pieceType] ?? 0) : 0;
    if (move.promotion) val += (PIECE_VALUES[move.promotion] ?? 0) - (PIECE_VALUES[PieceType.Pawn] ?? 0);

    // From the perspective of `fromPerspectiveOf`: if mover === fromPerspectiveOf → val is positive gain
    // If mover is opponent → val is opponent's gain (we lose pieces); return positive value because the
    // function semantically says "how much did this move gain the mover".
    if (move.piece.color !== fromPerspectiveOf) {
        // opponent's gain – the more they gain, the more we'd want to undo by calling bluff
        return val;
    }
    return val;
}

/**
 * Estimate the probability the opponent will call our bluff.
 * Uses the inverse of how many pool rules could explain this move:
 *   - matches many rules → opponent unlikely to call
 *   - matches few rules  → opponent likely to call
 *
 * Lightly weighted by how big the move's gain is (larger gains are more suspicious).
 */
function estimateBluffCallProbability(
    board: Board,
    move: Move,
    rulePool: Rule[],
    opponentRuleCount: number,
): number {
    // The opponent will see this move played from `board` (our pre-move state for them).
    // Their suspicion against us is symmetric: use bluffSuspicion-like logic.
    const explaining = getExplainingRules(board, move, rulePool);
    if (explaining.length === 0) return 0.95; // No rule explains it — opponent almost certain to call

    const N = rulePool.length;
    const K = explaining.length;
    const R = Math.min(opponentRuleCount, N);

    // Probability opponent thinks the move is legitimate ≈ P(they have at least one explaining rule
    // in their hand, AS IF they were the one with these rules — same hypergeometric reasoning).
    // From opponent's POV they don't know our rules; they estimate based on the pool.
    let pNoExplain = 1;
    for (let i = 0; i < R; i++) {
        pNoExplain *= (N - K - i) / (N - i);
    }
    const suspicion = 1 - (1 - pNoExplain); // = pNoExplain. Higher = more suspicious to opponent.

    // Bigger material gains raise suspicion slightly (opponents notice big swings)
    const target = board.getPiece(move.to);
    const gain = target ? (PIECE_VALUES[target.pieceType] ?? 0) : 0;
    const gainBoost = Math.min(0.2, gain / 5000); // up to +0.2

    return Math.min(0.98, suspicion + gainBoost);
}