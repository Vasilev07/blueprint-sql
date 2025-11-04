import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { Subject, takeUntil } from 'rxjs';

export interface GiftNotification {
    giftId: number;
    senderId: number;
    senderName: string;
    senderEmail: string;
    giftEmoji: string;
    amount: string;
    message: string | null;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class GiftNotificationService {
    private giftReceivedSubject = new BehaviorSubject<GiftNotification | null>(null);
    public giftReceived$: Observable<GiftNotification | null> = this.giftReceivedSubject.asObservable();
    
    private destroy$ = new Subject<void>();

    constructor(private websocketService: WebsocketService) {
        this.setupGiftNotifications();
    }

    private setupGiftNotifications(): void {
        this.websocketService.onGiftReceived()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    console.log('Gift received notification:', notification);
                    this.giftReceivedSubject.next(notification);
                },
                error: (error) => {
                    console.error('Error receiving gift notification:', error);
                }
            });
    }

    clearNotification(): void {
        this.giftReceivedSubject.next(null);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

