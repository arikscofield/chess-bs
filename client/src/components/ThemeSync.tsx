import {useAtomValue} from "jotai";
import {themeColorsAtom} from "../atoms/settings.ts";
import {useEffect} from "react";


function ThemeSync() {
    const themeColors = useAtomValue(themeColorsAtom);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--color-fg-1", themeColors.accent);
        root.style.setProperty("--color-fg-2", themeColors.text);
        root.style.setProperty("--color-fg-3", themeColors.altText);
        root.style.setProperty("--color-bg-1", themeColors.background);
        root.style.setProperty("--color-bg-2", themeColors.panel);
    }, [themeColors]);

    return null;
}

export default ThemeSync;