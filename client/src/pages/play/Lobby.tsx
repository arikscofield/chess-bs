import {Socket} from "socket.io-client";
import {type ClientToServerEvents, type ServerToClientEvents} from "@chess-bs/common";
import {useState} from "react";


function Lobby({ socket, setGameId, createGame, joinGame }: { socket: Socket<ServerToClientEvents, ClientToServerEvents>, setGameId: (gameId: string) => void, createGame: () => void, joinGame: (gameId: string) => void }) {

    const [gameIdInput, setGameIdInput] = useState<string>("");

    return (<div>
        <button className={"bg-bg-2 border-2 border-transparent hover:border-fg-1 focus:border-fg-1 transition-colors"}
            onClick={() => {createGame();}}
        >
            Create Game
        </button>
        <button
            onClick={() => {joinGame(gameIdInput);}}
        >
            Join Game
        </button>
        <input
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
        />
    </div>)
}



export default Lobby;