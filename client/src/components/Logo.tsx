import {Text} from "@mantine/core";
import {Link} from "react-router";


function Logo() {


    return (<Link className={"flex flex-row"} to={"/"}>
        <img src={"/logo_light.svg"} alt={"Logo"} width={30} height={30}/>
        <div className={"flex flex-col justify-center gap-0"}>
            <Text size={"xl"}>BluffingChess</Text>
            <Text size={"xs"}>.com</Text>
        </div>
    </Link>)
}

export default Logo;