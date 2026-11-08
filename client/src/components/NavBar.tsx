import {ActionIcon, Drawer, Group, Stack, Text, Tooltip, UnstyledButton} from "@mantine/core";
import {FiChevronLeft, FiChevronRight, FiDroplet, FiSettings} from "react-icons/fi";
import {useDisclosure} from "@mantine/hooks";
import Logo from "./Logo.tsx";
import {useState} from "react";
import ColorSettings from "./ColorSettings.tsx";
import {NavLink} from "react-router";


type SettingsTab = "menu" | "colors";

const NAV_LINKS = [
    {to: "/", label: "Play"},
    {to: "/games", label: "Public games"},
]

function NavBar() {

    const [settingsOpened, { open: settingsOpen, close: settingsClose }] = useDisclosure(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTab>("menu");


    function closeSettings() {
        settingsClose();
        setSettingsTab("menu");
    }

    return (
        <div className={"w-full h-full bg-bg-1/90 backdrop-blur-md border-b border-white/5"}>
            <div className={"flex flex-row items-center h-full gap-6 px-4 max-w-[1920px] mx-auto"}>
                <Logo/>

                <nav className={"flex flex-row items-center gap-1"}>
                    {NAV_LINKS.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end
                            className={({isActive}) =>
                                `hidden sm:block px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    isActive ? "text-fg-2 bg-white/5" : "text-fg-3 hover:text-fg-2 hover:bg-white/5"
                                }`}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className={"flex-1"}/>

                <Tooltip label={"Settings"}>
                    <ActionIcon variant={"subtle"} color={"gray"} size={"xl"} onClick={settingsOpen} aria-label={"Settings"}>
                        <FiSettings size={28}/>
                    </ActionIcon>
                </Tooltip>
            </div>

            <Drawer
                opened={settingsOpened}
                onClose={closeSettings}
                position={"right"}
                title={
                    settingsTab === "menu"
                        ? <Text fw={700} size={"lg"}>Settings</Text>
                        : <Group gap={"xs"}>
                            <ActionIcon variant={"subtle"} color={"gray"} onClick={() => setSettingsTab("menu")} aria-label={"Back"}>
                                <FiChevronLeft size={20}/>
                            </ActionIcon>
                            <Text fw={700} size={"lg"}>Colors</Text>
                        </Group>
                }
            >
                {settingsTab === "menu" && <Stack gap={"xs"}>
                    <UnstyledButton
                        onClick={() => setSettingsTab("colors")}
                        className={"flex flex-row items-center gap-3 px-3 py-3 rounded-lg bg-bg-2/60 hover:bg-bg-2 transition-colors"}
                    >
                        <div className={"flex items-center justify-center w-9 h-9 rounded-md bg-fg-1/15 text-fg-1"}>
                            <FiDroplet size={18}/>
                        </div>
                        <div className={"flex-1"}>
                            <Text fw={600} size={"sm"}>Colors</Text>
                            <Text size={"xs"} c={"dimmed"}>Board, move highlights, and site theme</Text>
                        </div>
                        <FiChevronRight size={18} className={"text-fg-3"}/>
                    </UnstyledButton>
                </Stack>}

                {settingsTab === "colors" && <ColorSettings/>}
            </Drawer>
        </div>
    );
}



export default NavBar;