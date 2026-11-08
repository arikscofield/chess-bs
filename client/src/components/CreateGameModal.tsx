import {
    Alert,
    Button,
    Collapse,
    Group,
    Modal,
    NumberInput,
    SegmentedControl,
    Select,
    Slider,
    Text,
    UnstyledButton,
} from "@mantine/core";
import {type ReactNode, useEffect, useState} from "react";
import {
    allRules,
    BluffPunishment,
    BotDifficulty,
    type CreateBotGameRequest,
    CreateGameColor,
    type CreateGameRequest,
    GameVisibility
} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import {useMediaQuery} from "@mantine/hooks";
import {
    BLUFF_PUNISHMENT_LABELS,
    BOT_DIFFICULTY_LABELS,
    CreateGameMode,
    IMPLEMENTED_BLUFF_PUNISHMENTS
} from "../utils/const.ts";
import {FiChevronDown, FiGlobe, FiLock} from "react-icons/fi";
import RuleList from "./RuleList.tsx";


const CLOCK_START_VALUES = [
    0, 0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 25, 30, 35, 40, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
];
const CLOCK_INCREMENT_VALUES = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 25, 30, 35, 40, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
];

type ClockPreset = { id: string, label: string, sub?: string, start?: number, increment?: number };
const CLOCK_PRESETS: ClockPreset[] = [
    {id: "none", label: "∞", sub: "Unlimited"},
    {id: "1+0", label: "1+0", sub: "Bullet", start: 1, increment: 0},
    {id: "3+2", label: "3+2", sub: "Blitz", start: 3, increment: 2},
    {id: "5+3", label: "5+3", sub: "Blitz", start: 5, increment: 3},
    {id: "10+5", label: "10+5", sub: "Rapid", start: 10, increment: 5},
    {id: "15+10", label: "15+10", sub: "Rapid", start: 15, increment: 10},
    {id: "custom", label: "Custom", sub: "Pick"},
];

/** Wrapper for adjustable fields when creating game */
function Field({label, hint, children}: { label: string, hint?: ReactNode, children: ReactNode }) {
    return <div className={"flex flex-col gap-1.5 w-full"}>
        <div className={"flex flex-row items-baseline justify-between gap-2"}>
            <Text size={"sm"} fw={600}>{label}</Text>
            {hint && <Text size={"xs"} c={"dimmed"}>{hint}</Text>}
        </div>
        {children}
    </div>
}

function ColorOption({src, label}: { src: string, label: string }) {
    return <div className={"flex flex-row items-center justify-center gap-1.5"}>
        <img src={src} alt={""} width={22} height={22} draggable={false}/>
        <span>{label}</span>
    </div>
}

type Props = {
    opened: boolean,
    onClose: () => void,
    error?: string,
} & (
    | { mode: CreateGameMode.Online, onSubmit: (payload: CreateGameRequest) => Promise<boolean>, defaultPublic?: boolean }
    | { mode: CreateGameMode.Bot, onSubmit: (payload: CreateBotGameRequest) => Promise<boolean> }
    );

