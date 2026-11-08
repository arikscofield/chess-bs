import {createTheme, type CSSVariablesResolver, type MantineColorsTuple} from "@mantine/core";

// Static fallback palette for the accent (close to the default #00ADB5).
// The actual rendered accent always comes from the user-customizable
// --color-fg-1 CSS variable (see cssVariablesResolver below).
const accent: MantineColorsTuple = [
    "#e0fbfc", "#c2f2f4", "#94e6ea", "#5fd8de", "#33ccd3",
    "#17c3cb", "#00adb5", "#009aa1", "#00868c", "#006f74",
];

const FONT_STACK = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const theme = createTheme({
    fontFamily: FONT_STACK,
    headings: {fontFamily: FONT_STACK, fontWeight: "700"},
    primaryColor: "accent",
    primaryShade: 6,
    colors: {accent},
    defaultRadius: "md",
    cursorType: "pointer",
    components: {
        Modal: {
            defaultProps: {
                centered: true,
                radius: "lg",
                overlayProps: {backgroundOpacity: 0.6, blur: 3},
            },
            classNames: {
                content: "border border-white/10 bg-bg-2",
                header: "bg-bg-2",
                title: "text-xl font-bold text-fg-2",
            },
        },
        Drawer: {
            classNames: {
                content: "bg-bg-1",
                header: "bg-bg-1",
            },
        },
        Tooltip: {defaultProps: {withArrow: true, openDelay: 150}},
        Card: {defaultProps: {radius: "lg"}},
        Popover: {classNames: {dropdown: "bg-bg-2 border-white/10"}},
    },
});

// Map Mantine's dark palette onto the app's theme tokens so that Mantine
// components (inputs, modals, menus) match the rest of the UI, including
// when the user customizes their colors.
export const cssVariablesResolver: CSSVariablesResolver = () => ({
    variables: {},
    light: {},
    dark: {
        "--mantine-color-body": "var(--color-bg-1)",
        "--mantine-color-text": "var(--color-fg-2)",
        "--mantine-color-dimmed": "var(--color-fg-3)",
        "--mantine-color-placeholder": "color-mix(in srgb, var(--color-fg-3) 70%, transparent)",
        "--mantine-color-default": "var(--color-bg-2)",
        "--mantine-color-default-hover": "color-mix(in srgb, var(--color-bg-2), white 6%)",
        "--mantine-color-default-color": "var(--color-fg-2)",
        "--mantine-color-default-border": "rgb(255 255 255 / 0.1)",

        "--mantine-color-dark-0": "var(--color-fg-2)",
        "--mantine-color-dark-1": "color-mix(in srgb, var(--color-fg-2), var(--color-fg-3))",
        "--mantine-color-dark-2": "var(--color-fg-3)",
        "--mantine-color-dark-3": "color-mix(in srgb, var(--color-fg-3), var(--color-bg-2))",
        "--mantine-color-dark-4": "color-mix(in srgb, var(--color-bg-2), white 12%)",
        "--mantine-color-dark-5": "color-mix(in srgb, var(--color-bg-2), white 5%)",
        "--mantine-color-dark-6": "color-mix(in srgb, var(--color-bg-1) 75%, var(--color-bg-2))",
        "--mantine-color-dark-7": "var(--color-bg-1)",
        "--mantine-color-dark-8": "color-mix(in srgb, var(--color-bg-1), black 15%)",
        "--mantine-color-dark-9": "color-mix(in srgb, var(--color-bg-1), black 30%)",

        "--mantine-primary-color-filled": "var(--color-fg-1)",
        "--mantine-primary-color-filled-hover": "color-mix(in srgb, var(--color-fg-1), black 12%)",
        "--mantine-primary-color-light": "color-mix(in srgb, var(--color-fg-1) 15%, transparent)",
        "--mantine-primary-color-light-hover": "color-mix(in srgb, var(--color-fg-1) 22%, transparent)",
        "--mantine-primary-color-light-color": "color-mix(in srgb, var(--color-fg-1), white 20%)",
        "--mantine-color-accent-filled": "var(--color-fg-1)",
        "--mantine-color-accent-filled-hover": "color-mix(in srgb, var(--color-fg-1), black 12%)",
        "--mantine-color-accent-light": "color-mix(in srgb, var(--color-fg-1) 15%, transparent)",
        "--mantine-color-accent-light-hover": "color-mix(in srgb, var(--color-fg-1) 22%, transparent)",
        "--mantine-color-accent-light-color": "color-mix(in srgb, var(--color-fg-1), white 20%)",
        "--mantine-color-accent-outline": "var(--color-fg-1)",
        "--mantine-color-accent-outline-hover": "color-mix(in srgb, var(--color-fg-1) 10%, transparent)",
        "--mantine-color-accent-text": "var(--color-fg-1)",
        "--mantine-color-accent-6": "var(--color-fg-1)",
    },
});
