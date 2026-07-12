import {Accordion, Group, Stack, Text, Tooltip, UnstyledButton} from "@mantine/core";
import {
    BoardColorPreset,
    type BoardColors,
    boardColorsAtom, colorSettingsTabAtom,
    DefaultMoveColors,
    DefaultThemeColors,
    moveColorsAtom,
    themeColorsAtom
} from "../atoms/settings.ts";
import {useAtom} from "jotai";
import {FaChessBoard, FaPalette, FaRegChessKing} from "react-icons/fa6";
import ColorField from "./ColorField.tsx";

type Tab = "board" | "move" | "theme";

function ColorSettings() {

    const [boardColors, setBoardColors] = useAtom(boardColorsAtom);
    const [moveColors, setMoveColors] = useAtom(moveColorsAtom);
    const [themeColors, setThemeColors] = useAtom(themeColorsAtom);

    const [expandedTab, setExpandedTab] = useAtom(colorSettingsTabAtom);

    function isSelectedPreset(preset: BoardColors): boolean {
        return preset.light === boardColors.light && preset.dark === boardColors.dark;
    }

    return (<Stack>
        <Accordion defaultValue={expandedTab as Tab} value={expandedTab as Tab} onChange={(v) => {setExpandedTab(v as Tab)}} variant={"contained"}>

            {/* Board Colors */}
            <Accordion.Item value={"board"}>
                <Accordion.Control icon={<FaChessBoard size={20} color={"var(--color-fg-1)"} />}>
                    <Text fw={500}>Board Colors</Text>
                </Accordion.Control>

                <Accordion.Panel>
                    <Stack>
                        <Stack gap={"xs"}>
                            <Text size={"sm"}>Presets</Text>
                            <Group gap={"sm"}>
                                {Object.entries(BoardColorPreset).map(([name, preset]) => (
                                    <Tooltip label={name} key={name}>
                                        <UnstyledButton
                                            onClick={() => {setBoardColors(preset)}}
                                            w={32} h={32}
                                            bdrs={4} bd={isSelectedPreset(preset) ? "solid 2px white" : "solid 2px transparent"}
                                            className={"flex flex-row overflow-hidden"}
                                        >
                                            <div className={"flex-1"} style={{backgroundColor: preset.light}}></div>
                                            <div className={"flex-1"} style={{backgroundColor: preset.dark}}></div>
                                        </UnstyledButton>
                                    </Tooltip>
                                ))}
                            </Group>
                        </Stack>
                        
                        <ColorField
                            label={"Light Squares"}
                            value={boardColors.light}
                            onChange={(value: string) => {
                                setBoardColors(c => ({light: value, dark: c.dark}));
                            }}
                        />

                        <ColorField
                            label={"Dark Squares"}
                            value={boardColors.dark}
                            onChange={(value: string) => {
                                setBoardColors(c => ({light: c.light, dark: value}));
                            }}
                        />
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>

            {/* Move Colors */}
            <Accordion.Item value={"move"}>
                <Accordion.Control icon={<FaRegChessKing size={20} color={"var(--color-fg-1)"}/>}>
                    <Text fw={500}>Move Colors</Text>
                </Accordion.Control>

                <Accordion.Panel>
                    <Stack>
                        <ColorField
                            label={"Regular Move"}
                            value={moveColors.regular}
                            defaultValue={DefaultMoveColors.regular}
                            alpha={true}
                            onChange={(value: string) => {
                                setMoveColors(c => ({...c, regular: value}))
                            }}
                        />

                        <ColorField
                            label={"Rule Move"}
                            value={moveColors.rule}
                            defaultValue={DefaultMoveColors.rule}
                            alpha={true}
                            onChange={(value: string) => {
                                setMoveColors(c => ({...c, rule: value}))
                            }}
                        />

                        <ColorField
                            label={"Bluff Move"}
                            value={moveColors.bluff}
                            defaultValue={DefaultMoveColors.bluff}
                            alpha={true}
                            onChange={(value: string) => {
                                setMoveColors(c => ({...c, bluff: value}))
                            }}
                        />
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>

            {/* Site Theme Colors */}
            <Accordion.Item value={"theme"}>
                <Accordion.Control icon={<FaPalette size={20} color={"var(--color-fg-1)"}/>}>
                    <Text fw={500}>Site Theme Colors</Text>
                </Accordion.Control>

                <Accordion.Panel>
                    <Stack>
                        <ColorField
                            label={"Accent"}
                            value={themeColors.accent}
                            defaultValue={DefaultThemeColors.accent}
                            alpha={true}
                            onChange={(value: string) => {
                                setThemeColors(c => ({...c, accent: value}))
                            }}
                        />

                        <ColorField
                            label={"Text"}
                            value={themeColors.text}
                            defaultValue={DefaultThemeColors.text}
                            alpha={true}
                            onChange={(value: string) => {
                                setThemeColors(c => ({...c, text: value}))
                            }}
                        />

                        <ColorField
                            label={"Alt Text"}
                            value={themeColors.altText}
                            defaultValue={DefaultThemeColors.altText}
                            alpha={true}
                            onChange={(value: string) => {
                                setThemeColors(c => ({...c, altText: value}))
                            }}
                        />

                        <ColorField
                            label={"Background"}
                            value={themeColors.background}
                            defaultValue={DefaultThemeColors.background}
                            alpha={true}
                            onChange={(value: string) => {
                                setThemeColors(c => ({...c, background: value}))
                            }}
                        />

                        <ColorField
                            label={"Panel"}
                            value={themeColors.panel}
                            defaultValue={DefaultThemeColors.panel}
                            alpha={true}
                            onChange={(value: string) => {
                                setThemeColors(c => ({...c, panel: value}))
                            }}
                        />
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    </Stack>)
}


export default ColorSettings;