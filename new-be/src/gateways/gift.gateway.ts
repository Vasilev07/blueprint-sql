import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";
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
export class GiftGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, Socket>();
    private userIdToEmail = new Map<number, string>();

    constructor(private entityManager: EntityManager) {}

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

                console.log(`GiftGateway: User ${userIdNum} (${email}) connected`);
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
        }
    }

    /**
     * Emit gift notification to a specific user
     */
    notifyGiftReceived(userId: number, giftData: any) {
        this.server.to(`user:${userId}`).emit("gift:received", giftData);
        console.log(`GiftGateway: Emitted gift notification to user ${userId}`);
    }

    /**
     * Check if a user is online
     */
    isUserOnline(userId: number): boolean {
        return this.userIdToEmail.has(userId);
    }

    /**
     * Get online user IDs
     */
    getOnlineUserIds(): number[] {
        return Array.from(this.userIdToEmail.keys());
    }
}

