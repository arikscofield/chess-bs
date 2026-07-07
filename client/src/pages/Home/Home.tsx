import './Home.css'

import {Button, Card, Grid, Group, Stack, Text, TextInput, Title} from "@mantine/core";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {
    BluffPunishment,
    BotDifficulty,
    type CreateBotGameRequest,
    CreateGameColor,
    type CreateGameRequest,
    type CreateGameResponse, GameVisibility
} from "@chess-bs/common";
import {useSocket} from "../../components/context/SocketContext.ts";
import CreateGameModal from "../../components/CreateGameModal.tsx";
import CreateBotGameModal from "../../components/CreateBotGameModal.tsx";
import {FaRobot} from "react-icons/fa";

const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP ?? window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT ?? 3000;

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
        gameVisibility: GameVisibility,
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
            gameVisibility: gameVisibility,
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-82px)] w-full py-8 px-4 sm:px-6 text-white">
        <div className={"w-full max-w-4xl"}>
            <div className={"text-center mb-5"}>
                <Title order={1}>
                    Bluff Chess
                </Title>
            </div>

            {/* How to play */}
            <Card className={"bg-bg-2! border border-white/10 "} mb={20}>
                <Title order={3} c={"white"} mb={10}>
                    How to Play
                </Title>
                <div className={"grid grid-cols-1 sm:grid-cols-3 gap-3"}>
                    <div className={"bg-bg-1/75 text-gray-200 rounded-lg p-4"}>
                        <div className={"text-fg-1 font-bold text-lg"}>1. Get Rules</div>
                        <Text>Each player is assigned secret rules that can change how their own pieces can move.</Text>
                    </div>

                    <div className={"bg-bg-1/75 text-gray-200 rounded-lg p-4"}>
                        <div className={"text-fg-1 font-bold text-lg"}>2. Bluff</div>
                        <Text>Bluff by making illegal moves disguised as one of your secret rules, or call out your opponent when they bluff.</Text>
                    </div>

                    <div className={"bg-bg-1/75 text-gray-200 rounded-lg p-4"}>
                        <div className={"text-fg-1 font-bold text-lg"}>3. Win</div>
                        <Text>You win by capturing the king, or when the opponent runs out of time.</Text>
                    </div>

                </div>
            </Card>

            {/* Find/Create Game */}
            <div className={"grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 mb-5"}>
                <Card className={"bg-bg-2! border-3 border-red-500/10 hover:border-fg-1/50 transition-colors cursor-pointer group"}
                      onClick={() => {navigate("/games")}}
                >
                    <div className={"flex flex-col justify-center gap-5 text-white"}>
                        <Title order={3} className={"text-xl group-hover:text-fg-1"}>Find a Game</Title>
                        <Text size={"sm"} className={"text-gray-200! group-hover:text-white! transition-colors"}>Find an existing public match</Text>
                    </div>
                </Card>

                <Card className={"bg-bg-2! border-3 border-green-500/10 hover:border-fg-1/50 transition-colors cursor-pointer group"}
                      onClick={handleCreateGame}
                >
                    <div className={"flex flex-col justify-center gap-5 text-white"}>
                        <Title order={3} className={"text-xl group-hover:text-fg-1"}>Create a Game</Title>
                        <Text size={"sm"} className={"text-gray-200! group-hover:text-white! transition-colors"}>Create a private or public match</Text>
                    </div>
                </Card>
            </div>

            {/* Join Game */}
            <Card className={"bg-bg-2! border-3 border-blue-500/10 transition-colors mb-5"}
                onClick={() => {handleJoinGame(gameCodeInput)}}
            >
                <Title order={3} c={"white"} mb={10}>Join a Game</Title>
                <div className={"flex flex-row gap-3"}>
                    <TextInput
                        size={"md"}
                        placeholder={"Enter game code"}
                        flex={1}
                        value={gameCodeInput}
                        onChange={(event) => setGameCodeInput(event.currentTarget.value)}
                        onKeyDown={event => {
                            if (event.key === "Enter" && gameCodeInput.trim()) {
                                handleJoinGame(gameCodeInput.trim());
                            }
                        }}
                    >

                    </TextInput>
                    <Button
                        size={"md"}
                        color={"var(--color-fg-1)"}
                        onClick={() => gameCodeInput.trim() && handleJoinGame(gameCodeInput.trim())}
                        disabled={!gameCodeInput.trim()}
                    >
                        Join
                    </Button>
                </div>
            </Card>

            {/* Play Bot */}
            <Card className={"bg-bg-2! border-3 border-orange-500/10 hover:border-fg-1/50 transition-colors cursor-pointer group"}
                onClick={handlePlayBot}
            >
                <div className={"flex flex-row justify-between"}>
                    <Title order={3} c={"white"}>Play a Bot</Title>
                    <FaRobot size={30} className={"text-fg-1/50 group-hover:text-fg-1"}/>
                </div>
            </Card>

        </div>

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
            error={createBotGameError}
        />
    </div>
    )

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
                <Button color={"green"} onClick={() => {navigate("/games")}}>Find a Game</Button>
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