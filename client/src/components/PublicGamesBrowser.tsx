import type {
    GameDTO,
    GameJoinRequest,
    GenericCallback,
    GetPublicGamesResponse
} from "@chess-bs/common";
import {useCallback, useEffect, useState} from "react";
import {Button, Modal, Popover, rgba, Table} from "@mantine/core";
import {useSocket} from "./context/SocketContext.ts";
import {useAuth} from "./context/AuthContext.ts";
import {useNavigate} from "react-router";
import RuleList from "./RuleList.tsx";

const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP ?? window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT ?? 3000;

function PublicGamesBrowser({}: {}) {

    const socket = useSocket();
    const { isConnected } = useAuth();
    const navigate = useNavigate();

    const [games, setGames] = useState<GameDTO[]>([]);
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalGames, setTotalGames] = useState<number>(0);

    const [rulePoolModalOpen, setRulePoolModalOpen] = useState(false);
    const [rulePoolIds, setRulePoolIds] = useState<number[]>([]);

    // async function fetchData() {
    const fetchData = useCallback(async () => {
        const url = new URL(`http://${SERVER_IP}:${SERVER_PORT}/api/publicgames`);
        url.searchParams.append('page', String(page));
        url.searchParams.append('pageSize', String(pageSize));

        const response = await fetch(url, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            const json = await response.json();
            console.error(json.message);
            console.error(json.error);
            return;
        }

        response.json().then((data: GetPublicGamesResponse) => {
            const { publicGames, total } = data;
            setGames(publicGames);
            setTotalGames(total);
        })
    }, [page, pageSize]);

    useEffect(() => {
        fetchData(); // TODO: Add visible error when fetch failed

    }, [fetchData, page, pageSize]);


    function handleJoinGame(gameId: string): void {
        if (!socket) {
            console.error("socket not connected");
            return;
        }

        const payload: GameJoinRequest = {
            gameId: gameId,
        }
        socket.emit("game:join", payload, ((ok, message, data) => {
            if (!ok) {
                navigate("/");
                console.error(message);
                return;
            }
            navigate(`/${gameId}`);
            return;
        }) as GenericCallback);
    }


    const rows = games.map(game => (
        <Table.Tr key={game.gameId}>
            <Table.Th>{game.usesClock ? `${(game.clockStartMs ?? 0) / 60000}+${(game.clockIncrementMs ?? 0) / 1000}` : `Unlimited`}</Table.Th>
            <Table.Th className={"capitalize"}>{game.bluffPunishment}</Table.Th>
            <Table.Th>{game.ruleCount}</Table.Th>
            <Table.Th>
                <Button onClick={() => {
                    setRulePoolModalOpen(true);
                    setRulePoolIds(game.rulePoolIds);
                }}
                >
                    Rule Pool
                </Button>
            </Table.Th>
            <Table.Th>
                <Button onClick={() => {handleJoinGame(game.gameId)}}>Join</Button>
            </Table.Th>
        </Table.Tr>
    ))

    return (<Table.ScrollContainer minWidth={400} bg={rgba("fff", 0)}>
        <Table stickyHeader >
            <Table.Thead>
                <Table.Tr>
                    <Table.Th bg={rgba("fff", 0)} >
                        <Button onClick={() => fetchData()}>Refresh</Button>
                    </Table.Th>
                </Table.Tr>
                <Table.Tr>
                    <Table.Th>Time Control</Table.Th>
                    <Table.Th>Bluff Punishment</Table.Th>
                    <Table.Th>Rule Count</Table.Th>
                    <Table.Th>Rule Pool</Table.Th>
                </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
                {rows}
            </Table.Tbody>
        </Table>

        <Modal opened={rulePoolModalOpen} onClose={() => {setRulePoolModalOpen(false); setRulePoolIds([])}}>
            <RuleList enabledRuleIds={rulePoolIds} onlyShowEnabled={true}/>
        </Modal>
    </Table.ScrollContainer>)

}


export default PublicGamesBrowser;