import './Home.css'

import {Button, Grid, Group, Stack, TextInput, Title} from "@mantine/core";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {BluffPunishment, CreateGameColor, type CreateGameRequest, type CreateGameResponse
} from "@chess-bs/common";
import {useSocket} from "../../components/context/SocketContext.ts";
import CreateGameModal from "../../components/CreateGameModal.tsx";

const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT;
const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP;

function Home() {
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);

    const [gameCodeInput, setGameCodeInput] = useState<string>("");
    const [createGameModalOpen, setCreateGameModalOpen] = useState<boolean>(false);

    const socket = useSocket();

    useEffect(() => {
        setIsMounted(true);
    }, [])


    function handleCreateGame() {
        setCreateGameModalOpen(true);
    }

    async function createGame(
        color: CreateGameColor,
        bluffPunishment: BluffPunishment,
        ruleCount: number,
        rulePoolIds: number[],
        usesClock: boolean,
        clockStartSeconds?: number,
        clockIncrementSeconds?: number,
        ) {
        if (!socket) {
            console.error("context not connected");
            return;
        }

        const payload: CreateGameRequest = {
            color: color,
            bluffPunishment: bluffPunishment,
            ruleCount: ruleCount,
            rulePoolIds: rulePoolIds,
            usesClock: usesClock,
        }
        if (usesClock) {
            payload.clockStartSeconds = clockStartSeconds
            payload.clockIncrementSeconds = clockIncrementSeconds;
        }

        const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/api/games`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            navigate("/");
            response.json().then((data) => {
                console.error(data.error)
            })
            return;
        }

        response.json().then((data: CreateGameResponse) => {
            const gameId = data.gameId;
            navigate(`/${gameId}`);
            console.log(`Created game: ${gameId}`);
        })
    }

    function handleJoinGame(gameId: string) {
        navigate(`/${gameId}`);
    }

    if (!isMounted) return;


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
            </Stack>
        </Grid.Col>

        <CreateGameModal
            opened={createGameModalOpen}
            onClose={() => setCreateGameModalOpen(false)}
            onSubmit={createGame}
        />
    </Grid>
    )
}


export default Home;