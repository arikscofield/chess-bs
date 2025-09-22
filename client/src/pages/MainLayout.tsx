import {Outlet} from "react-router";
import {AppShell} from "@mantine/core";
import NavBar from "../components/NavBar.tsx";


function MainLayout() {
    return (<AppShell
        padding={"md"}
        header={{ height: 50 }}
        classNames={{
            main: "flex justify-center"
        }}
    >
        <AppShell.Header>

            <NavBar/>

        </AppShell.Header>

        <AppShell.Main>

            <Outlet/>
        </AppShell.Main>
    </AppShell>)
}


export default MainLayout;