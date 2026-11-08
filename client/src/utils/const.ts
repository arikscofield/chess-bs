import {BluffPunishment, BotDifficulty} from "@chess-bs/common";


export enum CreateGameMode {
    None,
    Online,
    Bot,
}










// Formatting --------------------------------

export const BLUFF_PUNISHMENT_LABELS: Record<BluffPunishment, string> = {
    [BluffPunishment.Turn]: "Lose turn",
    [BluffPunishment.Piece]: "Lose a piece (you pick)",
    [BluffPunishment.PieceOpponent]: "Lose a piece (opponent picks)",
    [BluffPunishment.PieceRandom]: "Lose a piece (random)",
};

/** Bluff punishments the server actually implements. */
export const IMPLEMENTED_BLUFF_PUNISHMENTS: BluffPunishment[] = [BluffPunishment.Turn];

export const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
    [BotDifficulty.Easy]: "Easy",
    [BotDifficulty.Medium]: "Medium",
    [BotDifficulty.Hard]: "Hard",
    [BotDifficulty.Random]: "Random",
};

function formatMinutes(minutes: number): string {
    if (minutes === 0.25) return "¼";
    if (minutes === 0.5) return "½";
    if (minutes === 0.75) return "¾";
    return String(minutes);
}

/** e.g. "5+3", "½+0", or "Unlimited" */
export function formatTimeControl(usesClock: boolean | undefined, startMs?: number, incrementMs?: number): string {
    if (!usesClock) return "Unlimited";
    return `${formatMinutes((startMs ?? 0) / 60_000)}+${(incrementMs ?? 0) / 1000}`;
}

/** e.g. "5 min + 3 sec" */
export function formatTimeControlLong(usesClock: boolean | undefined, startMs?: number, incrementMs?: number): string {
    if (!usesClock) return "Unlimited";
    return `${formatMinutes((startMs ?? 0) / 60_000)} min + ${(incrementMs ?? 0) / 1000} sec`;
}