import {Outlet} from "react-router";
import NavBar from "../components/NavBar.tsx";


function MainLayout() {


    return (<div>
        <NavBar/>

        <Outlet/>
    </div>)
}


export default MainLayout;