function CreateGameModal(props: Props) {
    const {opened, onClose, error, mode} = props;
    const isMobile = useMediaQuery("(max-width: 48em)") ?? false;

    const [gameVisibility, setGameVisibility] = useState<GameVisibility>(mode === CreateGameMode.Online && props.defaultPublic ? GameVisibility.Public : GameVisibility.Private);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(BotDifficulty.Medium);

    const [clockPreset, setClockPreset] = useState<string>("none");
    const [clockStartIndex, setClockStartIndex] = useState(CLOCK_START_VALUES.indexOf(5));
    const [clockIncrementIndex, setClockIncrementIndex] = useState(CLOCK_INCREMENT_VALUES.indexOf(3));

    const [ruleCount, setRuleCount] = useState<number | string>(3);
    const [rulePoolIds, setRulePoolIds] = useState<number[]>(allRules.map(rule => rule.id));
    const [rulePoolOpen, setRulePoolOpen] = useState<boolean>(false);

    const [bluffPunishment, setBluffPunishment] = useState<BluffPunishment>(BluffPunishment.Turn);
    const [color, setColor] = useState<CreateGameColor>(CreateGameColor.White);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (opened) setSubmitting(false);
    }, [opened]);

    const preset = CLOCK_PRESETS.find(p => p.id === clockPreset);
    const usesClock = clockPreset !== "none";
    const clockStart = clockPreset === "custom" ? CLOCK_START_VALUES[clockStartIndex] : preset?.start ?? 0;
    const clockIncrement = clockPreset === "custom" ? CLOCK_INCREMENT_VALUES[clockIncrementIndex] : preset?.increment ?? 0;

    const ruleCountError = typeof ruleCount !== "number" || ruleCount < 1
        ? "Must be at least 1"
        : ruleCount > rulePoolIds.length
            ? `Only ${rulePoolIds.length} rule${rulePoolIds.length === 1 ? "" : "s"} enabled`
            : null;

    async function handleSubmit() {
        if (ruleCountError) return;
        setSubmitting(true);
        const base = {
            color,
            bluffPunishment,
            ruleCount: ruleCount as number,
            rulePoolIds,
        };
        let ok: boolean;
        if (props.mode === CreateGameMode.Online) {
            const payload: CreateGameRequest = {
                ...base,
                gameVisibility,
                usesClock,
            };
            if (usesClock) {
                payload.clockStartSeconds = Math.round(clockStart * 60);
                payload.clockIncrementSeconds = clockIncrement;
            }
            ok = await props.onSubmit(payload);
        } else {
            ok = await props.onSubmit({...base, botDifficulty});
        }
        if (!ok) setSubmitting(false);
    }

    return (<Modal
        opened={opened}
        onClose={onClose}
        size={520}
        title={mode == CreateGameMode.Bot ? "Play against a bot" : "Create a game"}
        fullScreen={isMobile}
        classNames={{body: "flex flex-col gap-5 pt-1"}}
    >
        {/* Visibility / Bot difficulty */}
        {mode === CreateGameMode.Online
            ? <Field label={"Visibility"} hint={gameVisibility === GameVisibility.Public
                ? "Listed in the public games browser"
                : "Only people with the link can join"}>
                <SegmentedControl
                    fullWidth
                    value={gameVisibility}
                    onChange={v => setGameVisibility(v as GameVisibility)}
                    data={[
                        {value: GameVisibility.Private, label: <Group gap={6} justify={"center"} wrap={"nowrap"}><FiLock/>Private</Group>},
                        {value: GameVisibility.Public, label: <Group gap={6} justify={"center"} wrap={"nowrap"}><FiGlobe/>Public</Group>},
                    ]}
                />
            </Field>
            : <Field label={"Difficulty"}>
                <SegmentedControl
                    fullWidth
                    value={botDifficulty}
                    onChange={v => setBotDifficulty(v as BotDifficulty)}
                    data={[BotDifficulty.Easy, BotDifficulty.Medium, BotDifficulty.Hard, BotDifficulty.Random]
                        .map(d => ({value: d, label: BOT_DIFFICULTY_LABELS[d]}))}
                />
            </Field>
        }

        {/* Time control (bots don't use clocks) */}
        {mode === CreateGameMode.Online && <Field label={"Time control"} hint={usesClock ? `${clockStart} min + ${clockIncrement} sec` : "No clock"}>
            <div className={"grid grid-cols-4 sm:grid-cols-7 gap-1.5"}>
                {CLOCK_PRESETS.map(p => {
                    const selected = p.id === clockPreset;
                    return <UnstyledButton
                        key={p.id}
                        onClick={() => setClockPreset(p.id)}
                        aria-pressed={selected}
                        className={`flex flex-col items-center justify-center rounded-md py-1.5 border transition-colors
                            ${selected
                            ? "border-fg-1 bg-fg-1/15 text-fg-2"
                            : "border-white/10 bg-bg-1/60 text-fg-3 hover:border-white/25 hover:text-fg-2"}`}
                    >
                        <span className={"text-sm font-semibold tabular"}>{p.label}</span>
                        <span className={"text-[10px] uppercase tracking-wide opacity-70"}>{p.sub}</span>
                    </UnstyledButton>
                })}
            </div>
            <Collapse in={clockPreset === "custom"}>
                <div className={"flex flex-col gap-3 pt-2 px-1"}>
                    <div>
                        <Text size={"xs"} c={"dimmed"} mb={4}>Minutes per side: <b className={"text-fg-2"}>{CLOCK_START_VALUES[clockStartIndex]}</b></Text>
                        <Slider
                            value={clockStartIndex}
                            onChange={setClockStartIndex}
                            min={0}
                            max={CLOCK_START_VALUES.length - 1}
                            label={i => CLOCK_START_VALUES[i]}
                        />
                    </div>
                    <div>
                        <Text size={"xs"} c={"dimmed"} mb={4}>Increment in seconds: <b className={"text-fg-2"}>{CLOCK_INCREMENT_VALUES[clockIncrementIndex]}</b></Text>
                        <Slider
                            value={clockIncrementIndex}
                            onChange={setClockIncrementIndex}
                            min={0}
                            max={CLOCK_INCREMENT_VALUES.length - 1}
                            label={i => CLOCK_INCREMENT_VALUES[i]}
                        />
                    </div>
                </div>
            </Collapse>
        </Field>}

        {/* Rules */}
        <div className={"grid grid-cols-1 sm:grid-cols-2 gap-4"}>
            <Field label={"Secret rules per player"}>
                <NumberInput
                    value={ruleCount}
                    onChange={setRuleCount}
                    allowDecimal={false}
                    allowNegative={false}
                    min={1}
                    max={rulePoolIds.length}
                    error={ruleCountError}
                />
            </Field>
            <Field label={"Bluff punishment"}>
                <Select
                    value={bluffPunishment}
                    allowDeselect={false}
                    onChange={v => v && setBluffPunishment(v as BluffPunishment)}
                    data={Object.values(BluffPunishment).map(p => ({
                        value: p,
                        label: BLUFF_PUNISHMENT_LABELS[p] + (IMPLEMENTED_BLUFF_PUNISHMENTS.includes(p) ? "" : " (soon)"),
                        disabled: !IMPLEMENTED_BLUFF_PUNISHMENTS.includes(p),
                    }))}
                />
            </Field>
        </div>

        {/* Rule pool */}
        <div className={"rounded-lg border border-white/10 bg-bg-1/40"}>
            <UnstyledButton
                onClick={() => setRulePoolOpen(o => !o)}
                className={"flex flex-row items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"}
                aria-expanded={rulePoolOpen}
            >
                <div>
                    <Text size={"sm"} fw={600}>Rule pool</Text>
                    <Text size={"xs"} c={"dimmed"}>
                        {rulePoolIds.length === allRules.length
                            ? `All ${allRules.length} rules enabled`
                            : `${rulePoolIds.length} of ${allRules.length} rules enabled`}
                        {" · "}rules are drawn from this pool
                    </Text>
                </div>
                <FiChevronDown className={`text-fg-3 transition-transform ${rulePoolOpen ? "rotate-180" : ""}`}/>
            </UnstyledButton>
            <Collapse in={rulePoolOpen}>
                <div className={"border-t border-white/10"}>
                    <RuleList enabledRuleIds={rulePoolIds} setEnabledRuleIds={setRulePoolIds} size={"xs"} wrapChips={true}/>
                </div>
            </Collapse>
        </div>

        {/* Color */}
        <Field label={"Play as"}>
            <SegmentedControl
                fullWidth
                value={color}
                onChange={v => setColor(v as CreateGameColor)}
                data={[
                    {value: CreateGameColor.White, label: <ColorOption src={pieceImages["WhiteKing"]} label={"White"}/>},
                    {value: CreateGameColor.Random, label: <ColorOption src={pieceImages["RandomKing"]} label={"Random"}/>},
                    {value: CreateGameColor.Black, label: <ColorOption src={pieceImages["BlackKing"]} label={"Black"}/>},
                ]}
            />
        </Field>

        {error && <Alert color={"red"} variant={"light"} title={"Couldn't create game"}>{error}</Alert>}

        <Group justify={"flex-end"} gap={"sm"} mt={4}>
            <Button variant={"default"} onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!!ruleCountError} loading={submitting}>
                {mode === CreateGameMode.Bot ? "Start game" : "Create game"}
            </Button>
        </Group>

    </Modal>)
}


export default CreateGameModal;