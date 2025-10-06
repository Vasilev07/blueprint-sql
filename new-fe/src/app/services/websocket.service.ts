import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Observable } from 'rxjs';
import { MessageDTO } from '../../typescript-api-client/src/model/models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    private socket: Socket;

    constructor(private authService: AuthService) {
        console.log('WebsocketService constructor called');
        const email = this.authService.getUserEmail();
        this.socket = io('http://localhost:3000', {
            query: { email }
        });
        console.log('Socket created for:', email);
    }

    subscribeToMessages(): Observable<void> {
        return new Observable<void>(observer => {
            this.socket.on('messageCreated', () => {
                observer.next();
            });
        });
    }

    onPresenceSnapshot(): Observable<string[]> {
        return new Observable<string[]>(observer => {
            this.socket.on('presence:snapshot', (onlineEmails: string[]) => {
                observer.next(onlineEmails || []);
            });
        });
    }

    onPresenceOnline(): Observable<string> {
        return new Observable<string>(observer => {
            this.socket.on('presence:online', (email: string) => {
                observer.next(email);
            });
        });
    }

    onPresenceOffline(): Observable<string> {
        return new Observable<string>(observer => {
            this.socket.on('presence:offline', (email: string) => {
                observer.next(email);
            });
        });
    }

    onFriendRequestCreated(): Observable<void> {
        return new Observable<void>(observer => {
            this.socket.on('friend:request:created', () => {
                console.log('WebSocket: Received friend:request:created');
                observer.next();
            });
        });
    }

    onFriendRequestUpdated(): Observable<void> {
        return new Observable<void>(observer => {
            this.socket.on('friend:request:updated', () => {
                console.log('WebSocket: Received friend:request:updated');
                observer.next();
            });
        });
    }

    onFriendListUpdated(): Observable<void> {
        return new Observable<void>(observer => {
            this.socket.on('friend:list:updated', () => {
                console.log('WebSocket: Received friend:list:updated');
                observer.next();
            });
        });
    }

    // Chat helpers
    sendChat(payload: { conversationId?: number; senderId: number; recipientId: number; content: string }) {
        this.socket.emit('chat:send', payload);
    }

    onChatMessage(conversationId: number): Observable<any> {
        return new Observable<any>(observer => {
            const event = `chat:message:${conversationId}`;
            this.socket.on(event, (message: any) => {
                observer.next(message);
            });
        });
    }

    disconnect() {
        console.log('WebsocketService disconnect called');
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
