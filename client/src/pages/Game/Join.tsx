import {Button, Loader, Card, Text} from "@mantine/core";
import {useAtomValue} from "jotai";
import {bluffPunishmentAtom, gameIdAtom, ruleCountAtom} from "./atoms.ts";
import {useSocket} from "../../components/context/SocketContext.ts";
import {useAuth} from "../../components/context/AuthContext.ts";
import {FiLogIn} from "react-icons/fi";


function Join({handleJoinGame}: {handleJoinGame: (gameId: string) => void}) {

    const gameId = useAtomValue(gameIdAtom);
    const bluffPunishment = useAtomValue(bluffPunishmentAtom);
    const ruleCount = useAtomValue(ruleCountAtom);

    const socket = useSocket();
    const { isConnected } = useAuth();

    if (!isConnected || !socket) {
        return <div className="flex flex-col justify-center items-center min-h-[calc(100vh-82px)] w-full text-white">
            <Card className={"bg-bg-2/50! text-white! border-white/20!"} padding="xl" withBorder shadow={"md"}>
                <div className={"flex flex-col items-center gap-4"}>
                    <Loader />
                    <p>Connecting to server...</p>
                </div>
            </Card>
        </div>
    }


    return (<div className={"flex flex-col justify-center items-center min-h-[calc(100vh-82px)] text-white"}>
        <div className={"w-full max-w-md"}>
            <Card padding={"xl"} className={"bg-bg-2!"}>
                <div className={"flex flex-col items-center gap-6"}>
                    <div className="p-3 rounded-full bg-fg-1/10">
                        <FiLogIn size={32} className="text-fg-1" />
                    </div>

                    {/* Game Details */}
                    <div className={"flex flex-col items-center gap-1"}>
                        <Text size="md" c={"gray"}>
                            Game Code:{" "}
                            <Text inherit span fw={700} c={"var(--color-fg-1)"} className={"font-mono"}>{gameId}</Text>
                        </Text>
                        <Text size="md" c={"gray"}>
                            Bluff Punishment:{" "}
                            <Text inherit span fw={700} c={"var(--color-fg-1)"} className={"font-mono capitalize"}>{bluffPunishment}</Text>
                        </Text>
                        <Text size="md" c={"gray"}>
                            Rule Count:{" "}
                            <Text inherit span fw={700} c={"var(--color-fg-1)"} className={"font-mono capitalize"}>{ruleCount}</Text>
                        </Text>
                    </div>

                    {/* Join */}
                    <Button
                        size={"lg"}
                        color={"var(--color-fg-1)"}
                        onClick={() => {handleJoinGame(gameId)}}
                    >
                        Join Game
                    </Button>
                </div>
            </Card>
        </div>
    </div>)
}


export default Join;