import {atom} from "jotai";
import {BluffPunishment, Color, GameResult, GameStatus, type PlayerDTO, type Turn} from "@chess-bs/common";
import BoardClass from "@chess-bs/common/src/board.ts";
import Rule from "@chess-bs/common/src/rule.ts";


export const gameStatusAtom = atom<GameStatus>(GameStatus.WAITING_FOR_PLAYER);
export const turnHistoryAtom = atom<Turn[]>([]);
export const addTurnAtom = atom(null, (get, set, newTurn: Turn) => {
    set(turnHistoryAtom, [...get(turnHistoryAtom), newTurn])
})

export const turnColorAtom = atom<Color>(Color.White);
export const gameResultAtom = atom<GameResult>(GameResult.Draw);
export const gameResultReasonAtom = atom<string>("");
export const viewAtom = atom<Color | undefined>(undefined);

// Game Info/State (Typically Static)
export const startBoardAtom = atom<BoardClass>(BoardClass.defaultBoard());
export const rulePoolIdsAtom = atom<number[]>([]);
export const rulePoolAtom = atom(get => get(rulePoolIdsAtom).map(id => Rule.getRuleFromId(id)).filter(rule => rule !== undefined));
export const playerAtom = atom<PlayerDTO>();
export const playerRulePoolAtom = atom(get => (get(playerAtom)?.ruleIds ?? []).map(id => Rule.getRuleFromId(id)).filter(rule => rule !== undefined));
export const bluffPunishmentAtom = atom<BluffPunishment>(BluffPunishment.Turn);

// Other
export const isBluffingAtom = atom<boolean>(false);
export const isDragMoveAtom = atom<boolean>(false);