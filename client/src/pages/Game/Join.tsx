import {Button, Loader} from "@mantine/core";
import {useAtomValue} from "jotai";
import {gameIdAtom} from "./atoms.ts";
import {useSocket} from "../../components/context/SocketContext.ts";
import {useAuth} from "../../components/context/AuthContext.ts";


function Join({handleJoinGame}: {handleJoinGame: (gameId: string) => void}) {

    const gameId = useAtomValue(gameIdAtom);
    const socket = useSocket();
    const { isConnected } = useAuth();

    if (!isConnected || !socket) {
        return <div className="flex flex-col justify-center items-center min-h-[calc(100vh-82px)] w-screen text-white">
            <Loader />
            <p>Connecting to server...</p>
        </div>
    }


    return (<div className={"flex flex-col justify-center items-center min-h-[calc(100vh-82px)] w-screen text-white"}>
        <Button
            onClick={() => {handleJoinGame(gameId)}}
        >Join</Button>
    </div>)
}


export default Join;