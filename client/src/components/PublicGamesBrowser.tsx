import {
    BluffPunishment,
    CreateGameColor,
    type GameDTO,
    type GameJoinRequest,
    type GenericCallback,
    type GetPublicGamesResponse,
    PublicGameSortBy,
    type PublicGamesQueryRequest,
    PublicGamesQuerySchema,
    SortDir
} from "@chess-bs/common";
import {useCallback, useEffect, useMemo, useState} from "react";
import {
    ActionIcon, Badge,
    Button, Card, Drawer,
    Group,
    Modal,
    NumberInput,
    Pagination,
    Popover,
    rgba,
    Select,
    Stack,
    Switch,
    Table,
    Text
} from "@mantine/core";
import {useSocket} from "./context/SocketContext.ts";
import {useAuth} from "./context/AuthContext.ts";
import {useNavigate} from "react-router";
import RuleList from "./RuleList.tsx";
import {IoRefresh} from "react-icons/io5";
import {useMediaQuery} from "@mantine/hooks";

const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP ?? window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT ?? 3000;

const DEFAULT_QUERY: PublicGamesQueryRequest = PublicGamesQuerySchema.parse({
    sortBy: PublicGameSortBy.CreatedAt,
    sortDir: SortDir.Desc,
})

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

function buildUrl(query: PublicGamesQueryRequest) {
    const url = new URL(`http://${SERVER_IP}:${SERVER_PORT}/api/publicgames`);
    const p = url.searchParams;

    p.set("page", String(query.page));
    p.set("pageSize", String(query.pageSize));
    p.set("sortBy", String(query.sortBy));
    p.set("sortDir", String(query.sortDir));

    if (query.usesClock !== undefined) p.set("usesClock", String(query.usesClock));
    if (query.minStartSeconds !== undefined) p.set("minStartSeconds", String(query.minStartSeconds));
    if (query.maxStartSeconds !== undefined) p.set("maxStartSeconds", String(query.maxStartSeconds));
    if (query.minIncrementSeconds !== undefined) p.set("minIncrementSeconds", String(query.minIncrementSeconds));
    if (query.maxIncrementSeconds !== undefined) p.set("maxIncrementSeconds", String(query.maxIncrementSeconds));
    if (query.minRuleCount !== undefined) p.set("minRuleCount", String(query.minRuleCount));
    if (query.maxRuleCount !== undefined) p.set("maxRuleCount", String(query.maxRuleCount));
    if (query.bluffPunishment !== undefined) p.set("bluffPunishment", query.bluffPunishment);
    if (query.creatorColor !== undefined) p.set("creatorColor", query.creatorColor);

    return url;
}

function formatTimeControl(game: GameDTO) {
    return game.usesClock ? `${(game.clockStartMs ?? 0) / 60000}+${(game.clockIncrementMs ?? 0) / 1000}` : `Unlimited`
}

function SortIndicator({ state }: { state: SortDir | undefined }) {
    return (
        <span
            aria-hidden
            style={{ display: "inline-block", width: "1.1em", textAlign: "center" }}
        >
            {state === SortDir.Asc ? (
                "\u25B2"
            ) : state === SortDir.Desc ? (
                "\u25BC"
            ) : (
                <span style={{ opacity: 0.3 }}>{"\u2195"}</span>
            )}
        </span>
    );
}

