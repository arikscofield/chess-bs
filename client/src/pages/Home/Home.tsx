import './Home.css'

import {Button, Grid, Group, Stack, TextInput, Title} from "@mantine/core";
import {useNavigate} from "react-router";
import {useContext, useEffect, useState} from "react";
import {
    AckStatus, BluffPunishment, CreateGameColor, type Rule,
} from "@chess-bs/common";
import {SocketContext} from "../../components/Socket/SocketContext.ts";
import CreateGameModal from "../../components/CreateGameModal.tsx";



function Home() {
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);

    const [gameCodeInput, setGameCodeInput] = useState<string>("");
    const [createGameModalOpen, setCreateGameModalOpen] = useState<boolean>(false);

    // const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const socket = useContext(SocketContext);

    useEffect(() => {
        setIsMounted(true);
    }, [])


    function handleCreateGame() {
        setCreateGameModalOpen(true);
    }

    function createGame(color: CreateGameColor, timeControlStartSeconds: number | undefined, timeControlIncrementSeconds: number | undefined, bluffPunishment: BluffPunishment, ruleCount: number, rulePool: Rule[]) {
        if (!socket) {
            console.error("Socket not connected");
            return;
        }

        socket.emit("createGame", color, timeControlStartSeconds, timeControlIncrementSeconds, bluffPunishment, ruleCount, rulePool, (response) => {
            if (response.status === AckStatus.OK && response.gameId) {
                navigate(`/${response.gameId}`);
                console.log(`Created game: ${response.gameId}`);
            } else {
                navigate("/");
                console.error(response.message);
            }
        });
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