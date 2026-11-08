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
    ActionIcon, Alert, Badge,
    Button, Drawer,
    Group,
    Modal,
    NumberInput,
    Pagination,
    Popover,
    Select,
    Stack,
    Switch,
    Table,
    Text, Tooltip
} from "@mantine/core";
import {useSocket} from "./context/SocketContext.ts";
import {useAuth} from "./context/AuthContext.ts";
import {useNavigate} from "react-router";
import RuleList from "./RuleList.tsx";
import {IoRefresh} from "react-icons/io5";
import {useMediaQuery} from "@mantine/hooks";
import {API_BASE} from "../utils/api.ts";
import {useCreateGame} from "../hooks/CreateGame.ts";
import {BLUFF_PUNISHMENT_LABELS, CreateGameMode, formatTimeControl} from "../utils/const.ts";
import {LuLayers, LuSlidersHorizontal} from "react-icons/lu";
import {FiPlus, FiUsers} from "react-icons/fi";
import CreateGameModal from "./CreateGameModal.tsx";


const DEFAULT_QUERY: PublicGamesQueryRequest = PublicGamesQuerySchema.parse({
    sortBy: PublicGameSortBy.CreatedAt,
    sortDir: SortDir.Desc,
})

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

function buildUrl(query: PublicGamesQueryRequest) {
    const url = new URL(`${API_BASE}/api/publicgames`, window.location.origin);
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

function SortIndicator({ state }: { state: SortDir | undefined }) {
    return (
        <span
            aria-hidden
            style={{ display: "inline-block", width: "1.1em", textAlign: "center", color: "var(--color-fg-3)", opacity: 0.75 }}
        >
            {state === SortDir.Asc ? (
                "\u25B2"
            ) : state === SortDir.Desc ? (
                "\u25BC"
            ) : (
                "\u2195"
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

    const [createOpen, setCreateOpen] = useState(false);
    const {createGame, error: createError, clearError} = useCreateGame();

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

    const filterForm = <Stack gap={"sm"} className={"min-w-70"}>
        <Group grow>
            <Switch
                label={<Text span size={"sm"}>Only timed games</Text>}
                checked={draftQuery.usesClock === true}
                onChange={e =>
                    setDraftQuery(q => ({ ...q, usesClock: e.currentTarget.checked ? true : undefined }))
                }
            />
            <Switch
                label={<Text span size={"sm"}>Only non-timed games</Text>}
                checked={draftQuery.usesClock === false}
                onChange={e =>
                    setDraftQuery(q => ({ ...q, usesClock: e.currentTarget.checked ? false : undefined }))
                }
            />
        </Group>


        <Group grow>
            <NumberInput
                label={<Text span size={"sm"} fw={500}>Min start (s)</Text>}
                min={0}
                value={draftQuery.minStartSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, minStartSeconds: v === "" ? undefined : Number(v) }))
                }
            />
            <NumberInput
                label={<Text span size={"sm"} fw={500}>Max start (s)</Text>}
                min={0}
                value={draftQuery.maxStartSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, maxStartSeconds: v === "" ? undefined : Number(v) }))
                }
            />
        </Group>

        <Group grow>
            <NumberInput
                label={<Text span size={"sm"} fw={500}>Min increment (s)</Text>}
                min={0}
                value={draftQuery.minIncrementSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, minIncrementSeconds: v === "" ? undefined : Number(v) }))
                }
            />
            <NumberInput
                label={<Text span size={"sm"} fw={500}>Max increment (s)</Text>}
                min={0}
                value={draftQuery.maxIncrementSeconds}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, maxIncrementSeconds: v === "" ? undefined : Number(v) }))
                }
            />
        </Group>

        <Group grow>
            <NumberInput
                label={<Text span size={"sm"} fw={500}>Min rules</Text>}
                min={1}
                value={draftQuery.minRuleCount}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, minRuleCount: v === "" ? undefined : Number(v) }))
                }
            />
            <NumberInput
                label={<Text span size={"sm"} fw={500}>Max rules</Text>}
                min={1}
                value={draftQuery.maxRuleCount}
                onChange={v =>
                    setDraftQuery(q => ({ ...q, maxRuleCount: v === "" ? undefined : Number(v) }))
                }
            />
        </Group>

        <Select
            comboboxProps={{ withinPortal: false }}
            label={<Text span size={"sm"} fw={500}>Bluff punishment</Text>}
            placeholder="Any"
            clearable
            data={[
                ...Object.values(BluffPunishment).map(p => ({label: BLUFF_PUNISHMENT_LABELS[p], value: p})),
            ]}
            value={draftQuery.bluffPunishment || null}
            onChange={v => setDraftQuery(q => ({ ...q, bluffPunishment: v as BluffPunishment ?? undefined }))}
        />

        <Select
            comboboxProps={{ withinPortal: false }}
            label={<Text span size={"sm"} fw={500}>Creator color</Text>}
            placeholder="Any"
            clearable
            data={Object.values(CreateGameColor)}
            value={draftQuery.creatorColor || null}
            onChange={v => setDraftQuery(q => ({ ...q, creatorColor: v as CreateGameColor ?? undefined }))}
        />

        <Group justify="space-between" mt="xs">
            <Button variant={"subtle"} color={"gray"} onClick={resetFilters}>
                Reset
            </Button>
            <Button onClick={applyFilters}>Apply</Button>
        </Group>
    </Stack>;

    function sortableHeader(label: string, column: PublicGameSortBy) {
        return <Table.Th
            onClick={() => cycleSort(column)}
            className={"cursor-pointer select-none hover:text-fg-2 transition-colors"}
        >
            <span className={"inline-flex items-center gap-1"}>
                {label}
                <SortIndicator state={query.sortBy === column ? query.sortDir : undefined}/>
            </span>
        </Table.Th>
    }

    const rows = games.map(game => (
        <Table.Tr key={game.gameId} className={"hover:bg-white/3 transition-colors"}>
            <Table.Td>
                <span className={"font-semibold text-fg-2 tabular"}>{formatTimeControl(game.usesClock, game.clockStartMs, game.clockIncrementMs)}</span>
            </Table.Td>
            <Table.Td className={"text-fg-2"}>{game.ruleCount}</Table.Td>
            <Table.Td className={"text-fg-2"}>{BLUFF_PUNISHMENT_LABELS[game.bluffPunishment]}</Table.Td>
            <Table.Td>
                <Button size={"compact-sm"} variant={"subtle"} color={"gray"} leftSection={<LuLayers size={14}/>}
                        onClick={() => openRulePool(game.rulePoolIds)}>
                    {game.rulePoolIds.length} rules
                </Button>
            </Table.Td>
            <Table.Td className={"text-right"}>
                <Button size={"compact-md"} disabled={!isConnected} onClick={() => handleJoinGame(game.gameId)}>
                    Join
                </Button>
            </Table.Td>
        </Table.Tr>
    ))

    const filtersButton = <Button
        variant={"default"}
        leftSection={<LuSlidersHorizontal size={15}/>}
        rightSection={activeFilterCount ? <Badge size={"sm"} circle>{activeFilterCount}</Badge> : undefined}
        onClick={openFilters}
    >
        Filters
    </Button>

    return (<div className={"w-full max-w-5xl mx-auto px-1 sm:px-4 py-4 sm:py-8 flex flex-col gap-5"}>

        {/* Header */}
        <div className={"flex flex-col sm:flex-row sm:items-end justify-between gap-4"}>
            <div>
                <h1 className={"text-2xl sm:text-3xl font-bold text-fg-2"}>Public games</h1>
                <p className={"text-fg-3 mt-1"}>Join an open game, or create your own for others to find.</p>
            </div>
            <Button leftSection={<FiPlus size={18}/>} onClick={() => { clearError(); setCreateOpen(true); }}>
                Create public game
            </Button>
        </div>

        {/* Toolbar */}
        <div className={"flex flex-row flex-wrap items-center gap-2"}>
            {isMobile
                ? <>
                    {filtersButton}
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
                </>
                : <Popover
                    opened={filtersOpen}
                    onChange={setFiltersOpen}
                    position={"bottom-start"}
                    withArrow
                    shadow={"md"}
                    trapFocus
                >
                    <Popover.Target>{filtersButton}</Popover.Target>
                    <Popover.Dropdown>{filterForm}</Popover.Dropdown>
                </Popover>
            }

            {isMobile && <Group gap={"xs"}>
                <Select
                    data={[
                        { label: "Newest", value: PublicGameSortBy.CreatedAt},
                        { label: "Time control", value: PublicGameSortBy.Clock},
                        { label: "Clock start", value: PublicGameSortBy.ClockStart},
                        { label: "Clock increment", value: PublicGameSortBy.ClockIncrement},
                        { label: "Rule count", value: PublicGameSortBy.RuleCount},
                        { label: "Bluff punishment", value: PublicGameSortBy.BluffPunishment},
                    ]}
                    value={query.sortBy}
                    onChange={v => v && setQuery(q => ({ ...q, sortBy: v as PublicGameSortBy }))}
                    w={150}
                    aria-label={"Sort by"}
                />
                <ActionIcon variant={"default"} size={36} onClick={toggleSortDir} aria-label={"Toggle sort direction"}>
                    {query.sortDir === SortDir.Asc ? "\u25B2" : "\u25BC"}
                </ActionIcon>
            </Group>}

            <div className={"flex-1"}/>

            <Text size={"sm"} c={"dimmed"}>{totalGames} open game{totalGames === 1 ? "" : "s"}</Text>
            <Tooltip label={"Refresh"}>
                <ActionIcon variant={"default"} size={36} onClick={fetchData} loading={loading} aria-label={"Refresh"}>
                    <IoRefresh size={18}/>
                </ActionIcon>
            </Tooltip>
        </div>

        {error && <Alert color={"red"} variant={"light"} title={"Couldn't load games"}>{error}</Alert>}

        {/* Games */}
        {games.length === 0
            ? !loading && <div className={"flex flex-col items-center text-center gap-3 rounded-xl border border-dashed border-white/10 py-14 px-4"}>
            <div className={"flex items-center justify-center w-12 h-12 rounded-full bg-fg-1/10 text-fg-1"}>
                <FiUsers size={22}/>
            </div>
            <div>
                <div className={"font-semibold text-fg-2"}>No open games right now</div>
                <div className={"text-sm text-fg-3 mt-0.5"}>
                    {activeFilterCount ? "Try clearing your filters, or create a game yourself." : "Create a public game and it'll show up here for others to join."}
                </div>
            </div>
            <Group gap={"sm"}>
                {activeFilterCount > 0 && <Button variant={"default"} onClick={resetFilters}>Clear filters</Button>}
                <Button variant={"light"} onClick={() => { clearError(); setCreateOpen(true); }}>Create public game</Button>
            </Group>
        </div>
            : isMobile
                // Mobile: show games as separate cards
                ? <Stack gap={"sm"}>
                    {games.map(game => (
                        <div key={game.gameId} className={"rounded-xl bg-bg-2/70 border border-white/5 p-3"}>
                            <Group justify={"space-between"} mb={4}>
                                <span className={"text-lg font-bold text-fg-2 tabular"}>{formatTimeControl(game.usesClock, game.clockStartMs, game.clockIncrementMs)}</span>
                                <Badge variant={"light"}>{game.ruleCount} rule{game.ruleCount === 1 ? "" : "s"}</Badge>
                            </Group>
                            <Text size={"sm"} c={"dimmed"} mb={"sm"}>Bluff punishment: {BLUFF_PUNISHMENT_LABELS[game.bluffPunishment]}</Text>
                            <Group grow>
                                <Button variant={"default"} onClick={() => openRulePool(game.rulePoolIds)}>
                                    Rule pool
                                </Button>
                                <Button disabled={!isConnected} onClick={() => handleJoinGame(game.gameId)}>
                                    Join
                                </Button>
                            </Group>
                        </div>
                    ))}
                </Stack>
                // Desktop: Show games as a table
                : <div className={"rounded-xl bg-bg-2/70 border border-white/5 overflow-hidden"}>
                    <Table verticalSpacing={"sm"} horizontalSpacing={"md"} classNames={{th: "text-xs font-semibold uppercase tracking-wider text-fg-3 bg-bg-1/40", tr: "border-white/5"}}>
                        <Table.Thead>
                            <Table.Tr>
                                {sortableHeader("Time control", PublicGameSortBy.Clock)}
                                {sortableHeader("Rules", PublicGameSortBy.RuleCount)}
                                {sortableHeader("Bluff punishment", PublicGameSortBy.BluffPunishment)}
                                <Table.Th>Rule pool</Table.Th>
                                <Table.Th/>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rows}
                        </Table.Tbody>
                    </Table>
                </div>
        }

        {totalGames > 0 && <Group justify={"space-between"}>
            <Group gap={"xs"}>
                <Text size={"sm"} c={"dimmed"}>Per page</Text>
                <Select
                    data={PAGE_SIZE_OPTIONS}
                    value={String(query.pageSize)}
                    onChange={handlePageSizeChange}
                    w={80}
                    size={"xs"}
                    aria-label="Games per page"
                />
            </Group>

            {totalPages > 1 && <Pagination
                total={totalPages}
                value={query.page + 1}
                onChange={p => setQuery(q => ({...q, page: p-1}))}
            />}
        </Group>}

        <Modal opened={rulePoolModalOpen} onClose={() => {setRulePoolModalOpen(false); setRulePoolIds([])}} title={"Rule pool"}>
            <RuleList enabledRuleIds={rulePoolIds} onlyShowEnabled={true} wrapChips={true}/>
        </Modal>

        <CreateGameModal
            mode={CreateGameMode.Online}
            defaultPublic={true}
            opened={createOpen}
            onClose={() => setCreateOpen(false)}
            onSubmit={createGame}
            error={createError}
        />
    </div>)

}


export default PublicGamesBrowser;