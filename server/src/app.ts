import express from "express";
import cookieParser from "cookie-parser"
import cors from "cors";
import {gameRepository} from "./server.js";
import { randomBytes } from 'crypto'
import type {NewSession, NewUser, User} from "./db/schema.js";
import {z, type ZodObject} from "zod";
import {
    AuthMeResponseSchema,
    type CreateGameRequest, CreateGameResponseSchema,
    CreateGameSchema,
    GameIdParamSchema, GetGameResponseSchema, GetUserGamesResponseSchema, GetUserResponseSchema, LoginResponseSchema,
    LoginSchema, LogoutResponseSchema, type PaginationQueryRequest, PaginationQuerySchema, RegisterResponseSchema,
    RegisterSchema, UserIdParamSchema
} from "@common/src/schemas/express.js";
import {
    addUser,
    deleteSessionByToken,
    emailAvailable, getFinishedGameById,
    getSessionByToken, getUserByUsernameOrEmail,
    getUserById,
    saveSession, getUserGames
} from "./db/helper.js";
import {generateGameId, generateUUID, getGameDTOFromFinishedGame} from "./helper.js";
import Game from "./game.js";
import Rule from "@common/src/rule.js";
import {DEFAULT_GUEST_SESSION_EXPIRATION, DEFAULT_USER_SESSION_EXPIRATION} from "@common/src/const.js";
import {hash, verify} from "argon2"
import {UserType} from "@common/src/index.js";


const port = parseInt(process.env.PORT || "3000");
const clientPort = parseInt(process.env.CLIENT_PORT || "5173");

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://192.168.1.201:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());
app.use(cookieParser());


declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}


// MIDDLEWARES ---------------------


const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const token = req.cookies.session_token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const session = await getSessionByToken(token);
        const isValidSession = session && session.expiresAt.getTime() > Date.now();
        if (!isValidSession) {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired session" });
        }

        const user = await getUserById(session.userId);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }
        req.user = user;

        next();
    } catch (error) {
        console.error("Error during authentication:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Express middleware to validate request body/params/query
const validate = (schema: { body?: ZodObject, params?: ZodObject, query?: ZodObject }) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            if (schema.body) schema.body.parse(req.body);
            if (schema.params) schema.params.parse(req.params);
            if (schema.query) schema.query.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Input validation failed", error: z.treeifyError(error) });
            }
            next(error);
        }
    }
}



// USERS / AUTH ---------------

// Checks if the user is logged in/a known user. if not, create a new guest user and return a new token
app.get('/api/auth/me', async (req, res) => {
    let token = req.cookies?.session_token;


    if (token) {
        const session = await getSessionByToken(token);
        const isValidSession = session && session.expiresAt.getTime() > Date.now();
        if (isValidSession) {
            const user = await getUserById(session.userId);

            if (user) {
                const response = AuthMeResponseSchema.safeParse({ userId: user.id });
                if (!response.success) {
                    console.error("GET /auth/me : Error crafting response: ", z.prettifyError(response.error));
                    return res.status(500).json({error: "Internal server error"});
                }
                return res.status(200).json(response.data);
            }
        }
    }

    // Create a new guest user and session
    const newToken = randomBytes(32).toString('hex');

    const newUser: NewUser = {
        id: generateUUID(),
        username: `Guest_${Math.floor(Math.random() * 10000)}`,
        userType: UserType.Guest,
    }
    if (!await addUser(newUser)) {
        return res.status(500).json({ message: "Failed to create guest user" });
    }

    const newSession: NewSession = {
        userId: newUser.id!,
        token: newToken,
        expiresAt: new Date(Date.now() + DEFAULT_GUEST_SESSION_EXPIRATION),
    }

    if (!await saveSession(newSession)) {
        return res.status(500).json({ message: "Failed to create guest session" });
    }

    res.cookie("session_token", newToken, {
        httpOnly: true,
        maxAge: DEFAULT_GUEST_SESSION_EXPIRATION,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })

    const response = AuthMeResponseSchema.safeParse({ userId: newUser.id });
    if (!response.success) {
        console.error("GET /auth/me : Error crafting response: ", z.prettifyError(response.error));
        return res.status(500).json({error: "Internal server error"});
    }
    return res.status(200).json(response.data);
})

// Register a new non-guest user
app.post('/api/auth/register', validate({ body: RegisterSchema }) , async (req, res) => {
    const { username, email, password } = req.body;

    if (email && !await emailAvailable(email)) {
        return res.status(400).json({ message: "Email already in use" });
    }

    const hashed_password = await hash(password);

    const newUser: NewUser = {
        username,
        email: email ?? null,
        password: hashed_password,
        userType: UserType.User,
    }

    if (!await addUser(newUser)) {
        return res.status(500).json({ message: "Failed to create user" });
    }

    const newToken = randomBytes(32).toString('hex');

    const newSession: NewSession = {
        userId: newUser.id!,
        token: newToken,
        expiresAt: new Date(Date.now() + DEFAULT_USER_SESSION_EXPIRATION),
    }

    if (!await saveSession(newSession)) {
        return res.status(500).json({ message: "Failed to create user" });
    }

    res.cookie("session_token", newToken, {
        httpOnly: true,
        maxAge: DEFAULT_USER_SESSION_EXPIRATION,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })

    const response = RegisterResponseSchema.safeParse({ message: "User created successfully" });
    if (!response.success) {
        console.error("POST /auth/register : Error crafting response: ", z.prettifyError(response.error));
        return res.status(500).json({error: "Internal server error"});
    }
    return res.status(201).json(response.data);
})

