import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:4200',
        credentials: true
    },
    transports: ['websocket', 'polling']
})
@Injectable()
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, Socket>();

    constructor() {}

    handleConnection(client: Socket) {
        const email = client.handshake.query.email as string;
        if (email) {
            console.log('Socket ID on connect:', client.id);
            this.userSockets.set(email, client);
            console.log(`Client connected: ${email}`);
            console.log('Current socket count:', this.userSockets.size);
        }
    }

    handleDisconnect(client: Socket) {
        const email = client.handshake.query.email as string;
        if (email) {
            console.log('Socket ID on disconnect:', client.id);
            this.userSockets.delete(email);
            console.log(`Client disconnected: ${email}`);
            console.log('Current socket count:', this.userSockets.size);
        }
    }

    // Call this method when a new message is created
    notifyNewMessage(message: any) {
        // Notify recipient
        const recipientSocket = this.userSockets.get(message.to);
        if (recipientSocket) {
            recipientSocket.emit('messageCreated');
        }

        // Notify CC recipients
        if (message.cc && Array.isArray(message.cc) && message.cc.length > 0) {
            for (const ccEmail of message.cc) {
                const ccSocket = this.userSockets.get(ccEmail);
                if (ccSocket) {
                    ccSocket.emit('messageCreated');
                }
            }
        }
    }
}
