import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { Subject, takeUntil } from 'rxjs';

export interface SuperLikeReceivedNotification {
    superLikeId: number;
    senderId: number;
    senderName: string;
    senderEmail: string;
    receiverId: number;
    amount: string; // 50% of super like cost (100 tokens)
    createdAt: string;
    superLikesCount?: number; // Updated count of super likes received
}

export interface SuperLikeSentNotification {
    superLikeId: number;
    senderId: number;
    receiverId: number;
    receiverName: string;
    receiverEmail: string;
    cost: string; // Full cost (200 tokens)
    createdAt: string;
    superLikesCount?: number; // Updated count for the user (receiver) shown in home screen
}

export type SuperLikeNotification = SuperLikeReceivedNotification | SuperLikeSentNotification;
export type SuperLikeNotificationType = 'received' | 'sent';

@Injectable({
    providedIn: 'root'
})
export class SuperLikeNotificationService {
    private superLikeReceivedSubject = new BehaviorSubject<{ type: 'received', data: SuperLikeReceivedNotification } | null>(null);
    public superLikeReceived$: Observable<{ type: 'received', data: SuperLikeReceivedNotification } | null> = this.superLikeReceivedSubject.asObservable();
    
    private superLikeSentSubject = new BehaviorSubject<{ type: 'sent', data: SuperLikeSentNotification } | null>(null);
    public superLikeSent$: Observable<{ type: 'sent', data: SuperLikeSentNotification } | null> = this.superLikeSentSubject.asObservable();
    
    private destroy$ = new Subject<void>();

    constructor(private websocketService: WebsocketService) {
        this.setupSuperLikeNotifications();
    }

    private setupSuperLikeNotifications(): void {
        // Listen for received super likes (for receiver)
        this.websocketService.onSuperLikeReceived()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    console.log('Super like received notification:', notification);
                    this.superLikeReceivedSubject.next({ type: 'received', data: notification });
                },
                error: (error) => {
                    console.error('Error receiving super like notification:', error);
                }
            });

        // Listen for sent super likes (for sender)
        this.websocketService.onSuperLikeSent()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    console.log('✅ Super like sent notification received:', notification);
                    this.superLikeSentSubject.next({ type: 'sent', data: notification });
                },
                error: (error) => {
                    console.error('❌ Error receiving super like sent notification:', error);
                }
            });
    }

    clearReceivedNotification(): void {
        this.superLikeReceivedSubject.next(null);
    }

    clearSentNotification(): void {
        this.superLikeSentSubject.next(null);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