// logout/invalidate the current session
app.post('/api/auth/logout', requireAuth, async (req, res) => {
    const token = req.cookies.session_token;

    try {
        await deleteSessionByToken(token);
        res.clearCookie("session_token", {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        const response = LogoutResponseSchema.safeParse({ message: "Logged out successfully" });
        if (!response.success) {
            console.error("POST /auth/logout : Error crafting response: ", z.prettifyError(response.error));
            return res.status(500).json({error: "Internal server error"});
        }
        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Failed to logout" });
    }


})

// Login with a username and password to a non-guest account
app.post('/api/auth/login', validate({ body: LoginSchema }), async (req, res) => {

    const {usernameOrEmail, password} = req.body;

    const user = await getUserByUsernameOrEmail(usernameOrEmail);
    if (!user || user.userType === UserType.Guest || !user.password) return res.status(401).json({message: "Invalid username or password"});
    const isValidPassword = await verify(user.password, password);
    if (!isValidPassword) return res.status(401).json({message: "Invalid username or password"});

    const newToken = randomBytes(32).toString('hex')

    const newSession: NewSession = {
        userId: user.id!,
        token: newToken,
        expiresAt: new Date(Date.now() + DEFAULT_USER_SESSION_EXPIRATION),
    }

    if (!await saveSession(newSession)) {
        return res.status(500).json({ message: "Failed to login" });
    }

    res.cookie("session_token", newToken, {
        httpOnly: true,
        maxAge: DEFAULT_USER_SESSION_EXPIRATION,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })

    const response = LoginResponseSchema.safeParse({ message: "Logged in successfully" })
    if (!response.success) {
        console.error("POST /auth/login : Error crafting response: ", z.prettifyError(response.error));
        return res.status(500).json({error: "Internal server error"});
    }
    return res.status(200).json(response.data);
})

// GAMES ----------------------

// Creates a game
app.post('/api/games', validate({ body: CreateGameSchema }), requireAuth, async (req, res) => {

    const user = req.user!;
    const { color, bluffPunishment, ruleCount, rulePoolIds, usesClock, clockStartSeconds, clockIncrementSeconds } = req.body as CreateGameRequest;
    const rulePool = rulePoolIds.map(ruleId => Rule.getRuleFromId(ruleId)).filter(rule => rule !== undefined);


    let gameId = generateGameId(6);
    while (gameRepository.getById(gameId))
        gameId = Math.random().toString(36).substring(2, 8);
    const game = new Game(gameId, ruleCount, rulePool, bluffPunishment, usesClock, clockStartSeconds !== undefined ? clockStartSeconds * 1000 : undefined, clockIncrementSeconds !== undefined ? clockIncrementSeconds * 1000 : undefined);

    gameRepository.save(game);
    console.log(`Creating game ${gameId} for player ${user.id} with options: Color: ${color}, timeStart: ${clockStartSeconds} * 1000, timeIncrement: ${clockIncrementSeconds} * 1000, bluffPunishment: ${bluffPunishment}, ruleCount: ${ruleCount}, rulePool: ${rulePoolIds}`);

    const response = CreateGameResponseSchema.safeParse({ gameId });
    if (!response.success) {
        console.error("POST /games : Error crafting response: ", z.prettifyError(response.error));
        return res.status(500).json({error: "Internal server error"});
    }
    return res.status(200).json(response.data);
})

// Gets a game by id
app.get('/api/games/:gameId', validate({ params: GameIdParamSchema }), async (req, res) => {
    const gameId = req.params.gameId!;
    const game = gameRepository.getById(gameId);

    if (game) {
        const response = GetGameResponseSchema.safeParse(game.getGameDTO());
        if (!response.success) {
            console.error("GET /games/:gameID : Error crafting response: ", z.prettifyError(response.error));
            return res.status(500).json({error: "Internal server error"});
        }
        return res.status(200).json(response.data);
    }

    const finishedGame = await getFinishedGameById(gameId);

    if (finishedGame) {
        const response = GetGameResponseSchema.safeParse(await getGameDTOFromFinishedGame(finishedGame));
        if (!response.success) {
            console.error("GET /games/:gameID : Error crafting response: ", z.prettifyError(response.error));
            return res.status(500).json({error: "Internal server error"});
        }
        return res.status(200).json(response.data);
    }

    return res.status(404).json({error: "Game not found"});

})

// USERS --------------------

// Get the games a user has played
app.get('/api/users/:userId/games', validate({ params: UserIdParamSchema, query: PaginationQuerySchema }),  async (req, res) => {
   const { userId } = UserIdParamSchema.parse(req.params);
   const { page, pageSize } = PaginationQuerySchema.parse(req.query);

   const user = await getUserById(userId);
   if (!user) return res.status(404).json({error: "User not found"});

   const userGames = await getUserGames(userId, page, pageSize).then(games => games.map(async game => await getGameDTOFromFinishedGame(game)));

   const response = GetUserGamesResponseSchema.safeParse({userGames});
   if (!response.success) {
       console.error("GET /users/:userId/games : Error crafting response: ", z.prettifyError(response.error));
       return res.status(500).json({error: "Internal server error"});
   }
   res.status(200).json(response.data);
});



// Get the public information on a user
app.get('/api/users/:userId', validate({ params: UserIdParamSchema }), async (req, res) => {
    const { userId } = UserIdParamSchema.parse(req.params);

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({error: "User not found"});

    const response = GetUserResponseSchema.safeParse({
        id: user.id,
        username: user.username,
    })

    if (!response.success) {
        console.error("GET /users/:userID : Error crafting response: ", z.prettifyError(response.error));
        return res.status(500).json({error: "Internal server error"});
    }
    res.status(200).json(response.data);
});


export default app;