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

    disconnect() {
        console.log('WebsocketService disconnect called');
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
