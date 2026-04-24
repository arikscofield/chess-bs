import {Button} from "@mantine/core";
import {useAtomValue} from "jotai";
import {gameIdAtom} from "./atoms.ts";


function Join({handleJoinGame}: {handleJoinGame: (gameId: string) => void}) {

    const gameId = useAtomValue(gameIdAtom);


    return (<div className={"flex flex-col justify-center items-center min-h-[calc(100vh-82px)] w-screen text-white"}>
        <Button
            onClick={() => {handleJoinGame(gameId)}}
        >Join</Button>
    </div>)
}


export default Join;