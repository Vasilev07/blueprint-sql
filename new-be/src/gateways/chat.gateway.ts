import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";
import { ChatService } from "../services/chat.service";
import { EntityManager } from "typeorm";
import { User } from "../entities/user.entity";

@WebSocketGateway({
    cors: {
        origin: ["http://localhost:4200", "app.impulseapp.net"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
})
@Injectable()
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, Socket>();
    private userIdToEmail = new Map<number, string>();

    constructor(
        private chatService: ChatService,
        private entityManager: EntityManager,
    ) {}

    async handleConnection(client: Socket) {
        const email = client.handshake.query.email as string;
        const userId = client.handshake.query.userId as string;

        if (email) {
            this.userSockets.set(email, client);
            if (userId) {
                const userIdNum = parseInt(userId);
                this.userIdToEmail.set(userIdNum, email);

                // Join user to their own room for targeted notifications
                client.join(`user:${userIdNum}`);

                // Update lastOnline timestamp in database
                await this.updateLastOnline(userIdNum);

                // Broadcast online status change
                this.server.emit("user:online", { email, userId: userIdNum });
            }
        }
    }

    handleDisconnect(client: Socket) {
        const email = client.handshake.query.email as string;
        const userId = client.handshake.query.userId as string;

        if (email) {
            this.userSockets.delete(email);
            if (userId) {
                const userIdNum = parseInt(userId);
                this.userIdToEmail.delete(userIdNum);
                
                // Leave user room
                client.leave(`user:${userIdNum}`);
            }
            // Broadcast offline status change
            this.server.emit("user:offline", {
                email,
                userId: parseInt(userId),
            });
        }
    }

    getOnlineUserIds(): number[] {
        return Array.from(this.userIdToEmail.keys());
    }

    isUserOnline(userId: number): boolean {
        return this.userIdToEmail.has(userId);
    }

    private async updateLastOnline(userId: number): Promise<void> {
        try {
            await this.entityManager.update(
                User,
                { id: userId },
                { lastOnline: new Date() },
            );
        } catch (error) {
            console.error(
                `Failed to update lastOnline for user ${userId}:`,
                error,
            );
        }
    }

    @SubscribeMessage("chat:send")
    async handleSend(
        @MessageBody()
        payload: {
            conversationId?: number;
            senderId: number;
            recipientId: number;
            content: string;
        },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Update sender's lastOnline timestamp
            await this.updateLastOnline(payload.senderId);

            let conversationId = payload.conversationId;
            if (!conversationId) {
                const conv = await this.chatService.getOrCreateConversation(
                    payload.senderId,
                    payload.recipientId,
                );
                conversationId = conv.id;
            }
            const message = await this.chatService.sendMessage(
                conversationId,
                payload.senderId,
                payload.content,
                "text",
            );
            this.server.emit(`chat:message:${conversationId}`, message);
            this.server.emit("chat:message", { conversationId, message });
            return message;
        } catch (err: any) {
            // Normalize error for WS pipeline to avoid instanceof issues
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to send chat message";
            return { error: true, message };
        }
    }
}
