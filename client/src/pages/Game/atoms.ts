import {atom} from 'jotai'
import {
    BluffPunishment,
    Color,
    CreateGameColor,
    GameResult, type GameStateResponse,
    GameStatus,
    type PlayerDTO,
    type Turn, type ClockInfo,
} from "@chess-bs/common";
import BoardClass from "@chess-bs/common/dist/board.js";
import Rule from "@chess-bs/common/src/rule.js";


// Game State (Live/Changing)
export const gameStatusAtom = atom<GameStatus>(GameStatus.WAITING_FOR_PLAYER);
export const turnHistoryAtom = atom<Turn[]>([]);
export const addTurnAtom = atom(null, (get, set, newTurn: Turn) => {
    set(turnHistoryAtom, [...get(turnHistoryAtom), newTurn])
})
export const removeTurnAtom = atom(null, (get, set, index: number) => {
    set(turnHistoryAtom, get(turnHistoryAtom).toSpliced(index, 1));
})
export const turnColorAtom = atom<Color>(Color.White);
export const playersAtom = atom<PlayerDTO[]>([]);
export const gameResultAtom = atom<GameResult>(GameResult.Draw);
export const gameResultReasonAtom = atom<string>("");
export const viewAtom = atom<Color | undefined>(undefined);
export const drawOfferedColorAtom = atom<Color | null>(null);

export const setGameStateAtom = atom(null, (_, set, state: GameStateResponse) => {
    set(startBoardAtom, new BoardClass(state.startBoard.grid, state.startBoard.enPassant));
    set(gameStatusAtom, state.gameStatus);
    set(rulePoolIdsAtom, state.rulePoolIds);
    set(usesClockAtom, state.clock.usesClock);
    set(clockStartMsAtom, state.clock.startMs);
    set(clockIncrementMsAtom, state.clock.incrementMs);
    set(bluffPunishmentAtom, state.bluffPunishment);
    set(turnColorAtom, state.turnColor);
    set(turnHistoryAtom, state.turnHistory);
    set(playersAtom, state.players);
    set(drawOfferedColorAtom, state.drawOfferedColor ?? null)
})


// Game Info/State (Typically Static)
export const gameIdAtom = atom<string>("");
export const startBoardAtom = atom<BoardClass>(BoardClass.defaultBoard());
export const rulePoolIdsAtom = atom<number[]>([]);
export const rulePoolAtom = atom(get => get(rulePoolIdsAtom).map(id => Rule.getRuleFromId(id)).filter(rule => rule !== undefined));

export const playerAtom = atom<PlayerDTO>();
export const playerRulePoolAtom = atom(get => (get(playerAtom)?.ruleIds ?? []).map(id => Rule.getRuleFromId(id)).filter(rule => rule !== undefined));


export const usesClockAtom = atom<boolean>(false);
export const clockStartMsAtom = atom<number>(0);
export const clockIncrementMsAtom = atom<number>(0);
export const bluffPunishmentAtom = atom<BluffPunishment>(BluffPunishment.Turn);
export const creatorColorAtom = atom<CreateGameColor>(CreateGameColor.Random);
export const gameStartTimestampAtom = atom<number>(0);

export const clockInfoAtom = atom(
    (get) => ({
        usesClock: get(usesClockAtom),
        startMs: get(clockStartMsAtom),
        incrementMs: get(clockIncrementMsAtom),
        gameStartTimestamp: get(gameStartTimestampAtom),
    } as ClockInfo),
    (_get, set, clockInfo: ClockInfo) => {
        set(usesClockAtom, clockInfo.usesClock);
        set(clockStartMsAtom, clockInfo.startMs);
        set(clockIncrementMsAtom, clockInfo.incrementMs);
        set(gameStartTimestampAtom, clockInfo.gameStartTimestamp);
    }
)
export const clocksAtom = atom(
    (get) => {
        const times = new Map<Color, number>();
        for (const player of get(playersAtom)) {
            times.set(player.color, player.clockMs ?? 0);
        }
        return times;
    },
    (_get, set, clockTimes: Map<Color, number>) => {
        set(playersAtom, (oldPlayers) =>
            oldPlayers.map(player => ({...player, clockMs: clockTimes.get(player.color) ?? 0}))
        )
    }
)

// Other
export const isBluffingAtom = atom<boolean>(false);





