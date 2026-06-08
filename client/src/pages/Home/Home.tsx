import './Home.css'

import {Button, Grid, Group, Stack, TextInput, Title} from "@mantine/core";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {
    BluffPunishment,
    BotDifficulty,
    type CreateBotGameRequest,
    CreateGameColor,
    type CreateGameRequest,
    type CreateGameResponse
} from "@chess-bs/common";
import {useSocket} from "../../components/context/SocketContext.ts";
import CreateGameModal from "../../components/CreateGameModal.tsx";
import CreateBotGameModal from "../../components/CreateBotGameModal.tsx";

const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT;
const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP;

function Home() {
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);

    const [gameCodeInput, setGameCodeInput] = useState<string>("");

    const [createGameModalOpen, setCreateGameModalOpen] = useState<boolean>(false);
    const [createGameError, setCreateGameError] = useState<string>("");

    const [createBotGameModalOpen, setCreateBotGameModalOpen] = useState<boolean>(false);
    const [createBotGameError, setCreateBotGameError] = useState<string>("");

    const socket = useSocket();

    useEffect(() => {
        setIsMounted(true);
    }, [])


    function handleCreateGame() {
        setCreateGameModalOpen(true);
        setCreateGameError("");
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
        setCreateGameError("");

        if (!socket) {
            const error = "Server socket not connected";
            setCreateGameError(error);
            console.error(error);
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


    function handlePlayBot() {
        setCreateBotGameModalOpen(true);
        setCreateBotGameError("");
    }


    async function createBotGame(
        color: CreateGameColor,
        bluffPunishment: BluffPunishment,
        ruleCount: number,
        rulePoolIds: number[],
        botDifficulty: BotDifficulty,
    ): Promise<boolean> {
        setCreateBotGameError("");

        if (!socket) {
            // TODO: Add offline bot option
            const error = "Server socket not connected";
            setCreateGameError(error);
            console.error(error);
            return false;
        }

        const payload: CreateBotGameRequest = {
            color: color,
            bluffPunishment: bluffPunishment,
            ruleCount: ruleCount,
            rulePoolIds: rulePoolIds,
            botDifficulty: botDifficulty,
        }

        const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/api/games/bot`, {
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
            return false;
        }

        return response.json().then((data: CreateGameResponse) => {
            const gameId = data.gameId;
            navigate(`/${gameId}`);
            console.log(`Created game: ${gameId}`);
            return true;
        })
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

                <Button color={"orange"} onClick={handlePlayBot}>Play a Bot</Button>
            </Stack>
        </Grid.Col>

        <CreateGameModal
            opened={createGameModalOpen}
            onClose={() => setCreateGameModalOpen(false)}
            onSubmit={createGame}
            error={createGameError}
        />

        <CreateBotGameModal
            opened={createBotGameModalOpen}
            onClose={() => setCreateBotGameModalOpen(false)}
            onSubmit={createBotGame}
        />
    </Grid>
    )
}


export default Home;