import type {Server, Socket} from "socket.io";
import {
    type GameChatMessageResponse,
    type GameChatSendRequest,
    GameChatSendSchema,
    type GenericCallback
} from "@common/src/index.js";
import {validateSocketPayload} from "../index.js";
import type {User} from "../../db/schema.js";
import {gameRepository} from "../../server.js";

export default function chatHandler(io: Server) {

    function sendChat(this: Socket, payload: GameChatSendRequest, callback: GenericCallback) {
        const parsed: GameChatSendRequest = validateSocketPayload(payload, GameChatSendSchema, "game:chat:send");
        const { gameId, message } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        const player = game.getPlayer(user.id);

        if (!player) {
            callback(false, "Player not in match");
            return;
        }

        if (message.length > 255) {
            callback(false, "Message is too long");
            return;
        }

        const responsePayload: GameChatMessageResponse = {
            userId: user.id,
            username: user.username,
            message: message,
        }

        this.to(gameId).emit("game:chat:message", responsePayload);
        callback(true, "Message sent");
        return;

    }





    return {
        sendChat
    }
}