import {Outlet} from "react-router";
import {AppShell} from "@mantine/core";
import NavBar from "../components/NavBar.tsx";
import ThemeSync from "../components/ThemeSync.tsx";


function MainLayout() {
    return (<AppShell
        padding={"md"}
        header={{ height: 56 }}
        classNames={{
            main: "flex flex-col",
            header: "border-none bg-transparent"
        }}
    >
        <ThemeSync/>

        <AppShell.Header>
            <NavBar/>
        </AppShell.Header>

        <AppShell.Main className={"flex-1"}>
            <div className={"flex-1 w-full max-w-[1920px] mx-auto"}>
                <Outlet/>
            </div>
        </AppShell.Main>
    </AppShell>)
}


export default MainLayout;