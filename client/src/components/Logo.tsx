import {Link} from "react-router";


function Logo() {

    return (<Link className={"flex flex-row items-center gap-2 shrink-0"} to={"/"} aria-label={"BluffingChess home"}>
        <img src={"/logo_light.svg"} alt={"Logo"} width={28} height={28}/>
        <span className={"text-lg font-bold tracking-tight text-fg-2"}>
            BluffingChess<span className={"text-fg-3 font-medium"}>.com</span>
        </span>
    </Link>)
}

export default Logo;