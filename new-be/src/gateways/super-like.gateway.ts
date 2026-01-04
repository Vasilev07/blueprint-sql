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
export class SuperLikeGateway implements OnGatewayConnection, OnGatewayDisconnect {
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

                // Join user to their own room for targeted notifications
                client.join(`user:${userIdNum}`);

                console.log(`SuperLikeGateway: User ${userIdNum} (${email}) connected`);
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
     * Emit super like notification to a specific user (receiver)
     */
    notifySuperLikeReceived(userId: number, superLikeData: any) {
        this.server.to(`user:${userId}`).emit("super-like:received", superLikeData);
        console.log(`SuperLikeGateway: Emitted super like notification to user ${userId}`);
    }

    /**
     * Emit super like sent notification to a specific user (sender)
     */
    notifySuperLikeSent(userId: number, superLikeData: any) {
        this.server.to(`user:${userId}`).emit("super-like:sent", superLikeData);
        console.log(`SuperLikeGateway: Emitted super like sent notification to user ${userId}`);
    }

    /**
     * Check if a user is online
     */
    isUserOnline(userId: number): boolean {
        return this.userIdToEmail.has(userId);
    }
}

