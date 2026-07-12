import {atomWithStorage, createJSONStorage} from "jotai/utils";

const sessionStorage = createJSONStorage(() => window.sessionStorage)

// Colors/Theming -------------------------

export type BoardColors = {
    light: string,
    dark: string,
}
export const BoardColorPreset: Record<string, BoardColors> = {
    Brown: {light: "#f0d9b5", dark: "#b58863"},
    Green: {light: "#ffffdd", dark: "#86a666"},
    Blue: {light: "#dee3e6", dark: "#8ca2ad"},
    Gray: {light: "#e8e8e8", dark: "#7a7a7a"},
}
export const boardColorsAtom = atomWithStorage<BoardColors>("boardColors", BoardColorPreset.Brown);

export type MoveColors = {
    regular: string,
    rule: string,
    bluff: string,
}
export const DefaultMoveColors: MoveColors = {
    regular: "#00823680",
    rule: "#1447e680",
    bluff: "#c1000780",
}
export const moveColorsAtom = atomWithStorage<MoveColors>("moveColors", DefaultMoveColors);


export type ThemeColors = {
    accent: string,     // foreground 1
    text: string,       // foreground 2
    altText: string,    // foreground 3
    background: string, // background 1
    panel: string,      // background 2
}
export const DefaultThemeColors: ThemeColors = {
    accent: "#00ADB5FF",
    text: "#EEEEEEFF",
    altText: "#99a1afFF",
    background: "#222831FF",
    panel: "#393E46FF",
}
export const themeColorsAtom = atomWithStorage<ThemeColors>("themeColors", DefaultThemeColors);


export const colorSettingsTabAtom = atomWithStorage('colorSettingsTab', "board", sessionStorage);
