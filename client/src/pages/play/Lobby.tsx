import {Socket} from "socket.io-client";
import {AckStatus, type ClientToServerEvents, Color, type ServerToClientEvents} from "@chess-bs/common";
import {useState} from "react";


function Lobby({ socket, setGameId }: { socket: Socket<ServerToClientEvents, ClientToServerEvents>, setGameId: (gameId: string) => void }) {

    const [gameIdInput, setGameIdInput] = useState<string>("");

    function handleCreateGame() {
        socket?.emit("createGame", Color.White, (response) => {
            if (response.status === AckStatus.OK && response.gameId) {
                console.log(`Created game: ${response.gameId}`)
                setGameId(response.gameId);
            } else {
                console.error(response.message);
            }
        });
    }

    function handleJoinGame() {
        socket?.emit("joinGame", gameIdInput, (response) => {
            if (response.status === AckStatus.OK) {
                console.log(`Joined game: ${gameIdInput}`)
                setGameId(gameIdInput);
            } else {
                console.error(response.message);
            }
        });
    }

    return (<div>
        <button
            onClick={() => {handleCreateGame();}}
        >
            Create Game
        </button>
        <button
            onClick={() => {handleJoinGame();}}
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