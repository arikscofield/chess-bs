import {Drawer, Group, Title, UnstyledButton} from "@mantine/core";
import {FiSettings} from "react-icons/fi";
import {useDisclosure} from "@mantine/hooks";

function NavBar() {

    const [settingsOpened, { open: settingsOpen, close: settingsClose }] = useDisclosure(false);

    return (
        <div className={"w-full h-full bg-bg-1 text-white"}>
            <Group h={"100%"} px={"md"} className={"float-start"}>
                <Title order={2} ><a href={"/"}>Bluff Chess</a></Title>
            </Group>
            <Group h={"100%"} px={"md"} className={"float-end"}>
                <UnstyledButton onClick={settingsOpen}>
                    <FiSettings size={30}/>
                </UnstyledButton>

                <Drawer
                    opened={settingsOpened}
                    onClose={settingsClose}
                    title={"Settings"}
                    position={"right"}
                >

                </Drawer>
            </Group>
        </div>
    );
}



export default NavBar;