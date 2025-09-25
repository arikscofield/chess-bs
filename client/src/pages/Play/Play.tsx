import '../Home/Home.css'

import {useNavigate, useParams} from "react-router";
import {useContext, useEffect, useState} from "react";
import {
    AckStatus,
    Color,
    type GameState, type Move,
    type PlayerState,
} from "@chess-bs/common";
import Player from "@chess-bs/common/dist/player.js";
import {SocketContext} from "../../components/Socket/SocketContext.ts";
import Board from "../../components/Board.tsx";
import BoardClass from "@chess-bs/common/dist/board.js";
import {Group} from "@mantine/core";
import BluffButton from "../../components/BluffButton.tsx";
import CallBluffButton from "../../components/CallBluffButton.tsx";


function Play() {
    const { gameCode: gameId } = useParams();
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [board, setBoard] = useState<BoardClass | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);

    const [view, setView] = useState<Color | null>(null);
    const [turnColor, setTurnColor] = useState<Color>(Color.White);
    const [isBluffing, setIsBluffing] = useState<boolean>(false);

    const socket = useContext(SocketContext);

    useEffect(() => {
        if (isMounted) return;
        console.log(`Attempted to join game ${gameId} from url`);
        if (socket && gameId) {

            socket.on("gameState", (gameState: GameState) => {
                console.log("Received Game State: ");
                console.log(gameState);
                setGameState(gameState);
                setTurnColor(gameState.turn);
                setBoard(new BoardClass(gameState.grid, gameState.enPassant));
            });

            socket.on("playerState", (playerState: PlayerState) => {
                console.log("Received Player State: ");
                console.log(playerState);
                setPlayerState(playerState);
                setPlayer(Player.fromPlayerState(playerState));
                if (!view) setView(playerState.color);
            });

            handleJoinGame(gameId);
        } else {
            navigate("/");
        }

        setIsMounted(true);
    }, [])


    function handleJoinGame(gameId: string) {
        console.log("Test");
        socket?.emit("joinGame", gameId, (response) => {
            if (response.status === AckStatus.OK) {
                console.log(`Joined game: ${gameId}`)
            } else {
                navigate("/");
                console.error(response.message);
            }
        });
    }

    function handleMove(move: Move) {
        socket?.emit("move", gameId || "", move, (response) => {
            if (response.status === AckStatus.OK) {
                console.log("Move successful")

            } else if (response.status === AckStatus.ERROR) {
                console.error(response.message);
            }
        })
    }


    if (!isMounted || !socket) return;

    if (!gameId) return;

    return (<div>
        {board && player && <Board
            board={board}
            player={player}
            view={view || Color.White}
            turn={turnColor}
            isBluffing={isBluffing}
            handleMove={handleMove}
        />
        }
        <Group justify={"center"} gap={50} py={10}>
            <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
            <CallBluffButton gameId={gameId} />
        </Group>

    </div>)
}


export default Play;