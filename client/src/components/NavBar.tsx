import {Drawer, Group, Title, UnstyledButton} from "@mantine/core";
import {FiSettings} from "react-icons/fi";
import {useDisclosure} from "@mantine/hooks";

function NavBar() {

    const [settingsOpened, { open: settingsOpen, close: settingsClose }] = useDisclosure(false);

    return (
        <div className={"w-full h-full bg-bg-1/95 backdrop-blur-md text-white"}>
            <Group h={"100%"} px={"md"}>
                <Title order={2} ><a href={"/"}>Bluff Chess</a></Title>

                <div className={"flex-1"}/>

                <UnstyledButton onClick={settingsOpen}>
                    <FiSettings size={30} className={"text-white hover:text-gray-300 transition-colors"}/>
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