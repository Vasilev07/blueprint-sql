import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
export class FriendGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, Socket>();

    handleConnection(client: Socket) {
        const email = (client.handshake.query.email as string) || '';
        const key = email.toLowerCase();
        if (key) {
            this.userSockets.set(key, client);
            console.log(`FriendGateway: User connected: ${key}`);
            console.log(`FriendGateway: Total connected users: ${this.userSockets.size}`);
        }
    }

    handleDisconnect(client: Socket) {
        const email = (client.handshake.query.email as string) || '';
        const key = email.toLowerCase();
        if (key) {
            this.userSockets.delete(key);
        }
    }

    emitToEmail(email: string, event: string, payload?: any) {
        const key = (email || '').toLowerCase();
        console.log(`FriendGateway: Attempting to emit ${event} to ${key}`);
        console.log(`FriendGateway: Available users: ${Array.from(this.userSockets.keys()).join(', ')}`);
        
        const socket = this.userSockets.get(key);
        if (socket) {
            socket.emit(event, payload);
            console.log(`FriendGateway: Successfully emitted ${event} to ${key}`);
        } else {
            console.log(`FriendGateway: No socket found for ${key}`);
        }
    }
}


