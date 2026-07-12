import {ActionIcon, Drawer, Group, Stack, Text, UnstyledButton} from "@mantine/core";
import {FiChevronLeft, FiChevronRight, FiSettings} from "react-icons/fi";
import {useDisclosure} from "@mantine/hooks";
import Logo from "./Logo.tsx";
import {useState} from "react";
import ColorSettings from "./ColorSettings.tsx";


type SettingsTab = "menu" | "colors";

function NavBar() {

    const [settingsOpened, { open: settingsOpen, close: settingsClose }] = useDisclosure(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTab>("menu");


    function closeSettings() {
        settingsClose();
        setSettingsTab("menu");
    }

    return (
        <div className={"w-full h-full bg-bg-1/95 backdrop-blur-md text-white"}>
            <Group h={"100%"} px={"md"}>
                <Logo/>

                <div className={"flex-1"}/>

                <UnstyledButton onClick={settingsOpen}>
                    <FiSettings size={30} className={"text-fg-2 hover:text-fg-3 transition-colors"}/>
                </UnstyledButton>

                <Drawer
                    opened={settingsOpened}
                    onClose={closeSettings}
                    position={"right"}
                    title={
                    settingsTab === "menu"
                        ? <Text fw={600}>Settings</Text>
                        : <Group>
                            <ActionIcon variant={"subtle"} onClick={() => setSettingsTab("menu")} color={"var(--color-fg-1)"}>
                                <FiChevronLeft size={20}/>
                            </ActionIcon>
                            <Text fw={600}>Colors</Text>
                        </Group>
                }
                >
                    {settingsTab === "menu" && <Stack>
                        <button
                            onClick={() => setSettingsTab("colors")}
                            className={"flex flex-row items-center justify-between px-2 py-2 rounded-lg bg-white/5  hover:bg-white/10 cursor-pointer transition-colors"}
                        >
                            <Text>Colors</Text>
                            <FiChevronRight size={20}/>
                        </button>
                    </Stack>}

                    {settingsTab === "colors" && <ColorSettings/>}
                </Drawer>
            </Group>
        </div>
    );
}



export default NavBar;