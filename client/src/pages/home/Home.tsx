import './Home.css'

import {Button, Grid, Group, Stack, TextInput, Title} from "@mantine/core";
import {useNavigate, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {
    AckStatus,
    type ClientToServerEvents,
    Color,
    type GameState,
    type PlayerState,
    type ServerToClientEvents
} from "@chess-bs/common";
import {io, type Socket} from "socket.io-client";
import Game from "./Game.tsx";


const SERVER_IP = "192.168.1.90";
const SERVER_PORT = 3000;

function Home() {
    // const [searchParams, setSearchParams] = useSearchParams();
    const { gameCode: urlGameId } = useParams();
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);
    const [gameId, setGameId] = useState<string>("");
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);

    const [gameCodeInput, setGameCodeInput] = useState<string>("");

    const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

    useEffect(() => {
        const newSocket = io(`http://${SERVER_IP}:${SERVER_PORT}`, {
            withCredentials: true,
        });

        newSocket.on("gameState", (gameState: GameState) => {
            console.log("Received Game State: ");
            console.log(gameState);
            setGameState(gameState);
        });

        newSocket.on("playerState", (playerState: PlayerState) => {
            console.log("Received Player State: ");
            console.log(playerState);
            setPlayerState(playerState);
        });

        socket.current = newSocket;

        console.log(`Attempted to join game ${urlGameId} from url`);
        // const newGameId = searchParams.get("room");
        if (urlGameId) {
            handleJoinGame(urlGameId);
        }

        setIsMounted(true);

        return () => { newSocket.close(); };
    }, [])


    function handleCreateGame() {
        socket.current?.emit("createGame", Color.White, (response) => {
            if (response.status === AckStatus.OK && response.gameId) {
                console.log(`Created game: ${response.gameId}`)
                setGameId(response.gameId);
                navigate(`/${response.gameId}`);
            } else {
                setGameId("");
                navigate("/");
                console.error(response.message);
            }
        });
    }

    function handleJoinGame(gameId: string) {
        socket.current?.emit("joinGame", gameId, (response) => {
            if (response.status === AckStatus.OK) {
                console.log(`Joined game: ${gameId}`)
                setGameId(gameId);
                navigate(`/${gameId}`);
            } else {
                setGameId("");
                navigate("/");
                console.error(response.message);
            }
        });
    }

    if (!isMounted || !socket.current) return;


    if (gameId) {
        return (<Game gameId={gameId} socket={socket.current} gameState={gameState} playerState={playerState} />)
    }

    return (
    <Grid
        gutter={5}
        className={"w-full max-w-[1500px] text-white "}
    >
        <Grid.Col span={6}>
            <Stack gap={2}>
                <Title order={3} className={"text-center"}>How to play</Title>
                <div>blkasdf jlkj djkla lkdsj flkd sfljk dslkf jsdlkj fkld</div>
            </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
            <Stack gap={25}>
                <Title order={3} className={"text-center"}>Play</Title>
                <Button color={"green"} >Find a Game</Button>
                <Button color={"blue"} onClick={handleCreateGame}>Create a Game</Button>
                <Group grow>
                    <Button color={"cyan"} onClick={() => {handleJoinGame(gameCodeInput)}}>Join a Game</Button>
                    <TextInput
                        placeholder={"Game Code"}
                        value={gameCodeInput}
                        onChange={(event) => setGameCodeInput(event.currentTarget.value)}
                    />
                </Group>

                <Button color={"orange"}>Play a Bot</Button>
                <Button color={"red"}>Local Play</Button>
            </Stack>
        </Grid.Col>
    </Grid>
    )
}


export default Home;