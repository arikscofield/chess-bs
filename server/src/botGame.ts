import Game from "./game.js";
import {
    BluffPunishment,
    Bot,
    BOT_UUID,
    type BotDecision,
    BotDifficulty,
    type BotInput,
    Color,
    CreateGameColor,
    EasyBot,
    GameStatus,
    getMoveNotation,
    HardBot,
    MediumBot,
    type Move,
    nextTurnColor, RandomBot,
    type Turn
} from "@chess-bs/common";
import Rule from "@chess-bs/common/dist/rule.js";
import Player from "./player.js";
import {handleBotMove} from "./socket/game/bot.js";
import {colorToCreateGameColor, createGameColorToColor} from "./helper.js";


export default class BotGame extends Game {
    player: Player;
    playerColor: Color;
    bot: Bot;
    botColor: Color;
    botRules: Rule[];
    botDifficulty: BotDifficulty;
    botPlayer: Player;

    constructor(
        gameId: string,
        ruleCount: number,
        rulePool: Rule[],
        bluffPunishment: BluffPunishment,
        creatorId: string,
        creatorColor: CreateGameColor,
        botDifficulty: BotDifficulty,
        fen?: string
    ) {
        super(gameId, ruleCount, rulePool, bluffPunishment, creatorId, creatorColor, false, undefined, undefined, fen);
        this.playerColor = creatorColor === CreateGameColor.White
            ? Color.White
            : creatorColor === CreateGameColor.Black
                ? Color.Black
                : Object.values(Color)[Math.floor(Math.random() * Object.values(Color).length)] || Color.White;
        this.botColor = nextTurnColor(this.playerColor);
        this.botRules = Rule.getRandomRules(ruleCount, rulePool);

        this.botDifficulty = botDifficulty;
        let botUsername = "";
        switch (botDifficulty) {
            case BotDifficulty.Easy:
                this.bot = new EasyBot(this.botColor, this.botRules, rulePool);
                botUsername = "Easy Bot";
                break;
            default:
            case BotDifficulty.Medium:
                this.bot = new MediumBot(this.botColor, this.botRules, rulePool);
                botUsername = "Medium Bot";
                break;
            case BotDifficulty.Hard:
                this.bot = new HardBot(this.botColor, this.botRules, rulePool);
                botUsername = "Hard Bot";
                break;
            case BotDifficulty.Random:
                this.bot = new RandomBot(this.botColor, this.botRules, rulePool);
                botUsername = "Random Bot";
                break;
        }
        this.botPlayer = new Player(BOT_UUID, this.botColor, this.botRules, botUsername);

        const playerRules = Rule.getRandomRules(ruleCount, rulePool);
        this.player = new Player(creatorId, this.playerColor, playerRules, undefined);
        this.players = [this.player, this.botPlayer]

        this.gameStatus = GameStatus.RUNNING

        if (this.botColor === Color.White)
            handleBotMove(this);
    }


    public addPlayer(playerId: string, color?: Color, username?: string): Player | null {
        return null;
    }


    public getPlayer(playerId: string): Player | null {
        if (this.player && this.player.userId === playerId) return this.player;
        return null;
    }

    public makeMove(move: Move, player: Player, appliedAt: number=Date.now()): boolean {
        // if (this.player?.userId !== player.userId) return false;

        const prevBoard = this.currentBoard.clone();
        const legalMoves: Move[] = this.currentBoard.getLegalMoves(move.from, true);
        if (!move.notation) move.notation = getMoveNotation(this.currentBoard, move);
        if (!move.timestamp) move.timestamp = appliedAt;


        const applyMove = (wasBluff: boolean) => {
            if (!this.currentBoard.applyMove(move)) {
                return false;
            }

            this.lastMoveWasBluff = wasBluff;
            this.prevBoard = prevBoard;

            // Add move to game history
            const moveCopy = structuredClone(move);
            delete moveCopy.bluff;
            moveCopy.timestamp = appliedAt;
            this.turnHistory.push(moveCopy);

            // Change turn
            this.turnColor = this.turnColor === Color.White ? Color.Black : Color.White;

            return true;
        }

        if (legalMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal regular chess move
            return applyMove(false);
        }

        let legalRuleMoves: Move[] = [];
        for (const rule of player.rules) {
            legalRuleMoves = legalRuleMoves.concat(rule.getLegalMoves(this.currentBoard, move.from));
        }
        if (legalRuleMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal special rule move
            return applyMove(false);
        }

        // Bluffing
        if (move.bluff) {
            return applyMove(true);
        }

        // Non-legal move
        return false;
    }


    public getBotMove(): BotDecision {
        const prevTurn: Turn | undefined = this.turnHistory[this.turnHistory.length - 1];
        const prevMove: Move | undefined = (prevTurn && "from" in prevTurn) ? prevTurn : undefined;

        const botInput: BotInput = {
            board: this.currentBoard,
            preMoveBoard: this.prevBoard ?? undefined,
            opponentLastMove: prevMove,
        }

        return this.bot?.decide(botInput);
    }

    public createRematchGame(newGameId: string): BotGame {
        const prevCreatorColor: Color = this.creatorColor === CreateGameColor.Random ? this.players.find(p => p.userId === this.creatorId)?.color ?? Color.White : createGameColorToColor(this.creatorColor);
        const newGame = new BotGame(
            newGameId,
            this.ruleCount,
            this.rulePool.map(r => Rule.getRuleFromId(r.id)).filter(r => r !== undefined),
            this.bluffPunishment,
            this.creatorId,
            colorToCreateGameColor(nextTurnColor(prevCreatorColor)),
            this.botDifficulty,
        );
        newGame.gameStatus = GameStatus.RUNNING;
        newGame.players = this.players.map(p => {
            p.color = p.color === Color.White ? Color.Black : Color.White
            return p;
        })
        newGame.maxPlayers = this.maxPlayers;

        return newGame;

    }



}