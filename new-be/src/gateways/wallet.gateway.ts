import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";

@WebSocketGateway({
    cors: {
        origin: ["http://localhost:4200", "app.impulseapp.net"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
})
@Injectable()
export class WalletGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, Socket>();
    private userIdToEmail = new Map<number, string>();

    async handleConnection(client: Socket) {
        const email = client.handshake.query.email as string;
        const userId = client.handshake.query.userId as string;

        if (email) {
            this.userSockets.set(email, client);
            if (userId) {
                const userIdNum = parseInt(userId);
                this.userIdToEmail.set(userIdNum, email);

                // Join user to their own room for targeted balance notifications
                client.join(`user:${userIdNum}`);

                console.log(
                    `WalletGateway: User ${userIdNum} (${email}) connected`,
                );
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
     * Emit balance update to a specific user
     */
    notifyBalanceUpdate(userId: number, balance: string) {
        this.server.to(`user:${userId}`).emit("wallet:balance:update", {
            userId,
            balance,
        });
        console.log(
            `WalletGateway: Emitted balance update to user ${userId}: ${balance}`,
        );
    }

    /**
     * Check if a user is online
     */
    isUserOnline(userId: number): boolean {
        return this.userIdToEmail.has(userId);
    }
}