function PublicGamesBrowser() {

    const socket = useSocket();
    const { isConnected } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width: 48em)") ?? false;

    const [games, setGames] = useState<GameDTO[]>([]);
    const [totalGames, setTotalGames] = useState<number>(0);

    const [query, setQuery] = useState<PublicGamesQueryRequest>(DEFAULT_QUERY);
    const [draftQuery, setDraftQuery] = useState<PublicGamesQueryRequest>(DEFAULT_QUERY);
    const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

    const [rulePoolModalOpen, setRulePoolModalOpen] = useState(false);
    const [rulePoolIds, setRulePoolIds] = useState<number[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = buildUrl(query);
            const response = await fetch(url, { method: "GET", credentials: "include" });

            if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                setError(json.message ?? json.error ?? `Request failed (${response.status})`);
                console.error(json.message);
                console.error(json.error);
                return;
            }

            const data: GetPublicGamesResponse = await response.json();
            setGames(data.publicGames);
            setTotalGames(data.total);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to fetch games");
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        fetchData(); // TODO: Add visible error when fetch failed

    }, [fetchData]);


    function handleJoinGame(gameId: string): void {
        if (!socket) {
            console.error("socket not connected");
            return;
        }

        const payload: GameJoinRequest = {
            gameId: gameId,
        }
        socket.emit("game:join", payload, ((ok, message,) => {
            if (!ok) {
                navigate("/");
                console.error(message);
                return;
            }
            navigate(`/${gameId}`);
            return;
        }) as GenericCallback);
    }


    function handlePageSizeChange(value: string | null) {
        if (!value) return;
        setQuery(q => ({...q, page: 0, pageSize: Number(value)}));
    }

    function openFilters() {
        setDraftQuery(query);
        setFiltersOpen(open => !open);
    }

    function resetFilters() {
        setDraftQuery(DEFAULT_QUERY);
        setQuery(DEFAULT_QUERY);
    }

    function applyFilters() {
        setQuery(draftQuery);
        setFiltersOpen(false);
    }

    function openRulePool(ruleIds: number[]) {
        setRulePoolIds(ruleIds);
        setRulePoolModalOpen(true);
    }

    // Handles sorting a column when clicked
    function cycleSort(column: PublicGameSortBy) {
        if (query.sortBy !== column) {
            setQuery(q => ({...q, page: 0, sortBy: column, sortDir: SortDir.Desc }));
            return;
        }
        if (query.sortDir === SortDir.Desc) {
            setQuery(q => ({...q, page: 0, sortBy: column, sortDir: SortDir.Asc }));
            return;
        }
        setQuery(q => ({...q, page: 0, sortBy: PublicGameSortBy.CreatedAt, sortDir: SortDir.Desc }));
    }

    function toggleSortDir() {
        setQuery(q => ({...q, sortDir: query.sortDir === SortDir.Asc ? SortDir.Desc : SortDir.Asc }));
    }

    const activeFilterCount = useMemo(
        () =>
            Object.entries(query).filter(([key, value]) =>
                !["page", "pageSize", "sortBy", "sortDir"].includes(key) && value,
            ).length,
        [query],
    );

    const totalPages = Math.max(1, Math.ceil(totalGames / query.pageSize));

    const filterForm = <Stack gap="sm" className={"text-white min-w-[280px]"}>
        <Group grow>
            <Switch
                label="Only timed games"
                checked={draftQuery.usesClock}
                onChange={e =>
                    setDraftQuery(q => ({ ...q, usesClock: e.currentTarget.checked ? true : undefined }))
                }
                color={"var(--color-fg-1)"}
            />
            <Switch
                label="Only non-timed games"
                checked={draftQuery.usesClock === false}
                onChange={e =>
                    setDraftQuery(q => ({ ...q, usesClock: e.currentTarget.checked ? false : undefined }))
                }
                color={"var(--color-fg-1)"}
            />
        </Group>


        <Group grow>
            <NumberInput
                label="Min start (s)"
                min={0}
                value={draftQuery.minStartSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, minStartSeconds: v === "" ? undefined : Number(v) }))
                }
            />
            <NumberInput
                label="Max start (s)"
                min={0}
                value={draftQuery.maxStartSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, maxStartSeconds: v === "" ? undefined : Number(v) }))
                }
            />
        </Group>

        <Group grow>
            <NumberInput
                label="Min increment (s)"
                min={0}
                value={draftQuery.minIncrementSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, minIncrementSeconds: v === "" ? undefined : Number(v) }))
                }
            />
            <NumberInput
                label="Max increment (s)"
                min={0}
                value={draftQuery.maxIncrementSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, maxIncrementSeconds: v === "" ? undefined : Number(v) }))
                }
            />
        </Group>

        <Group grow>
            <NumberInput
                label="Min rules"
                min={1}
                value={draftQuery.minRuleCount}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, minRuleCount: v === "" ? undefined : Number(v) }))
                }
            />
            <NumberInput
                label="Max rules"
                min={1}
                value={draftQuery.maxRuleCount}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, maxRuleCount: v === "" ? undefined : Number(v) }))
                }
            />
        </Group>

        <Select
            comboboxProps={{ withinPortal: false }}
            label="Bluff punishment"
            placeholder="Any"
            clearable
            data={[
                { label: "Lose Turn", value: BluffPunishment.Turn},
                { label: "Lose Piece (You Pick)", value: BluffPunishment.Piece},
                { label: "Lose Piece (Opponent Picks)", value: BluffPunishment.PieceOpponent},
                { label: "Lose Piece (Random)", value: BluffPunishment.PieceRandom},
            ]}
            value={draftQuery.bluffPunishment || null}
            onChange={v => setDraftQuery(q => ({ ...q, bluffPunishment: v as BluffPunishment ?? undefined }))}
        />

        <Select
            comboboxProps={{ withinPortal: false }}
            label="Creator color"
            placeholder="Any"
            clearable
            data={Object.values(CreateGameColor)}
            value={draftQuery.creatorColor || null}
            onChange={v => setDraftQuery(q => ({ ...q, creatorColor: v as CreateGameColor ?? undefined }))}
        />

        <Group justify="space-between" mt="xs">
            <Button variant={"subtle"} color={"var(--color-fg-1)"} onClick={resetFilters}>
                Reset
            </Button>
            <Button color={"var(--color-fg-1)"} onClick={applyFilters}>Apply</Button>
        </Group>
    </Stack>;

    const rows = games.map(game => (
        <Table.Tr key={game.gameId}>
            <Table.Td>{formatTimeControl(game)}</Table.Td>
            <Table.Td className={"capitalize"}>{game.bluffPunishment}</Table.Td>
            <Table.Td>{game.ruleCount}</Table.Td>
            <Table.Td>
                <Button
                    size={"sm"}
                    variant={"outline"}
                    color={"var(--color-fg-1)"}
                    onClick={() => {
                        openRulePool(game.rulePoolIds);
                    }}
                >
                    Rule Pool
                </Button>
            </Table.Td>
            <Table.Td>
                <Button
                    disabled={!isConnected}
                    color={"var(--color-fg-1)"}
                    onClick={() => {handleJoinGame(game.gameId)}}
                >
                    Join
                </Button>
            </Table.Td>
        </Table.Tr>
    ))

    return (<Stack gap={"md"} className={"text-white"}>

        {/* Above table */}
        <Group justify={"space-between"}>
            <Group gap={"sm"}>
                {/* Refresh Button*/}
                <Button color={"var(--color-fg-1)"} onClick={fetchData} loading={loading}>
                    <IoRefresh size={20}/>
                    Refresh
                </Button>

                {/* Mobile: filters are shown in bottom drawer */}
                {isMobile ?
                <div>
                    <Button
                        color={"var(--color-fg-1)"}
                        onClick={openFilters}
                    >
                        Filters{activeFilterCount ? `(${activeFilterCount})` : ""}
                    </Button>
                    <Drawer
                        opened={filtersOpen}
                        onClose={() => setFiltersOpen(false)}
                        position={"bottom"}
                        size={"auto"}
                        radius={"md"}
                        title={"Filters"}
                        padding={"md"}
                    >
                        {filterForm}
                    </Drawer>
                </div>
                // Desktop: filters are shown in Popover
                : <Popover
                    opened={filtersOpen}
                    onChange={setFiltersOpen}
                    position={"bottom-start"}
                    withArrow
                    shadow={"md"}
                    trapFocus
                >
                    <Popover.Target>
                        <Button
                            color={"var(--color-fg-1)"}
                            onClick={openFilters}
                        >
                            Filters{activeFilterCount ? `(${activeFilterCount})` : ""}
                        </Button>
                    </Popover.Target>
                    <Popover.Dropdown className={""} bg={"var(--color-bg-1)"} >{filterForm}</Popover.Dropdown>
                </Popover>
                }

                {/* Mobile sort-control */}
                {isMobile && <Group>
                    <Select
                        data={[
                            { label: "Newest", value: PublicGameSortBy.CreatedAt},
                            { label: "Time Control", value: PublicGameSortBy.Clock},
                            { label: "Clock Start", value: PublicGameSortBy.ClockStart},
                            { label: "Clock Increment", value: PublicGameSortBy.ClockIncrement},
                            { label: "Rule Count", value: PublicGameSortBy.RuleCount},
                            { label: "Bluff Punishment", value: PublicGameSortBy.BluffPunishment},
                        ]}
                        value={query.sortBy}
                        onChange={v => v && setQuery(q => ({ ...q, sortBy: v as PublicGameSortBy }))}
                        w={150}
                    />
                    <ActionIcon
                        size={"lg"}
                        onClick={toggleSortDir}
                        color={"var(--color-fg-1)"}
                    >
                        {query.sortDir === SortDir.Asc ? "\u25B2" : "\u25BC"}
                    </ActionIcon>
                </Group>}
            </Group>
        </Group>

        {error && <Text c={"red"} size={"sm"}>{error}</Text>}

        {isMobile
            // Mobile: show games as separate cards
            ? <Stack>
                {games.map(game => (
                    <Card key={game.gameId} withBorder radius={"lg"} padding={"sm"}>
                        <Group justify={"space-between"}>
                            <Text fw={600}>{formatTimeControl(game)}</Text>
                            <Badge tt={"capitalize"} color={"var(--color-fg-1)"} variant={"light"}>
                                {game.bluffPunishment}
                            </Badge>
                        </Group>
                        <Text size={"sm"} c={"dimmed"} mb={"sm"}>
                            {game.ruleCount} rule{game.ruleCount === 1 ? "" : "s"}
                        </Text>
                        <Group grow>
                            <Button variant={"light"} color={"var(--color-fg-1)"}
                                    onClick={() => {openRulePool(game.rulePoolIds);}}>
                                Rule Pool
                            </Button>
                            <Button color={"var(--color-fg-1)"} onClick={() => {handleJoinGame(game.gameId)}}>
                                Join
                            </Button>
                        </Group>
                    </Card>
                ))}
            </Stack>
            // Desktop: Show games as a table
            : <Table.ScrollContainer minWidth={400} bg={rgba("fff", 0)}>
                <Table stickyHeader horizontalSpacing={"xs"}>
                    <Table.Thead>
                        <Table.Tr className={"[&>*]:bg-bg-1! rounded-lg [&>*]:p-3!"}>
                            <Table.Th
                                onClick={() => cycleSort(PublicGameSortBy.Clock)}
                                style={{ cursor: "pointer", userSelect: "none"}}
                                className={"rounded-tl-lg"}
                            >
                                Time Control
                                <SortIndicator state={query.sortBy === PublicGameSortBy.Clock ? query.sortDir : undefined}/>
                            </Table.Th>
                            <Table.Th
                                onClick={() => cycleSort(PublicGameSortBy.BluffPunishment)}
                                style={{ cursor: "pointer", userSelect: "none" }}
                            >
                                Bluff Punishment
                                <SortIndicator state={query.sortBy === PublicGameSortBy.BluffPunishment ? query.sortDir : undefined}/>
                            </Table.Th>
                            <Table.Th
                                onClick={() => cycleSort(PublicGameSortBy.RuleCount)}
                                style={{ cursor: "pointer", userSelect: "none" }}
                            >
                                Rule Count
                                <SortIndicator state={query.sortBy === PublicGameSortBy.RuleCount ? query.sortDir : undefined}/>
                            </Table.Th>
                            <Table.Th>Rule Pool</Table.Th>
                            <Table.Th className={"rounded-tr-lg"}>Join</Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody className={""}>
                        {rows}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        }


        {!loading && games.length === 0 && (
            <Text c={"dimmed"} ta={"center"} py={"md"}>
                No public games found.
            </Text>
        )}

        <Group justify={"space-between"}>
            <Text c={"dimmed"}>{totalGames} game{totalGames === 1 ? "" : "s"}</Text>

            <Select
                data={PAGE_SIZE_OPTIONS}
                value={String(query.pageSize)}
                onChange={handlePageSizeChange}
                w={90}
                aria-label="Games per page"
                label={"Page size"}
            />

            <Pagination
                total={totalPages}
                color={"var(--color-fg-1)"}
                value={query.page + 1}
                onChange={p => setQuery(q => ({...q, page: p-1}))}
            />

        </Group>

        <Modal opened={rulePoolModalOpen} onClose={() => {setRulePoolModalOpen(false); setRulePoolIds([])}}>
            <RuleList enabledRuleIds={rulePoolIds} onlyShowEnabled={true}/>
        </Modal>
    </Stack>)

}


export default PublicGamesBrowser;